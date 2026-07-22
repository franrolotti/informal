import { NextResponse } from "next/server";
import { Chess, validateFen, type Move } from "chess.js";

export const runtime = "nodejs";

const MODEL = process.env.OPENAI_CHESS_MODEL || "gpt-5.4-nano";
const MAX_BODY_BYTES = 512;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;
const INPUT_USD_PER_MTOK = Number(
  process.env.OPENAI_CHESS_INPUT_USD_PER_MTOK || "0.20"
);
const CACHED_INPUT_USD_PER_MTOK = Number(
  process.env.OPENAI_CHESS_CACHED_INPUT_USD_PER_MTOK || "0.02"
);
const OUTPUT_USD_PER_MTOK = Number(
  process.env.OPENAI_CHESS_OUTPUT_USD_PER_MTOK || "1.25"
);

interface ChatUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  prompt_tokens_details?: {
    cached_tokens?: number;
  };
}

type RateBucket = { count: number; resetAt: number };

const rateBuckets = new Map<string, RateBucket>();

function legalMoves(chess: Chess): Move[] {
  return chess.moves({ verbose: true });
}

function moveId(move: Move): string {
  return `${move.from}${move.to}${move.promotion || ""}`;
}

function estimateCost(usage: ChatUsage | undefined): number {
  const input = usage?.prompt_tokens || 0;
  const cached = usage?.prompt_tokens_details?.cached_tokens || 0;
  const uncached = Math.max(0, input - cached);
  const output = usage?.completion_tokens || 0;
  return (
    (uncached * INPUT_USD_PER_MTOK +
      cached * CACHED_INPUT_USD_PER_MTOK +
      output * OUTPUT_USD_PER_MTOK) /
    1_000_000
  );
}

function normalizeMove(raw: string): string {
  const match = raw
    .trim()
    .toLowerCase()
    .match(/[a-h][1-8][a-h][1-8][qrbn]?/);
  return match?.[0] || "";
}

function json(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

function allowedOrigins(): Set<string> {
  const raw = [
    process.env.OPENAI_ALLOWED_ORIGINS,
    process.env.NEXT_PUBLIC_SITE_URL,
  ]
    .filter(Boolean)
    .join(",");

  return new Set(
    raw
      .split(",")
      .map((origin) => origin.trim().replace(/\/$/, ""))
      .filter(Boolean)
  );
}

function requestOrigin(request: Request): string {
  const origin = request.headers.get("origin");
  if (origin) return origin.replace(/\/$/, "");

  const referer = request.headers.get("referer");
  if (!referer) return "";

  try {
    return new URL(referer).origin;
  } catch {
    return "";
  }
}

function assertAllowedOrigin(request: Request): NextResponse | null {
  const allowed = allowedOrigins();
  if (allowed.size === 0) {
    return json(
      {
        error:
          "Falta configurar OPENAI_ALLOWED_ORIGINS o NEXT_PUBLIC_SITE_URL antes de activar OpenAI.",
      },
      { status: 503 }
    );
  }

  const origin = requestOrigin(request);
  if (!origin || !allowed.has(origin)) {
    return json({ error: "Origen no permitido." }, { status: 403 });
  }

  return null;
}

function clientId(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function assertRateLimit(request: Request): NextResponse | null {
  const now = Date.now();
  const id = clientId(request);
  const current = rateBuckets.get(id);

  if (!current || current.resetAt <= now) {
    rateBuckets.set(id, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  current.count += 1;
  if (current.count <= RATE_LIMIT_MAX) return null;

  return json(
    { error: "Demasiadas solicitudes. Probá de nuevo en unos segundos." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((current.resetAt - now) / 1000)),
      },
    }
  );
}

function assertSmallJsonRequest(request: Request): NextResponse | null {
  const type = request.headers.get("content-type") || "";
  if (!type.toLowerCase().includes("application/json")) {
    return json({ error: "Content-Type inválido." }, { status: 415 });
  }

  const rawLength = request.headers.get("content-length");
  if (rawLength) {
    const length = Number(rawLength);
    if (!Number.isFinite(length) || length > MAX_BODY_BYTES) {
      return json({ error: "Payload demasiado grande." }, { status: 413 });
    }
  }

  return null;
}

async function readJsonBody(request: Request): Promise<{ fen?: string } | null> {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    throw new Error("too-large");
  }

  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  return parsed as { fen?: string };
}

function tooLargeBody() {
  return json({ error: "Payload demasiado grande." }, { status: 413 });
}

function invalidJson() {
  return json({ error: "JSON inválido." }, { status: 400 });
}

function invalidFenBody(body: { fen?: string } | null) {
  if (!body || typeof body.fen !== "string" || body.fen.length > 100) {
    return json({ error: "FEN inválido." }, { status: 400 });
  }

  return null;
}

function payloadTooLargeError(error: unknown): boolean {
  return error instanceof Error && error.message === "too-large";
}

export async function POST(request: Request) {
  if (process.env.OPENAI_CHESS_ENABLED !== "true") {
    return json(
      {
        error:
          "El oponente con OpenAI está desactivado. Activá OPENAI_CHESS_ENABLED=true para usarlo.",
      },
      { status: 403 }
    );
  }

  const originError = assertAllowedOrigin(request);
  if (originError) return originError;

  const sizeError = assertSmallJsonRequest(request);
  if (sizeError) return sizeError;

  const rateError = assertRateLimit(request);
  if (rateError) return rateError;

  if (!process.env.OPENAI_API_KEY) {
    return json(
      { error: "OPENAI_API_KEY no está configurada en el servidor." },
      { status: 503 }
    );
  }

  let body: { fen?: string } | null;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    return payloadTooLargeError(error) ? tooLargeBody() : invalidJson();
  }

  const bodyError = invalidFenBody(body);
  if (bodyError) return bodyError;

  const fen = body!.fen!;
  const valid = validateFen(fen);
  if (!valid.ok) {
    return json(
      { error: valid.error || "FEN inválido." },
      { status: 400 }
    );
  }

  const chess = new Chess(fen);
  if (chess.turn() !== "b") {
    return json(
      { error: "El modelo solo juega cuando le toca a negras." },
      { status: 400 }
    );
  }
  if (chess.isGameOver()) {
    return json({ error: "La partida ya terminó." }, { status: 400 });
  }

  const legal = legalMoves(chess);
  const legalIds = legal.map(moveId);
  const prompt = [
    "Elegí una jugada legal de ajedrez para negras.",
    "Respondé solo con una jugada UCI de esta lista. Sin explicación.",
    `FEN: ${fen}`,
    `Legales: ${legalIds.join(" ")}`,
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "Sos un oponente de ajedrez barato. Debés responder exactamente una jugada UCI legal de la lista recibida.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.35,
      max_completion_tokens: 12,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return json(
      { error: "OpenAI no pudo generar la jugada." },
      { status: response.status }
    );
  }

  const raw = data?.choices?.[0]?.message?.content || "";
  const chosen = normalizeMove(raw);
  const selected = legal.find((m) => moveId(m) === chosen);
  const move = selected || legal[Math.floor(Math.random() * legal.length)];
  const applied = chess.move({
    from: move.from,
    to: move.to,
    promotion: move.promotion,
  });
  const usage = data?.usage as ChatUsage | undefined;

  return json({
    model: MODEL,
    move: moveId(applied),
    san: applied.san,
    fen: chess.fen(),
    usedFallback: !selected,
    usage: {
      inputTokens: usage?.prompt_tokens || 0,
      cachedInputTokens: usage?.prompt_tokens_details?.cached_tokens || 0,
      outputTokens: usage?.completion_tokens || 0,
    },
    costUsd: estimateCost(usage),
  });
}

import { NextResponse } from "next/server";
import { Chess, validateFen, type Move } from "chess.js";

export const runtime = "nodejs";

const MODEL = process.env.OPENAI_CHESS_MODEL || "gpt-5.4-nano";
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

export async function POST(request: Request) {
  if (process.env.OPENAI_CHESS_ENABLED !== "true") {
    return NextResponse.json(
      {
        error:
          "El oponente con OpenAI está desactivado. Activá OPENAI_CHESS_ENABLED=true para usarlo.",
      },
      { status: 403 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY no está configurada en el servidor." },
      { status: 503 }
    );
  }

  let body: { fen?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const fen = body.fen || "";
  const valid = validateFen(fen);
  if (!valid.ok) {
    return NextResponse.json({ error: valid.error || "FEN inválido." }, { status: 400 });
  }

  const chess = new Chess(fen);
  if (chess.turn() !== "b") {
    return NextResponse.json(
      { error: "El modelo solo juega cuando le toca a negras." },
      { status: 400 }
    );
  }
  if (chess.isGameOver()) {
    return NextResponse.json({ error: "La partida ya terminó." }, { status: 400 });
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
    return NextResponse.json(
      { error: data?.error?.message || "OpenAI no pudo generar la jugada." },
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

  return NextResponse.json({
    model: MODEL,
    move: moveId(applied),
    san: applied.san,
    fen: chess.fen(),
    usedFallback: !selected,
    raw,
    usage: {
      inputTokens: usage?.prompt_tokens || 0,
      cachedInputTokens: usage?.prompt_tokens_details?.cached_tokens || 0,
      outputTokens: usage?.completion_tokens || 0,
    },
    costUsd: estimateCost(usage),
  });
}

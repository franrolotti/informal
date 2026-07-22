"use client";

import { useMemo, useState } from "react";
import { Chess, type Move, type Square } from "chess.js";

const AI_OPPONENT_ENABLED = false;

type ApiMove = {
  model: string;
  move: string;
  san: string;
  fen: string;
  usedFallback: boolean;
  usage: {
    inputTokens: number;
    cachedInputTokens: number;
    outputTokens: number;
  };
  costUsd: number;
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const PIECES: Record<string, string> = {
  wp: "♙",
  wn: "♘",
  wb: "♗",
  wr: "♖",
  wq: "♕",
  wk: "♔",
  bp: "♟",
  bn: "♞",
  bb: "♝",
  br: "♜",
  bq: "♛",
  bk: "♚",
};

function squareAt(row: number, col: number): Square {
  return `${FILES[col]}${8 - row}` as Square;
}

function statusOf(chess: Chess, thinking: boolean): string {
  if (thinking) return "El modelo está calculando negras...";
  if (chess.isCheckmate())
    return chess.turn() === "w"
      ? "Jaque mate: ganaron negras."
      : "Jaque mate: ganaron blancas.";
  if (chess.isStalemate()) return "Tablas por ahogado.";
  if (chess.isDraw()) return "Tablas.";
  const turn = chess.turn() === "w" ? "blancas" : "negras";
  if (chess.isCheck()) return `Jaque. Mueven ${turn}.`;
  return `Mueven ${turn}.`;
}

function cents(usd: number): string {
  if (usd < 0.0001) return "$" + usd.toFixed(6);
  if (usd < 0.01) return "$" + usd.toFixed(5);
  return "$" + usd.toFixed(4);
}

export default function ChessGame() {
  const [fen, setFen] = useState(() => new Chess().fen());
  const [selected, setSelected] = useState<Square | null>(null);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const [moves, setMoves] = useState<string[]>([]);
  const [model, setModel] = useState("gpt-5.4-nano");
  const [lastCost, setLastCost] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [tokens, setTokens] = useState({ input: 0, cached: 0, output: 0 });
  const [fallbacks, setFallbacks] = useState(0);

  const chess = useMemo(() => new Chess(fen), [fen]);
  const legalTargets = useMemo(() => {
    if (!selected) return new Set<string>();
    return new Set(
      chess
        .moves({ square: selected, verbose: true })
        .map((move) => move.to)
    );
  }, [chess, selected]);

  async function askOpponent(nextFen: string) {
    setThinking(true);
    setError("");
    try {
      const response = await fetch("/api/chess-move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fen: nextFen }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "No se pudo mover.");
      const result = data as ApiMove;
      setFen(result.fen);
      setMoves((prev) => [...prev, "... " + result.san]);
      setModel(result.model);
      setLastCost(result.costUsd);
      setTotalCost((prev) => prev + result.costUsd);
      setTokens((prev) => ({
        input: prev.input + result.usage.inputTokens,
        cached: prev.cached + result.usage.cachedInputTokens,
        output: prev.output + result.usage.outputTokens,
      }));
      if (result.usedFallback) setFallbacks((prev) => prev + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido.");
    } finally {
      setThinking(false);
    }
  }

  function play(from: Square, to: Square) {
    if (thinking || chess.isGameOver()) return;
    const attempt = chess
      .moves({ square: from, verbose: true })
      .find((move) => move.to === to) as Move | undefined;
    if (!attempt) return;
    const move = chess.move({
      from,
      to,
      promotion: attempt.promotion || "q",
    });
    setSelected(null);
    setFen(chess.fen());
    setMoves((prev) => [...prev, move.san]);
    if (AI_OPPONENT_ENABLED && chess.turn() === "b" && !chess.isGameOver()) {
      void askOpponent(chess.fen());
    }
  }

  function clickSquare(square: Square) {
    setError("");
    const piece = chess.get(square);
    if (selected) {
      if (selected === square) {
        setSelected(null);
        return;
      }
      if (legalTargets.has(square)) {
        play(selected, square);
        return;
      }
    }
    if (piece?.color === chess.turn() && !thinking) {
      setSelected(square);
    }
  }

  function reset() {
    setFen(new Chess().fen());
    setSelected(null);
    setThinking(false);
    setError("");
    setMoves([]);
    setLastCost(0);
    setTotalCost(0);
    setTokens({ input: 0, cached: 0, output: 0 });
    setFallbacks(0);
  }

  const board = chess.board();

  return (
    <div className="chess">
      <div className="game-controls">
        <button className="game-btn" onClick={reset}>
          ⟳ Nuevo
        </button>
        <div className="chess-status">{statusOf(chess, thinking)}</div>
      </div>

      <div className="chess-layout">
        <div className="chess-board" aria-label="tablero de ajedrez">
          {board.flatMap((row, r) =>
            row.map((piece, c) => {
              const square = squareAt(r, c);
              const dark = (r + c) % 2 === 1;
              const active = selected === square;
              const target = legalTargets.has(square);
              return (
                <button
                  key={square}
                  className={`chess-square ${dark ? "dark" : "light"}${
                    active ? " active" : ""
                  }${target ? " target" : ""}`}
                  onClick={() => clickSquare(square)}
                  disabled={thinking}
                  aria-label={square}
                >
                  <span className="chess-coord">{square}</span>
                  {piece ? (
                    <span className={`chess-piece ${piece.color}`}>
                      {PIECES[piece.color + piece.type]}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        <div className="chess-side">
          {AI_OPPONENT_ENABLED ? (
            <div className="chess-meter">
              <div>
                <span>Modelo</span>
                <b>{model}</b>
              </div>
              <div>
                <span>Costo partida</span>
                <b>{cents(totalCost)}</b>
              </div>
              <div>
                <span>Última jugada</span>
                <b>{cents(lastCost)}</b>
              </div>
              <div>
                <span>Tokens</span>
                <b>{tokens.input}/{tokens.output}</b>
              </div>
            </div>
          ) : (
            <div className="chess-meter">
              <div>
                <span>Modo</span>
                <b>2 jugadores</b>
              </div>
              <div>
                <span>Costo</span>
                <b>$0.000000</b>
              </div>
            </div>
          )}

          {error ? <div className="game-status wrong">{error}</div> : null}
          {fallbacks > 0 ? (
            <div className="game-status">
              {fallbacks} respuesta inválida del modelo; se usó una jugada legal
              de respaldo.
            </div>
          ) : null}

          <div className="chess-moves">
            {moves.length === 0 ? (
              <span>Blancas empiezan. Después se alternan los turnos.</span>
            ) : (
              moves.map((move, i) => (
                <span key={`${move}-${i}`}>
                  {i % 2 === 0 ? Math.floor(i / 2) + 1 + ". " : ""}
                  {move}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <p className="game-hint">
        Modo local sin gasto: juegan blancas y negras por turnos. El código del
        oponente con OpenAI queda desactivado para reactivarlo más adelante.
      </p>
    </div>
  );
}

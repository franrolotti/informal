"use client";

import { useCallback, useEffect, useState } from "react";
import {
  generateSudoku,
  SUDOKU_SIZES,
  type SudokuPuzzle,
} from "@/lib/sudoku";

export default function SudokuGame() {
  const [size, setSize] = useState(9);
  const [puz, setPuz] = useState<SudokuPuzzle | null>(null);
  const [vals, setVals] = useState<number[]>([]);
  const [status, setStatus] = useState<"idle" | "win" | "wrong">("idle");
  const [gen, setGen] = useState(false);

  const newGame = useCallback((n: number) => {
    setGen(true);
    setStatus("idle");
    // permitir que el "generando…" pinte antes del cálculo pesado (9x9)
    setTimeout(() => {
      const p = generateSudoku(n);
      setPuz(p);
      setVals(p.puzzle.slice());
      setGen(false);
    }, 20);
  }, []);

  useEffect(() => {
    newGame(9);
  }, [newGame]);

  if (!puz) {
    return <div className="game-status">Generando tablero…</div>;
  }

  const n = puz.n;
  const given = (i: number) => puz.puzzle[i] !== 0;

  function setCell(i: number, raw: string) {
    if (given(i)) return;
    const ch = raw.replace(/[^0-9]/g, "").slice(-1);
    const v = ch === "" ? 0 : parseInt(ch, 10);
    if (v > n) return;
    setVals((prev) => {
      const next = prev.slice();
      next[i] = v;
      return next;
    });
    setStatus("idle");
  }

  function check() {
    if (!puz) return;
    if (vals.some((v) => v === 0)) {
      setStatus("wrong");
      return;
    }
    setStatus(vals.every((v, i) => v === puz.solution[i]) ? "win" : "wrong");
  }

  function conflict(i: number): boolean {
    if (!puz) return false;
    const v = vals[i];
    if (!v) return false;
    const r = Math.floor(i / n);
    const c = i % n;
    for (let k = 0; k < n; k++) {
      if (k !== c && vals[r * n + k] === v) return true;
      if (k !== r && vals[k * n + c] === v) return true;
    }
    const r0 = Math.floor(r / puz.br) * puz.br;
    const c0 = Math.floor(c / puz.bc) * puz.bc;
    for (let a = 0; a < puz.br; a++)
      for (let b = 0; b < puz.bc; b++) {
        const j = (r0 + a) * n + (c0 + b);
        if (j !== i && vals[j] === v) return true;
      }
    return false;
  }

  return (
    <div className="sudoku">
      <div className="game-controls">
        <div className="seg">
          {SUDOKU_SIZES.map((s) => (
            <button
              key={s}
              className={`seg-btn ${s === size ? "on" : ""}`}
              onClick={() => {
                setSize(s);
                newGame(s);
              }}
            >
              {s}×{s}
            </button>
          ))}
        </div>
        <button className="game-btn" onClick={() => newGame(size)}>
          ⟳ Nuevo
        </button>
        <button className="game-btn alt" onClick={check}>
          ✓ Verificar
        </button>
        <button
          className="game-btn ghost"
          onClick={() => {
            setVals(puz.solution.slice());
            setStatus("idle");
          }}
        >
          Resolver
        </button>
      </div>

      {status === "win" && (
        <div className="game-status win">✔ RESUELTO — sistema descifrado.</div>
      )}
      {status === "wrong" && (
        <div className="game-status wrong">✘ Todavía no. Seguí probando.</div>
      )}

      <div
        className={`sudoku-grid ${gen ? "busy" : ""}`}
        style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
      >
        {vals.map((v, i) => {
          const r = Math.floor(i / n);
          const c = i % n;
          const thickR = (c + 1) % puz.bc === 0 && c + 1 !== n;
          const thickB = (r + 1) % puz.br === 0 && r + 1 !== n;
          return (
            <input
              key={i}
              className={`s-cell${given(i) ? " given" : ""}${
                thickR ? " br-r" : ""
              }${thickB ? " br-b" : ""}${conflict(i) ? " bad" : ""}`}
              inputMode="numeric"
              value={v === 0 ? "" : String(v)}
              onChange={(e) => setCell(i, e.target.value)}
              readOnly={given(i)}
              aria-label={`fila ${r + 1} columna ${c + 1}`}
            />
          );
        })}
      </div>
      <p className="game-hint">
        Tamaños generados al azar con solución única · escribí del 1 al {n}.
      </p>
    </div>
  );
}

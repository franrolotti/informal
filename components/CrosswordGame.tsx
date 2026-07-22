"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FocusEvent,
  type MouseEvent,
} from "react";
import { newCrossword, type Crossword } from "@/lib/crossword";

const key = (r: number, c: number) => r + "," + c;

export default function CrosswordGame() {
  const [cw, setCw] = useState<Crossword | null>(null);
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  function fresh() {
    setCw(newCrossword());
    setEntries({});
    setChecked(false);
  }

  useEffect(() => {
    fresh();
  }, []);

  const clues = useMemo(() => {
    if (!cw) return { across: [], down: [] };
    const across = cw.placed
      .filter((p) => p.orient === "across")
      .sort((a, b) => a.number - b.number);
    const down = cw.placed
      .filter((p) => p.orient === "down")
      .sort((a, b) => a.number - b.number);
    return { across, down };
  }, [cw]);

  if (!cw) return <div className="game-status">Generando crucigrama…</div>;

  function set(r: number, c: number, raw: string) {
    const ch = raw
      .toUpperCase()
      .replace(/[^A-ZÑ]/g, "")
      .slice(-1);
    setEntries((prev) => ({ ...prev, [key(r, c)]: ch }));
    setChecked(false);
  }

  const cellStatus = (r: number, c: number): string => {
    if (!checked) return "";
    const sol = cw.letters[key(r, c)];
    const val = entries[key(r, c)] || "";
    if (!val) return "";
    return val === sol ? "ok" : "no";
  };

  function selectCell(e: FocusEvent<HTMLInputElement> | MouseEvent<HTMLInputElement>) {
    e.currentTarget.select();
  }

  return (
    <div className="crossword">
      <div className="game-controls">
        <button className="game-btn" onClick={fresh}>
          ⟳ Nuevo
        </button>
        <button className="game-btn alt" onClick={() => setChecked(true)}>
          ✓ Verificar
        </button>
        <button
          className="game-btn ghost"
          onClick={() => {
            const filled: Record<string, string> = {};
            for (const k in cw.letters) filled[k] = cw.letters[k];
            setEntries(filled);
            setChecked(true);
          }}
        >
          Resolver
        </button>
      </div>

      <div className="crossword-layout">
        <div className="cw-grid-wrap">
          <div
            className="cw-grid"
            style={{ gridTemplateColumns: `repeat(${cw.cols}, 1fr)` }}
          >
            {Array.from({ length: cw.rows * cw.cols }, (_, i) => {
              const r = Math.floor(i / cw.cols);
              const c = i % cw.cols;
              const has = !!cw.letters[key(r, c)];
              if (!has) return <div key={i} className="cw-block" />;
              const num = cw.numbers[key(r, c)];
              return (
                <div key={i} className={`cw-cell ${cellStatus(r, c)}`}>
                  {num ? <span className="cw-num">{num}</span> : null}
                  <input
                    value={entries[key(r, c)] || ""}
                    onChange={(e) => set(r, c, e.target.value)}
                    onFocus={selectCell}
                    onClick={selectCell}
                    inputMode="text"
                    aria-label={`fila ${r + 1} columna ${c + 1}`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="cw-clues">
          <div className="cw-clue-col">
            <h3>▚ Horizontales</h3>
            <ol>
              {clues.across.map((p) => (
                <li key={`a${p.number}`}>
                  <b>{p.number}.</b> {p.clue}{" "}
                  <span className="cw-len">({p.answer.length})</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="cw-clue-col">
            <h3>▚ Verticales</h3>
            <ol>
              {clues.down.map((p) => (
                <li key={`d${p.number}`}>
                  <b>{p.number}.</b> {p.clue}{" "}
                  <span className="cw-len">({p.answer.length})</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      <p className="game-hint">
        Generado al azar sobre desinformación, redes y cultura · un tablero
        nuevo cada vez.
      </p>
    </div>
  );
}

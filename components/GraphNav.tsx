"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";
import {
  articles,
  categories,
  categoryColor,
  type Category,
} from "@/lib/articles";
import { games } from "@/lib/games";

/* ---------- Relaciones temáticas entre notas (cruces entre galaxias) ---------- */
const RELATIONS: [string, string][] = [
  ["argentina-racismo-mundial-2026", "anatomia-de-una-conspiracion"],
  ["cultura-del-scroll", "la-grieta-explicada"],
  ["terraplanismo-como-fenomeno", "cultura-del-scroll"],
  ["dolarizacion-pros-y-contras", "la-grieta-explicada"],
  ["el-mito-del-vivir-con-lo-nuestro", "populismo-manual-de-uso"],
  ["anatomia-de-una-conspiracion", "populismo-manual-de-uso"],
  ["editorial-por-que-informal", "argentina-racismo-mundial-2026"],
  ["diario-de-redaccion-01", "inflacion-y-expectativas"],
];

const HUB = "#ece8e1";
const GAMES_COLOR = "#ffe03a";
type GraphView = "galaxies" | "galaxy" | "games";

/* PRNG determinista para estrellas y cúmulos */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const catOf: Record<string, Category> = Object.fromEntries(
  articles.map((a) => [a.slug, a.category])
) as Record<string, Category>;

function angleOfCat(cat: Category): number {
  const i = categories.indexOf(cat);
  return (i / categories.length) * Math.PI * 2 - Math.PI / 2;
}

export default function GraphNav() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<GraphView>("galaxies");
  const [active, setActive] = useState<Category>(categories[0]);
  const [size, setSize] = useState({ w: 900, h: 620 });

  const wrapRef = useRef<HTMLDivElement | null>(null);

  /* Campo de estrellas de fondo (normalizado 0..1) */
  const stars = useMemo(() => {
    const rnd = mulberry32(1337);
    return Array.from({ length: 120 }, () => ({
      x: rnd(),
      y: rnd(),
      r: 0.4 + rnd() * 1.5,
      dur: 2.2 + rnd() * 3.6,
      delay: rnd() * 4,
      blue: rnd() > 0.7,
    }));
  }, []);

  /* Cúmulo decorativo por galaxia (offsets normalizados -1..1) */
  const clusters = useMemo(() => {
    const out: Record<string, { x: number; y: number; r: number }[]> = {};
    categories.forEach((cat, ci) => {
      const rnd = mulberry32(99 + ci * 7);
      const arms = 2;
      out[cat] = Array.from({ length: 26 }, (_, j) => {
        const t = j / 26;
        const arm = (j % arms) * ((Math.PI * 2) / arms);
        const a = t * Math.PI * 2.4 + arm;
        const dist = 0.18 + t * 0.82 + (rnd() - 0.5) * 0.15;
        return {
          x: Math.cos(a) * dist,
          y: Math.sin(a) * dist,
          r: 0.5 + rnd() * 1.4,
        };
      });
    });
    return out;
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const el = wrapRef.current;
    if (!el) return;
    const measure = () =>
      setSize({
        w: Math.max(320, el.clientWidth),
        h: Math.max(360, el.clientHeight),
      });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (view === "galaxy") setView("galaxies");
      else setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, view]);

  const { w, h } = size;
  const cx = w / 2;
  const cy = h / 2;
  const S = Math.min(w, h);

  function enterGalaxy(cat: Category) {
    setActive(cat);
    setView("galaxy");
  }

  function enterGames() {
    setView("games");
  }

  /* ---------- Vista mapa: todas las galaxias ---------- */
  function GalaxiesLayer() {
    const rx = w * 0.32;
    const ry = h * 0.31;
    const coreR = Math.max(7, S * 0.02);
    const clusterR = Math.max(46, S * 0.12);
    const labelF = Math.max(13, S * 0.032);
    const gamesX = cx;
    const gamesY = Math.min(h - clusterR * 0.5, cy + ry + clusterR * 0.95);

    // conexiones entre galaxias (pares de categorías con relación)
    const pairs = new Set<string>();
    RELATIONS.forEach(([a, b]) => {
      const ca = catOf[a];
      const cb = catOf[b];
      if (ca && cb && ca !== cb)
        pairs.add([ca, cb].sort().join("|"));
    });
    const pos = (cat: Category) => {
      const ang = angleOfCat(cat);
      return { x: cx + Math.cos(ang) * rx, y: cy + Math.sin(ang) * ry };
    };

    return (
      <g className="galaxy-enter" key="galaxies">
        <g stroke="#2b2740" strokeDasharray="2 6">
          {[...pairs].map((p) => {
            const [a, b] = p.split("|") as Category[];
            const pa = pos(a);
            const pb = pos(b);
            return (
              <line
                key={p}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                strokeWidth={1}
                opacity={0.7}
              />
            );
          })}
          <line
            x1={cx}
            y1={cy}
            x2={gamesX}
            y2={gamesY}
            strokeWidth={1}
            opacity={0.8}
          />
        </g>
        {categories.map((cat) => {
          const { x, y } = pos(cat);
          const color = categoryColor[cat];
          const count = articles.filter((a) => a.category === cat).length;
          const rev = categories.indexOf(cat) % 2 === 0;
          return (
            <g
              key={cat}
              className="galaxy"
              transform={`translate(${x} ${y})`}
              onClick={() => enterGalaxy(cat)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && enterGalaxy(cat)}
            >
              <circle r={clusterR} fill="transparent" />
              <g
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center",
                  animation: `${rev ? "gspin" : "gspinRev"} ${
                    26 + categories.indexOf(cat) * 4
                  }s linear infinite`,
                }}
              >
                {clusters[cat].map((s, i) => (
                  <circle
                    key={i}
                    cx={s.x * clusterR}
                    cy={s.y * clusterR}
                    r={s.r}
                    fill={color}
                    opacity={0.6}
                  />
                ))}
              </g>
              <circle r={coreR * 2} fill={color} opacity={0.18} />
              <circle
                r={coreR}
                fill={color}
                stroke="#000"
                strokeWidth={1.5}
                className="galaxy-core"
              />
              <text
                y={clusterR + labelF}
                textAnchor="middle"
                className="galaxy-label"
                fill={color}
                style={{ fontSize: labelF }}
              >
                {cat}
              </text>
              <text
                y={clusterR + labelF * 2}
                textAnchor="middle"
                className="galaxy-count"
                fill="#7d7691"
                style={{ fontSize: labelF * 0.5 }}
              >
                {count} NOTAS
              </text>
            </g>
          );
        })}
        <g
          className="galaxy"
          transform={`translate(${gamesX} ${gamesY})`}
          onClick={enterGames}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && enterGames()}
        >
          <circle r={clusterR * 0.9} fill="transparent" />
          <g
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              animation: "gspin 24s linear infinite",
            }}
          >
            {Array.from({ length: 22 }, (_, i) => {
              const a = (i / 22) * Math.PI * 2;
              const d = clusterR * (0.22 + (i % 7) * 0.1);
              return (
                <circle
                  key={i}
                  cx={Math.cos(a) * d}
                  cy={Math.sin(a) * d}
                  r={i % 4 === 0 ? 2 : 1.2}
                  fill={GAMES_COLOR}
                  opacity={0.75}
                />
              );
            })}
          </g>
          <rect
            x={-coreR * 1.25}
            y={-coreR * 1.25}
            width={coreR * 2.5}
            height={coreR * 2.5}
            fill={GAMES_COLOR}
            stroke="#000"
            strokeWidth={1.5}
            className="galaxy-core"
          />
          <text
            y={clusterR * 0.9 + labelF}
            textAnchor="middle"
            className="galaxy-label"
            fill={GAMES_COLOR}
            style={{ fontSize: labelF }}
          >
            juegos
          </text>
          <text
            y={clusterR * 0.9 + labelF * 2}
            textAnchor="middle"
            className="galaxy-count"
            fill="#7d7691"
            style={{ fontSize: labelF * 0.5 }}
          >
            {games.length} MODOS
          </text>
        </g>
      </g>
    );
  }

  /* ---------- Vista galaxia: notas + portales a otras galaxias ---------- */
  function GalaxyDetail() {
    const color = categoryColor[active];
    const notes = articles.filter((a) => a.category === active);
    const rx = w * 0.3;
    const ry = h * 0.28;
    const noteR = Math.max(8, S * 0.019);
    const coreR = Math.max(12, S * 0.03);
    const labelF = Math.max(12, S * 0.028);

    const notePos = (i: number) => {
      if (notes.length === 1) return { x: cx, y: cy - ry * 0.6 };
      const ang = (i / notes.length) * Math.PI * 2 - Math.PI / 2;
      return { x: cx + Math.cos(ang) * rx, y: cy + Math.sin(ang) * ry };
    };

    // portales: por cada nota, relaciones hacia OTRA categoría
    type Portal = { from: number; toCat: Category };
    const portals: Portal[] = [];
    notes.forEach((n, i) => {
      RELATIONS.forEach(([a, b]) => {
        let other: string | null = null;
        if (a === n.slug) other = b;
        else if (b === n.slug) other = a;
        if (!other) return;
        const oc = catOf[other];
        if (oc && oc !== active) portals.push({ from: i, toCat: oc });
      });
    });

    return (
      <g className="galaxy-enter" key={active}>
        {/* líneas nota -> núcleo */}
        <g stroke={color} opacity={0.35}>
          {notes.map((n, i) => {
            const p = notePos(i);
            return (
              <line key={n.slug} x1={cx} y1={cy} x2={p.x} y2={p.y} strokeWidth={1} />
            );
          })}
        </g>

        {/* portales hacia otras galaxias (la línea sale de la pantalla) */}
        {portals.map((pt, idx) => {
          const p = notePos(pt.from);
          const ang = angleOfCat(pt.toCat);
          const far = {
            x: cx + Math.cos(ang) * (Math.max(w, h) * 1.1),
            y: cy + Math.sin(ang) * (Math.max(w, h) * 1.1),
          };
          const mx = Math.min(w - 8, Math.max(8, cx + Math.cos(ang) * (S * 0.42)));
          const my = Math.min(h - 26, Math.max(26, cy + Math.sin(ang) * (S * 0.42)));
          const mark = { x: mx, y: my };
          const pc = categoryColor[pt.toCat];
          return (
            <g
              key={`p${idx}`}
              className="portal"
              onClick={() => enterGalaxy(pt.toCat)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && enterGalaxy(pt.toCat)}
            >
              <line
                x1={p.x}
                y1={p.y}
                x2={far.x}
                y2={far.y}
                stroke={pc}
                strokeWidth={1.5}
                strokeDasharray="5 5"
                opacity={0.6}
              />
              <circle cx={mark.x} cy={mark.y} r={noteR * 1.5} fill="transparent" />
              <circle
                cx={mark.x}
                cy={mark.y}
                r={Math.max(5, noteR * 0.6)}
                fill={pc}
                className="portal-dot"
              />
              {(() => {
                const c = Math.cos(ang);
                const anchor =
                  c > 0.3 ? "end" : c < -0.3 ? "start" : "middle";
                const lx = anchor === "end" ? mx - 10 : anchor === "start" ? mx + 10 : mx;
                const ly = Math.min(h - 8, Math.max(16, my - noteR * 1.3));
                return (
                  <text
                    x={lx}
                    y={ly}
                    textAnchor={anchor}
                    className="portal-label"
                    fill={pc}
                    style={{ fontSize: labelF * 0.82 }}
                  >
                    ↦ {pt.toCat}
                  </text>
                );
              })()}
            </g>
          );
        })}

        {/* núcleo de la galaxia */}
        <circle cx={cx} cy={cy} r={coreR * 2.4} fill={color} opacity={0.14} />
        <circle
          cx={cx}
          cy={cy}
          r={coreR}
          fill={color}
          stroke="#000"
          strokeWidth={2}
        />
        <text
          x={cx}
          y={cy + coreR + labelF}
          textAnchor="middle"
          className="galaxy-label"
          fill={color}
          style={{ fontSize: labelF }}
        >
          {active}
        </text>

        {/* notas */}
        {notes.map((n, i) => {
          const p = notePos(i);
          return (
            <g
              key={n.slug}
              className="note"
              transform={`translate(${p.x} ${p.y})`}
              onClick={() => {
                setOpen(false);
                router.push(`/articulo/${n.slug}`);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setOpen(false);
                  router.push(`/articulo/${n.slug}`);
                }
              }}
            >
              <circle r={noteR * 2} fill={color} opacity={0.12} />
              <circle
                r={noteR}
                fill="#0c0b10"
                stroke={color}
                strokeWidth={2}
                className="note-core"
              />
              <text
                y={noteR + labelF}
                textAnchor="middle"
                className="note-label"
                fill="#ece8e1"
                style={{ fontSize: labelF }}
              >
                {n.title.length > 24 ? n.title.slice(0, 23) + "…" : n.title}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  function GamesDetail() {
    const rx = w * 0.3;
    const ry = h * 0.25;
    const gameR = Math.max(13, S * 0.032);
    const coreR = Math.max(14, S * 0.034);
    const labelF = Math.max(12, S * 0.028);

    const gamePos = (i: number) => {
      const ang = (i / games.length) * Math.PI * 2 - Math.PI / 2;
      return { x: cx + Math.cos(ang) * rx, y: cy + Math.sin(ang) * ry };
    };

    return (
      <g className="galaxy-enter" key="games">
        <g stroke={GAMES_COLOR} opacity={0.35}>
          {games.map((g, i) => {
            const p = gamePos(i);
            return (
              <line
                key={g.slug}
                x1={cx}
                y1={cy}
                x2={p.x}
                y2={p.y}
                strokeWidth={1.2}
              />
            );
          })}
        </g>

        <rect
          x={cx - coreR}
          y={cy - coreR}
          width={coreR * 2}
          height={coreR * 2}
          fill={GAMES_COLOR}
          stroke="#000"
          strokeWidth={2}
        />
        <text
          x={cx}
          y={cy + coreR + labelF}
          textAnchor="middle"
          className="galaxy-label"
          fill={GAMES_COLOR}
          style={{ fontSize: labelF }}
        >
          juegos
        </text>

        {games.map((game, i) => {
          const p = gamePos(i);
          return (
            <g
              key={game.slug}
              className="note"
              transform={`translate(${p.x} ${p.y})`}
              onClick={() => {
                setOpen(false);
                router.push(`/juegos/${game.slug}`);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setOpen(false);
                  router.push(`/juegos/${game.slug}`);
                }
              }}
            >
              <circle r={gameR * 2.2} fill={game.color} opacity={0.16} />
              <rect
                x={-gameR}
                y={-gameR}
                width={gameR * 2}
                height={gameR * 2}
                fill="#0c0b10"
                stroke={game.color}
                strokeWidth={2}
                className="note-core"
              />
              <text
                y={5}
                textAnchor="middle"
                className="note-label"
                fill={game.color}
                style={{ fontSize: labelF * 1.05 }}
              >
                {game.glyph}
              </text>
              <text
                y={gameR + labelF}
                textAnchor="middle"
                className="note-label"
                fill="#ece8e1"
                style={{ fontSize: labelF }}
              >
                {game.title}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  const starLayer = (
    <g>
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.x * w}
          cy={s.y * h}
          r={s.r}
          fill={s.blue ? "#9fe8ff" : "#ffffff"}
          style={
            {
              animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
            } as CSSProperties
          }
        />
      ))}
    </g>
  );

  return (
    <>
      <button
        className="graph-fab"
        onClick={() => {
          setView("galaxies");
          setOpen(true);
        }}
        aria-label="Abrir el mapa estelar de notas"
      >
        <span className="graph-fab-icon" aria-hidden="true">
          ◈
        </span>
        NAVEGAR
      </button>

      {open && (
        <div
          className="graph-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="graph-panel">
            <div className="graph-head">
              {view !== "galaxies" ? (
                <button
                  className="graph-back"
                  onClick={() => setView("galaxies")}
                >
                  ◄ MAPA
                </button>
              ) : (
                <span className="graph-ja">星図</span>
              )}
              <div className="graph-title">
                {view === "galaxy"
                  ? `GALAXIA · ${active}`
                  : view === "games"
                  ? "GALAXIA · JUEGOS"
                  : "MAPA ESTELAR"}
              </div>
              <div className="graph-spacer" />
              <button
                className="graph-close"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="graph-canvas" ref={wrapRef}>
              <svg
                className="graph-svg"
                viewBox={`0 0 ${w} ${h}`}
                preserveAspectRatio="xMidYMid slice"
              >
                {starLayer}
                {view === "galaxies" ? <GalaxiesLayer /> : null}
                {view === "galaxy" ? <GalaxyDetail /> : null}
                {view === "games" ? <GamesDetail /> : null}
              </svg>
            </div>

            <div className="graph-foot">
              {view === "galaxies"
                ? "Tocá una galaxia para entrar · juegos abre los modos interactivos"
                : view === "games"
                ? "Tocá un juego para entrar · esc para volver"
                : "Tocá una nota para leer · seguí la línea ↦ para viajar a otra galaxia · esc para volver"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

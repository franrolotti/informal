"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { articles, categories, categoryColor } from "@/lib/articles";

type GNode = {
  id: string;
  label: string;
  color: string;
  hub?: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null;
  fy: number | null;
};

const W = 900;
const H = 620;
const CX = W / 2;
const CY = H / 2;

// Constantes de la simulación (force-directed, estilo Obsidian)
const REP = 8600; // repulsión entre nodos
const REST = 96; // largo de reposo de los enlaces
const SPRING = 0.021; // fuerza de los enlaces
const CENTER = 0.006; // atracción al centro
const DAMP = 0.85; // amortiguación

const HUB_COLOR = "#ece8e1";

function buildGraph() {
  const nodes: GNode[] = [];
  const edges: [string, string][] = [];

  nodes.push({
    id: "hub",
    label: "info.rmal",
    color: HUB_COLOR,
    hub: true,
    x: CX,
    y: CY,
    vx: 0,
    vy: 0,
    fx: null,
    fy: null,
  });

  // Posición inicial determinista en círculo (evita saltos raros)
  articles.forEach((a, i) => {
    const ang = (i / articles.length) * Math.PI * 2;
    nodes.push({
      id: a.slug,
      label: a.title,
      color: categoryColor[a.category],
      x: CX + Math.cos(ang) * 210,
      y: CY + Math.sin(ang) * 190,
      vx: 0,
      vy: 0,
      fx: null,
      fy: null,
    });
  });

  // Enlaces: cadena dentro de cada categoría + conexión al hub
  categories.forEach((cat) => {
    const list = articles.filter((a) => a.category === cat);
    for (let i = 0; i < list.length - 1; i++) {
      edges.push([list[i].slug, list[i + 1].slug]);
    }
    if (list[0]) edges.push(["hub", list[0].slug]);
  });

  // Enlaces temáticos cruzados (la red de la desinformación)
  const cross: [string, string][] = [
    ["argentina-racismo-mundial-2026", "anatomia-de-una-conspiracion"],
    ["cultura-del-scroll", "anatomia-de-una-conspiracion"],
    ["la-grieta-explicada", "terraplanismo-como-fenomeno"],
    ["cultura-del-scroll", "la-grieta-explicada"],
    ["editorial-por-que-informal", "argentina-racismo-mundial-2026"],
    ["inflacion-y-expectativas", "el-mito-del-vivir-con-lo-nuestro"],
  ];
  const have = new Set(articles.map((a) => a.slug));
  cross.forEach(([a, b]) => {
    if (have.has(a) && have.has(b)) edges.push([a, b]);
  });

  return { nodes, edges };
}

export default function GraphNav() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);
  const [hover, setHover] = useState<string | null>(null);

  const { nodes, edges } = useMemo(buildGraph, []);
  const nodesRef = useRef(nodes);
  const mapRef = useRef<Record<string, GNode>>(
    Object.fromEntries(nodes.map((n) => [n.id, n]))
  );
  const svgRef = useRef<SVGSVGElement | null>(null);
  const drag = useRef<{ id: string; moved: number } | null>(null);

  // Lock scroll + cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Bucle de simulación
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const map = mapRef.current;
    const step = () => {
      const ns = nodesRef.current;
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          let dx = ns[i].x - ns[j].x;
          let dy = ns[i].y - ns[j].y;
          const d2 = dx * dx + dy * dy + 0.01;
          const d = Math.sqrt(d2);
          const f = REP / d2;
          const fx = (f * dx) / d;
          const fy = (f * dy) / d;
          ns[i].vx += fx;
          ns[i].vy += fy;
          ns[j].vx -= fx;
          ns[j].vy -= fy;
        }
      }
      for (const [a, b] of edges) {
        const na = map[a];
        const nb = map[b];
        if (!na || !nb) continue;
        let dx = nb.x - na.x;
        let dy = nb.y - na.y;
        const d = Math.hypot(dx, dy) || 0.01;
        const f = SPRING * (d - REST);
        const fx = (f * dx) / d;
        const fy = (f * dy) / d;
        na.vx += fx;
        na.vy += fy;
        nb.vx -= fx;
        nb.vy -= fy;
      }
      for (const n of ns) {
        const c = n.hub ? CENTER * 2.2 : CENTER;
        n.vx += (CX - n.x) * c;
        n.vy += (CY - n.y) * c;
        if (n.fx != null && n.fy != null) {
          n.x = n.fx;
          n.y = n.fy;
          n.vx = 0;
          n.vy = 0;
        } else {
          n.vx *= DAMP;
          n.vy *= DAMP;
          n.x += n.vx;
          n.y += n.vy;
        }
      }
      setTick((t) => (t + 1) % 1000000);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [open, edges]);

  function toSvg(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }

  function onPointerDown(e: React.PointerEvent, id: string) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { id, moved: 0 };
    const n = mapRef.current[id];
    const { x, y } = toSvg(e.clientX, e.clientY);
    n.fx = x;
    n.fy = y;
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const n = mapRef.current[drag.current.id];
    const { x, y } = toSvg(e.clientX, e.clientY);
    drag.current.moved += Math.abs(x - (n.fx ?? x)) + Math.abs(y - (n.fy ?? y));
    n.fx = x;
    n.fy = y;
  }
  function onPointerUp(id: string) {
    const d = drag.current;
    drag.current = null;
    const n = mapRef.current[id];
    n.fx = null;
    n.fy = null;
    if (d && d.moved < 6) {
      if (id === "hub") return;
      setOpen(false);
      router.push(`/articulo/${id}`);
    }
  }

  return (
    <>
      <button
        className="graph-fab"
        onClick={() => setOpen(true)}
        aria-label="Abrir el grafo de notas"
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
              <div className="graph-title">
                <span className="graph-ja">ネットワーク</span>
                GRAFO DE NOTAS
              </div>
              <div className="graph-legend">
                {categories.map((c) => (
                  <span key={c} className="legend-item">
                    <i style={{ background: categoryColor[c] }} />
                    {c}
                  </span>
                ))}
              </div>
              <button
                className="graph-close"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <svg
              ref={svgRef}
              className="graph-svg"
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="xMidYMid meet"
              onPointerMove={onPointerMove}
            >
              <g stroke="#3a3550">
                {edges.map(([a, b], i) => {
                  const na = mapRef.current[a];
                  const nb = mapRef.current[b];
                  if (!na || !nb) return null;
                  const active = hover === a || hover === b;
                  return (
                    <line
                      key={i}
                      x1={na.x}
                      y1={na.y}
                      x2={nb.x}
                      y2={nb.y}
                      stroke={active ? na.color : "#332f47"}
                      strokeWidth={active ? 2 : 1}
                      opacity={active ? 0.9 : 0.5}
                    />
                  );
                })}
              </g>
              {nodesRef.current.map((n) => {
                const r = n.hub ? 15 : hover === n.id ? 12 : 8;
                const dim = hover && hover !== n.id;
                return (
                  <g
                    key={n.id}
                    className="graph-node"
                    transform={`translate(${n.x} ${n.y})`}
                    onPointerDown={(e) => onPointerDown(e, n.id)}
                    onPointerUp={() => onPointerUp(n.id)}
                    onMouseEnter={() => setHover(n.id)}
                    onMouseLeave={() => setHover((h) => (h === n.id ? null : h))}
                  >
                    <circle
                      r={r + 6}
                      fill={n.color}
                      opacity={hover === n.id ? 0.25 : 0}
                    />
                    <circle
                      r={r}
                      fill={n.hub ? "#0c0b10" : n.color}
                      stroke={n.color}
                      strokeWidth={n.hub ? 3 : 2}
                      opacity={dim ? 0.4 : 1}
                    />
                    <text
                      className="graph-node-label"
                      y={r + 14}
                      textAnchor="middle"
                      fill={hover === n.id ? n.color : "#8a83a0"}
                      opacity={dim ? 0.35 : 1}
                    >
                      {n.label.length > 26
                        ? n.label.slice(0, 25) + "…"
                        : n.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="graph-foot">
              Arrastrá los nodos · clic para abrir la nota · esc para salir ·
              <strong> pronto sincronizado con Obsidian</strong>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

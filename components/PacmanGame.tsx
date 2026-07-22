"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Dir = "up" | "down" | "left" | "right" | "none";
type Phase = "ready" | "playing" | "won" | "lost";
type Actor = { r: number; c: number; dir: Dir; home: [number, number] };
type Ghost = Actor & { color: string };

const MAZE = [
  "###################",
  "#........#........#",
  "#.##.###.#.###.##.#",
  "#o##.###.#.###.##o#",
  "#.................#",
  "#.##.#.#####.#.##.#",
  "#....#...#...#....#",
  "####.### # ###.####",
  "####.#       #.####",
  "####.# ## ## #.####",
  "     . #   # .     ",
  "####.# ##### #.####",
  "####.#       #.####",
  "####.# ##### #.####",
  "#........#........#",
  "#.##.###.#.###.##.#",
  "#o.#..... .....#.o#",
  "#.##.#.#####.#.##.#",
  "#....#...#...#....#",
  "###################",
];

const ROWS = MAZE.length;
const COLS = MAZE[0].length;
const TILE = 24;
const STEP_MS = 120;
const POWER_TICKS = 65;

const DIRS: Record<Dir, [number, number]> = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
  none: [0, 0],
};

const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
  none: "none",
};

interface GameState {
  maze: string[][];
  dots: number;
  score: number;
  lives: number;
  phase: Phase;
  power: number;
  pac: Actor;
  nextDir: Dir;
  ghosts: Ghost[];
  mouth: number;
}

function countDots(maze: string[][]): number {
  return maze.flat().filter((cell) => cell === "." || cell === "o").length;
}

function createState(): GameState {
  const maze = MAZE.map((row) => row.split(""));
  return {
    maze,
    dots: countDots(maze),
    score: 0,
    lives: 3,
    phase: "ready",
    power: 0,
    pac: { r: 16, c: 9, dir: "left", home: [16, 9] },
    nextDir: "left",
    ghosts: [
      { r: 10, c: 8, dir: "left", home: [10, 8], color: "#ff2438" },
      { r: 10, c: 9, dir: "up", home: [10, 9], color: "#ff2ec4" },
      { r: 10, c: 10, dir: "right", home: [10, 10], color: "#22e0ff" },
    ],
    mouth: 0,
  };
}

function wrapCol(c: number): number {
  if (c < 0) return COLS - 1;
  if (c >= COLS) return 0;
  return c;
}

function isWall(maze: string[][], r: number, c: number): boolean {
  if (r < 0 || r >= ROWS) return true;
  return maze[r][wrapCol(c)] === "#";
}

function canMove(maze: string[][], actor: Actor, dir: Dir): boolean {
  const [dr, dc] = DIRS[dir];
  return !isWall(maze, actor.r + dr, actor.c + dc);
}

function moveActor(maze: string[][], actor: Actor, dir: Dir): Actor {
  if (dir === "none" || !canMove(maze, actor, dir)) return actor;
  const [dr, dc] = DIRS[dir];
  return { ...actor, r: actor.r + dr, c: wrapCol(actor.c + dc), dir };
}

function manhattan(a: Actor, b: Actor): number {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

function ghostDir(state: GameState, ghost: Ghost): Dir {
  const options = (["up", "down", "left", "right"] as Dir[]).filter(
    (dir) => dir !== OPPOSITE[ghost.dir] && canMove(state.maze, ghost, dir)
  );
  const dirs = options.length
    ? options
    : (["up", "down", "left", "right"] as Dir[]).filter((dir) =>
        canMove(state.maze, ghost, dir)
      );

  if (dirs.length === 0) return "none";
  const ranked = dirs
    .map((dir) => {
      const moved = moveActor(state.maze, ghost, dir);
      return { dir, d: manhattan(moved, state.pac) };
    })
    .sort((a, b) => (state.power > 0 ? b.d - a.d : a.d - b.d));

  if (Math.random() < 0.22) return dirs[Math.floor(Math.random() * dirs.length)];
  return ranked[0].dir;
}

function resetActors(state: GameState, lives = state.lives): GameState {
  return {
    ...state,
    lives,
    power: 0,
    pac: { r: 16, c: 9, dir: "left", home: [16, 9] },
    nextDir: "left",
    ghosts: state.ghosts.map((g) => ({
      ...g,
      r: g.home[0],
      c: g.home[1],
      dir: "up",
    })),
  };
}

function tick(prev: GameState): GameState {
  if (prev.phase !== "playing") return prev;

  let state: GameState = {
    ...prev,
    maze: prev.maze.map((row) => row.slice()),
    ghosts: prev.ghosts.map((g) => ({ ...g })),
    mouth: (prev.mouth + 1) % 8,
    power: Math.max(0, prev.power - 1),
  };

  const dir = canMove(state.maze, state.pac, state.nextDir)
    ? state.nextDir
    : state.pac.dir;
  state.pac = moveActor(state.maze, state.pac, dir);

  const cell = state.maze[state.pac.r][state.pac.c];
  if (cell === "." || cell === "o") {
    state.maze[state.pac.r][state.pac.c] = " ";
    state.score += cell === "o" ? 50 : 10;
    state.dots -= 1;
    if (cell === "o") state.power = POWER_TICKS;
    if (state.dots <= 0) return { ...state, phase: "won" };
  }

  state.ghosts = state.ghosts.map((ghost) => {
    const dir = ghostDir(state, ghost);
    return { ...moveActor(state.maze, ghost, dir), color: ghost.color, home: ghost.home };
  });

  const hit = state.ghosts.find((g) => g.r === state.pac.r && g.c === state.pac.c);
  if (!hit) return state;

  if (state.power > 0) {
    state.score += 200;
    state.ghosts = state.ghosts.map((g) =>
      g === hit ? { ...g, r: g.home[0], c: g.home[1], dir: "up" } : g
    );
    return state;
  }

  const lives = state.lives - 1;
  if (lives <= 0) return { ...state, lives: 0, phase: "lost" };
  return resetActors(state, lives);
}

function draw(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.clearRect(0, 0, COLS * TILE, ROWS * TILE);
  ctx.fillStyle = "#05040a";
  ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * TILE;
      const y = r * TILE;
      const cell = state.maze[r][c];
      if (cell === "#") {
        ctx.fillStyle = "#10243f";
        ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = "#22e0ff";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
      } else if (cell === "." || cell === "o") {
        ctx.fillStyle = cell === "o" ? "#ff2ec4" : "#ece8e1";
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2, cell === "o" ? 5 : 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  state.ghosts.forEach((ghost) => {
    const x = ghost.c * TILE + TILE / 2;
    const y = ghost.r * TILE + TILE / 2;
    ctx.fillStyle = state.power > 0 ? "#224dff" : ghost.color;
    ctx.beginPath();
    ctx.arc(x, y - 2, TILE * 0.38, Math.PI, 0);
    ctx.lineTo(x + TILE * 0.38, y + TILE * 0.38);
    ctx.lineTo(x + TILE * 0.16, y + TILE * 0.24);
    ctx.lineTo(x, y + TILE * 0.38);
    ctx.lineTo(x - TILE * 0.16, y + TILE * 0.24);
    ctx.lineTo(x - TILE * 0.38, y + TILE * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(x - 7, y - 4, 5, 5);
    ctx.fillRect(x + 3, y - 4, 5, 5);
  });

  const px = state.pac.c * TILE + TILE / 2;
  const py = state.pac.r * TILE + TILE / 2;
  const mouth = state.mouth < 4 ? 0.16 : 0.03;
  const dirAngle =
    state.pac.dir === "left"
      ? Math.PI
      : state.pac.dir === "up"
      ? -Math.PI / 2
      : state.pac.dir === "down"
      ? Math.PI / 2
      : 0;
  ctx.fillStyle = "#ffe03a";
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.arc(px, py, TILE * 0.42, dirAngle + mouth * Math.PI, dirAngle + (2 - mouth) * Math.PI);
  ctx.closePath();
  ctx.fill();
}

export default function PacmanGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(createState());
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const [, force] = useState(0);
  const state = stateRef.current;

  const setDir = useCallback((dir: Dir) => {
    const current = stateRef.current;
    stateRef.current = {
      ...current,
      phase: current.phase === "ready" ? "playing" : current.phase,
      nextDir: dir,
    };
    force((n) => n + 1);
  }, []);

  const restart = useCallback(() => {
    stateRef.current = createState();
    force((n) => n + 1);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir | undefined> = {
        ArrowUp: "up",
        w: "up",
        W: "up",
        ArrowDown: "down",
        s: "down",
        S: "down",
        ArrowLeft: "left",
        a: "left",
        A: "left",
        ArrowRight: "right",
        d: "right",
        D: "right",
      };
      const dir = map[e.key];
      if (!dir) return;
      e.preventDefault();
      setDir(dir);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setDir]);

  useEffect(() => {
    let last = 0;
    let frame = 0;
    const loop = (time: number) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) draw(ctx, stateRef.current);
      if (time - last >= STEP_MS) {
        stateRef.current = tick(stateRef.current);
        force((n) => n + 1);
        last = time;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  function touchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  }

  function touchEnd(e: React.TouchEvent<HTMLCanvasElement>) {
    const start = touchRef.current;
    const t = e.changedTouches[0];
    touchRef.current = null;
    if (!start || !t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
  }

  const status =
    state.phase === "won"
      ? "GANASTE"
      : state.phase === "lost"
      ? "GAME OVER"
      : state.phase === "ready"
      ? "LISTO"
      : state.power > 0
      ? "POWER"
      : "JUGANDO";

  return (
    <div className="pacman">
      <div className="game-controls">
        <button className="game-btn" onClick={restart}>
          ⟳ Nuevo
        </button>
        <div className="pacman-score">
          <span>{status}</span>
          <b>{state.score}</b>
          <span>vidas {state.lives}</span>
        </div>
      </div>

      <div className="pacman-layout">
        <canvas
          ref={canvasRef}
          className="pacman-canvas"
          width={COLS * TILE}
          height={ROWS * TILE}
          onTouchStart={touchStart}
          onTouchEnd={touchEnd}
          aria-label="Pac-Man"
        />

        <div className="pacman-pad" aria-label="controles">
          <button onClick={() => setDir("up")}>▲</button>
          <button onClick={() => setDir("left")}>◀</button>
          <button onClick={() => setDir("right")}>▶</button>
          <button onClick={() => setDir("down")}>▼</button>
        </div>
      </div>

      <p className="game-hint">
        Flechas, WASD, swipe o botones táctiles · comé puntos, usá los pellets y
        escapá de los fantasmas.
      </p>
    </div>
  );
}

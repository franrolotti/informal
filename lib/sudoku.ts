export interface SudokuPuzzle {
  n: number;
  br: number; // filas por caja
  bc: number; // columnas por caja
  puzzle: number[]; // 0 = vacío
  solution: number[];
}

const DIMS: Record<number, [number, number]> = {
  4: [2, 2],
  6: [2, 3],
  9: [3, 3],
};

export const SUDOKU_SIZES = [4, 6, 9];

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const idx = (r: number, c: number, n: number) => r * n + c;

function canPut(
  g: number[],
  n: number,
  br: number,
  bc: number,
  r: number,
  c: number,
  v: number
): boolean {
  for (let i = 0; i < n; i++) {
    if (g[idx(r, i, n)] === v) return false;
    if (g[idx(i, c, n)] === v) return false;
  }
  const r0 = Math.floor(r / br) * br;
  const c0 = Math.floor(c / bc) * bc;
  for (let i = 0; i < br; i++)
    for (let j = 0; j < bc; j++)
      if (g[idx(r0 + i, c0 + j, n)] === v) return false;
  return true;
}

function fill(g: number[], n: number, br: number, bc: number): boolean {
  const p = g.indexOf(0);
  if (p === -1) return true;
  const r = Math.floor(p / n);
  const c = p % n;
  const vals = shuffle(Array.from({ length: n }, (_, i) => i + 1));
  for (const v of vals) {
    if (canPut(g, n, br, bc, r, c, v)) {
      g[p] = v;
      if (fill(g, n, br, bc)) return true;
      g[p] = 0;
    }
  }
  return false;
}

function countSolutions(
  g: number[],
  n: number,
  br: number,
  bc: number,
  limit = 2
): number {
  const p = g.indexOf(0);
  if (p === -1) return 1;
  const r = Math.floor(p / n);
  const c = p % n;
  let cnt = 0;
  for (let v = 1; v <= n; v++) {
    if (canPut(g, n, br, bc, r, c, v)) {
      g[p] = v;
      cnt += countSolutions(g, n, br, bc, limit);
      g[p] = 0;
      if (cnt >= limit) break;
    }
  }
  return cnt;
}

export function generateSudoku(n: number): SudokuPuzzle {
  const [br, bc] = DIMS[n] ?? DIMS[9];
  const solution = new Array(n * n).fill(0);
  fill(solution, n, br, bc);

  const puzzle = solution.slice();
  const cells = shuffle(Array.from({ length: n * n }, (_, i) => i));
  const keep = n === 4 ? 7 : n === 6 ? 16 : 34; // pistas a conservar
  let filled = n * n;

  for (const p of cells) {
    if (filled <= keep) break;
    const backup = puzzle[p];
    puzzle[p] = 0;
    // debe conservar solución única
    if (countSolutions(puzzle.slice(), n, br, bc, 2) !== 1) {
      puzzle[p] = backup;
    } else {
      filled--;
    }
  }

  return { n, br, bc, puzzle, solution };
}

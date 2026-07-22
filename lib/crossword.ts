export type Orient = "across" | "down";

export interface Placed {
  answer: string;
  clue: string;
  orient: Orient;
  row: number;
  col: number;
  number: number;
}

export interface Crossword {
  rows: number;
  cols: number;
  placed: Placed[];
  letters: Record<string, string>; // "r,c" -> letra
  numbers: Record<string, number>; // "r,c" -> número
}

interface Entry {
  answer: string;
  clue: string;
}

// Banco temático: desinformación, redes, cultura (solo A-Z, sin acentos ni Ñ)
const BANK: Entry[] = [
  { answer: "FAKE", clue: "Noticia falsa (en inglés)" },
  { answer: "BULO", clue: "Mentira que circula como si fuera verdad" },
  { answer: "ALGORITMO", clue: "Decide qué aparece en tu feed" },
  { answer: "VERIFICAR", clue: "Lo que hay que hacer antes de compartir" },
  { answer: "FUENTE", clue: "De dónde sale un dato" },
  { answer: "VIRAL", clue: "Se propaga como un contagio" },
  { answer: "SESGO", clue: "Inclinación que distorsiona el juicio" },
  { answer: "MEME", clue: "Unidad cultural que muta y se replica" },
  { answer: "TROLL", clue: "Provoca para ensuciar el debate" },
  { answer: "BOT", clue: "Cuenta automatizada" },
  { answer: "CLICKBAIT", clue: "Título tramposo para el clic" },
  { answer: "PRENSA", clue: "El llamado cuarto poder" },
  { answer: "DUDA", clue: "Motor del pensamiento crítico" },
  { answer: "DATO", clue: "Ladrillo de la evidencia" },
  { answer: "RUMOR", clue: "Corre sin confirmar" },
  { answer: "DEEPFAKE", clue: "Video falso hecho con IA" },
  { answer: "FILTRO", clue: "Burbuja que selecciona lo que ves" },
  { answer: "CENSURA", clue: "Silenciar lo incómodo" },
  { answer: "FOTO", clue: "Puede estar fuera de contexto" },
  { answer: "PODER", clue: "Lo que la información disputa" },
  { answer: "LIBRE", clue: "Como debería ser el pensamiento" },
  { answer: "PUNK", clue: "La actitud de esta redacción" },
  { answer: "ECO", clue: "Cámara donde solo te escuchás a vos mismo" },
  { answer: "RELATO", clue: "Versión que se impone sobre los hechos" },
];

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const key = (r: number, c: number) => r + "," + c;

interface Raw {
  entry: Entry;
  row: number;
  col: number;
  orient: Orient;
}

function build(pool: Entry[]): Omit<Crossword, "placed"> & { placed: Raw[] } {
  const words = pool.slice().sort((a, b) => b.answer.length - a.answer.length);
  const grid = new Map<string, string>();
  const placed: Raw[] = [];

  const get = (r: number, c: number) => grid.get(key(r, c));

  function fits(w: string, r: number, c: number, orient: Orient): number {
    const dr = orient === "down" ? 1 : 0;
    const dc = orient === "across" ? 1 : 0;
    if (get(r - dr, c - dc) !== undefined) return -1;
    if (get(r + dr * w.length, c + dc * w.length) !== undefined) return -1;
    let inter = 0;
    for (let i = 0; i < w.length; i++) {
      const rr = r + dr * i;
      const cc = c + dc * i;
      const ex = get(rr, cc);
      if (ex !== undefined) {
        if (ex !== w[i]) return -1;
        inter++;
      } else if (orient === "across") {
        if (get(rr - 1, cc) !== undefined || get(rr + 1, cc) !== undefined)
          return -1;
      } else {
        if (get(rr, cc - 1) !== undefined || get(rr, cc + 1) !== undefined)
          return -1;
      }
    }
    return inter;
  }

  function put(entry: Entry, r: number, c: number, orient: Orient) {
    const dr = orient === "down" ? 1 : 0;
    const dc = orient === "across" ? 1 : 0;
    for (let i = 0; i < entry.answer.length; i++)
      grid.set(key(r + dr * i, c + dc * i), entry.answer[i]);
    placed.push({ entry, row: r, col: c, orient });
  }

  put(words[0], 0, 0, "across");

  for (let k = 1; k < words.length; k++) {
    const A = words[k].answer;
    let best: { r: number; c: number; orient: Orient; score: number } | null =
      null;
    for (const [kk, letter] of grid) {
      const [r, c] = kk.split(",").map(Number);
      for (let i = 0; i < A.length; i++) {
        if (A[i] !== letter) continue;
        const across = fits(A, r, c - i, "across");
        if (across > 0 && (!best || across > best.score))
          best = { r, c: c - i, orient: "across", score: across };
        const down = fits(A, r - i, c, "down");
        if (down > 0 && (!best || down > best.score))
          best = { r: r - i, c, orient: "down", score: down };
      }
    }
    if (best) put(words[k], best.r, best.c, best.orient);
  }

  // normalizar coordenadas
  let minR = Infinity,
    minC = Infinity,
    maxR = -Infinity,
    maxC = -Infinity;
  for (const kk of grid.keys()) {
    const [r, c] = kk.split(",").map(Number);
    minR = Math.min(minR, r);
    minC = Math.min(minC, c);
    maxR = Math.max(maxR, r);
    maxC = Math.max(maxC, c);
  }

  const letters: Record<string, string> = {};
  for (const [kk, l] of grid) {
    const [r, c] = kk.split(",").map(Number);
    letters[key(r - minR, c - minC)] = l;
  }

  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;
  const normPlaced = placed.map((p) => ({
    ...p,
    row: p.row - minR,
    col: p.col - minC,
  }));

  // numeración
  const numbers: Record<string, number> = {};
  let num = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!letters[key(r, c)]) continue;
      const startA = !letters[key(r, c - 1)] && !!letters[key(r, c + 1)];
      const startD = !letters[key(r - 1, c)] && !!letters[key(r + 1, c)];
      if (startA || startD) numbers[key(r, c)] = num++;
    }
  }

  return { rows, cols, letters, numbers, placed: normPlaced };
}

export function newCrossword(target = 11): Crossword {
  let best: (Omit<Crossword, "placed"> & { placed: Raw[] }) | null = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const pool = shuffle(BANK.slice()).slice(0, target);
    const cw = build(pool);
    if (!best || cw.placed.length > best.placed.length) best = cw;
    if (best.placed.length >= Math.min(target, 9)) break;
  }
  const b = best!;
  const placed: Placed[] = b.placed.map((p) => ({
    answer: p.entry.answer,
    clue: p.entry.clue,
    orient: p.orient,
    row: p.row,
    col: p.col,
    number: b.numbers[key(p.row, p.col)] ?? 0,
  }));
  return {
    rows: b.rows,
    cols: b.cols,
    letters: b.letters,
    numbers: b.numbers,
    placed,
  };
}

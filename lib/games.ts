export interface Game {
  slug: string;
  title: string;
  subtitle: string;
  color: string;
  badge: string;
  glyph: string;
}

export const games: Game[] = [
  {
    slug: "sudoku",
    title: "Sudoku",
    subtitle:
      "Generador de sudokus 4×4, 6×6 y 9×9. Aleatorio, con solución única garantizada.",
    color: "#37ff8b",
    badge: "Puzzle",
    glyph: "9",
  },
  {
    slug: "crucigrama",
    title: "Crucigrama",
    subtitle:
      "Crucigrama auto-generado sobre desinformación, redes y cultura. Tablero nuevo cada vez.",
    color: "#22e0ff",
    badge: "Palabras",
    glyph: "#",
  },
];

export function getGame(slug: string): Game | undefined {
  return games.find((g) => g.slug === slug);
}

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
  {
    slug: "ajedrez",
    title: "Ajedrez",
    subtitle:
      "Partida local para dos jugadores. Blancas y negras se alternan en el mismo tablero.",
    color: "#ffe03a",
    badge: "2P",
    glyph: "♞",
  },
  {
    slug: "pacman",
    title: "Pac-Man",
    subtitle:
      "Arcade local con teclado, swipe y botones táctiles. Comé puntos, activá pellets y escapá de los fantasmas.",
    color: "#ff2ec4",
    badge: "Arcade",
    glyph: "●",
  },
];

export function getGame(slug: string): Game | undefined {
  return games.find((g) => g.slug === slug);
}

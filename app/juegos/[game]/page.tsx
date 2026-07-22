import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { games, getGame } from "@/lib/games";
import SudokuGame from "@/components/SudokuGame";
import CrosswordGame from "@/components/CrosswordGame";

export function generateStaticParams() {
  return games.map((g) => ({ game: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ game: string }>;
}): Promise<Metadata> {
  const { game } = await params;
  const g = getGame(game);
  if (!g) return { title: "Juego no encontrado — info.rmal" };
  return { title: `${g.title} — info.rmal`, description: g.subtitle };
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ game: string }>;
}) {
  const { game } = await params;
  const g = getGame(game);
  if (!g) notFound();

  const style = { "--cat": g.color } as CSSProperties;

  return (
    <div className="game-page container" style={style}>
      <div className="article-tools">
        <a className="back-link" href="/#juegos">
          ← volver a la red
        </a>
      </div>

      <header className="game-head reveal">
        <span className="eyebrow">▚ Juegos · {g.badge}</span>
        <h1 className="hero-title glitch" data-text={g.title}>
          {g.title}
        </h1>
        <p className="hero-sub">{g.subtitle}</p>
      </header>

      <div className="game-arena reveal" style={{ animationDelay: "120ms" }}>
        {g.slug === "sudoku" ? <SudokuGame /> : null}
        {g.slug === "crucigrama" ? <CrosswordGame /> : null}
      </div>
    </div>
  );
}

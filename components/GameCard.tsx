import type { CSSProperties } from "react";
import type { Game } from "@/lib/games";

export default function GameCard({
  game,
  index = 0,
}: {
  game: Game;
  index?: number;
}) {
  const style = {
    animationDelay: `${Math.min(index, 8) * 70}ms`,
    "--cat": game.color,
  } as CSSProperties;
  return (
    <a className="card reveal" href={`/juegos/${game.slug}`} style={style}>
      <div className="card-cover">
        <span className="card-glyph" aria-hidden="true">
          {game.glyph}
        </span>
        <span className="tag">{game.badge}</span>
        <span className="play" aria-hidden="true">
          ▶ JUGAR
        </span>
      </div>
      <div className="card-body">
        <div className="card-title">{game.title}</div>
        <div className="card-sub">{game.subtitle}</div>
        <div className="card-meta">
          <span>JUEGO</span>
          <span>·</span>
          <span>gratis · sin registro</span>
        </div>
      </div>
    </a>
  );
}

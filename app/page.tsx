import type { CSSProperties } from "react";
import ArticleCard from "@/components/ArticleCard";
import GameCard from "@/components/GameCard";
import { games } from "@/lib/games";
import {
  byCategory,
  categories,
  categoryAnchors,
  categoryColor,
  getFeatured,
  getLatest,
} from "@/lib/articles";

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Home() {
  const featured = getFeatured();
  const novedades = getLatest(8);
  const heroStyle = {
    "--cat": categoryColor[featured.category],
  } as CSSProperties;

  return (
    <>
      <section className="hero container" id="destacado" style={heroStyle}>
        <div className="hero-card reveal">
          <div className="hero-grid" />
          <div className="hero-content">
            <span className="eyebrow">
              ⚠ Destacado · {featured.category}
            </span>
            <h1 className="hero-title glitch" data-text={featured.title}>
              {featured.title}
            </h1>
            <p className="hero-sub">{featured.subtitle}</p>
            <div className="hero-actions">
              <a className="btn" href={`/articulo/${featured.slug}`}>
                ▶ Leer el análisis
              </a>
              <span className="hero-manifesto">
                Info para las víctimas de la desinformación. Ⓐ
              </span>
            </div>
            <div className="hero-meta">
              <span>{featured.author}</span>
              <span>·</span>
              <span>{formatDate(featured.date)}</span>
              <span>·</span>
              <span>{featured.readingMinutes} min</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section container" id="novedades">
        <div className="row-head">
          <div className="row-title">
            Novedades <span>último transmitido</span>
          </div>
        </div>
        <div className="row">
          {novedades.map((a, i) => (
            <ArticleCard key={a.slug} article={a} index={i} />
          ))}
        </div>
      </section>

      <section className="section container" id="juegos">
        <div className="row-head">
          <div
            className="row-title"
            style={{ "--cat": "#37ff8b" } as CSSProperties}
          >
            Juegos <span>puzzles contra el ruido</span>
          </div>
        </div>
        <div className="row">
          {games.map((g, i) => (
            <GameCard key={g.slug} game={g} index={i} />
          ))}
        </div>
      </section>

      {categories.map((cat) => {
        const list = byCategory(cat);
        if (list.length === 0) return null;
        return (
          <section
            className="section container"
            id={categoryAnchors[cat]}
            key={cat}
          >
            <div className="row-head">
              <div
                className="row-title"
                style={{ "--cat": categoryColor[cat] } as CSSProperties}
              >
                {cat}
              </div>
            </div>
            <div className="row">
              {list.map((a, i) => (
                <ArticleCard key={a.slug} article={a} index={i} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

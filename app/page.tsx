import type { CSSProperties } from "react";
import ArticleCard from "@/components/ArticleCard";
import GameCard from "@/components/GameCard";
import { games } from "@/lib/games";
import {
  categories,
  categoryAnchors,
  categoryColor,
  getArticles,
  getFeatured,
} from "@/lib/articles";

// Las notas vienen de Supabase. Con revalidación cada minuto, publicar o
// retirar una nota se ve en el sitio sin necesidad de redeploy.
export const revalidate = 60;

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function Home() {
  const todas = await getArticles();
  const featured = await getFeatured();
  const novedades = todas.slice(0, 8);

  // Antes del primer sync la base está vacía; mejor un cartel que un crash.
  if (!featured) {
    return (
      <section className="section container" id="destacado">
        <div className="row-head">
          <div className="row-title">
            Sin transmisión <span>todavía no hay notas publicadas</span>
          </div>
        </div>
        <p className="hero-sub">
          Cuando el vault sincronice sus notas con Supabase, aparecen acá.
        </p>
      </section>
    );
  }

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
        const list = todas.filter((a) => a.category === cat);
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

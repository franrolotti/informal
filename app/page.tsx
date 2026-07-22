import ArticleCard from "@/components/ArticleCard";
import {
  byCategory,
  categories,
  categoryAnchors,
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

  return (
    <>
      <section className="hero container" id="destacado">
        <div className="hero-card reveal">
          <div className="hero-bg" style={{ background: featured.color }} />
          <div className="hero-grid" />
          <div className="hero-veil" />
          <div className="hero-content">
            <span className="eyebrow">Destacado · {featured.category}</span>
            <h1 className="hero-title">{featured.title}</h1>
            <p className="hero-sub">{featured.subtitle}</p>
            <a className="btn" href={`/articulo/${featured.slug}`}>
              ▶ Leer el análisis
            </a>
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
            Novedades <span>lo último de la redacción</span>
          </div>
        </div>
        <div className="row">
          {novedades.map((a, i) => (
            <ArticleCard key={a.slug} article={a} index={i} />
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
              <div className="row-title">{cat}</div>
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

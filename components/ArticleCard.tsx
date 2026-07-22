import type { Article } from "@/lib/articles";

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ArticleCard({
  article,
  index = 0,
}: {
  article: Article;
  index?: number;
}) {
  const delay = `${Math.min(index, 8) * 70}ms`;
  return (
    <a
      className="card reveal"
      href={`/articulo/${article.slug}`}
      style={{ animationDelay: delay }}
    >
      <div className="card-cover" style={{ background: article.color }}>
        <span className="tag">{article.category}</span>
        <span className="play" aria-hidden="true">
          ▶
        </span>
      </div>
      <div className="card-body">
        <div className="card-title">{article.title}</div>
        <div className="card-sub">{article.subtitle}</div>
        <div className="card-meta">
          <span>{formatDate(article.date)}</span>
          <span>·</span>
          <span>{article.readingMinutes} min de lectura</span>
        </div>
      </div>
    </a>
  );
}

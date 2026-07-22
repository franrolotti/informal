import type { Article } from "@/lib/articles";

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <a className="card" href={`/articulo/${article.slug}`}>
      <div className="card-cover" style={{ background: article.gradient }}>
        <span className="tag">{article.category}</span>
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

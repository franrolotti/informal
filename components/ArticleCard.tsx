import type { CSSProperties } from "react";
import type { Article } from "@/lib/articles";
import { categoryColor } from "@/lib/articles";

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
  const style = {
    animationDelay: delay,
    "--cat": categoryColor[article.category],
  } as CSSProperties;
  return (
    <a className="card reveal" href={`/articulo/${article.slug}`} style={style}>
      <div className="card-cover">
        <span className="card-glyph" aria-hidden="true">
          {article.category.slice(0, 2).toUpperCase()}
        </span>
        <span className="tag">{article.category}</span>
        <span className="play" aria-hidden="true">
          ▶ ENTER
        </span>
      </div>
      <div className="card-body">
        <div className="card-title">{article.title}</div>
        <div className="card-sub">{article.subtitle}</div>
        <div className="card-meta">
          <span>{formatDate(article.date)}</span>
          <span>·</span>
          <span>{article.readingMinutes} min</span>
        </div>
      </div>
    </a>
  );
}

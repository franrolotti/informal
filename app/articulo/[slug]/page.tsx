import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  articles,
  categoryColor,
  getArticle,
  type Block,
} from "@/lib/articles";
import DownloadPdf from "@/components/DownloadPdf";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "No encontrado — Informal" };
  return {
    title: `${article.title} — Informal`,
    description: article.subtitle,
  };
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function renderBlock(block: Block, i: number) {
  switch (block.type) {
    case "h2":
      return <h2 key={i}>{block.text}</h2>;
    case "p":
      return <p key={i}>{block.text}</p>;
    case "quote":
      return (
        <blockquote key={i}>
          {block.text}
          {block.cite ? <footer>— {block.cite}</footer> : null}
        </blockquote>
      );
    case "list":
      return (
        <ul key={i}>
          {block.items.map((it, j) => (
            <li key={j}>{it}</li>
          ))}
        </ul>
      );
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const style = {
    "--cat": categoryColor[article.category],
  } as CSSProperties;

  return (
    <article className="article container" style={style}>
      <div className="article-tools">
        <a className="back-link" href="/">
          ← volver a la red
        </a>
        <DownloadPdf article={article} />
      </div>

      <div className="article-hero reveal">
        <div className="hero-grid" />
        <div className="article-hero-content">
          <span className="eyebrow">▚ {article.category}</span>
          <h1 className="hero-title glitch" data-text={article.title}>
            {article.title}
          </h1>
          <p className="hero-sub">{article.subtitle}</p>
          <div className="hero-meta">
            <span>{article.author}</span>
            <span>·</span>
            <span>{formatDate(article.date)}</span>
            <span>·</span>
            <span>{article.readingMinutes} min de lectura</span>
          </div>
          <div className="article-hero-actions">
            <DownloadPdf article={article} />
          </div>
        </div>
      </div>

      <div className="article-body reveal" style={{ animationDelay: "120ms" }}>
        {article.body.map((block, i) => renderBlock(block, i))}
      </div>

      <div className="pdf-end">
        <DownloadPdf
          article={article}
          label="Descargar esta nota en PDF"
        />
      </div>
    </article>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articles, getArticle, type Block } from "@/lib/articles";

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

  return (
    <article className="article container">
      <a className="back-link" href="/">
        ← Volver a Informal
      </a>

      <div className="article-hero">
        <div className="hero-bg" style={{ background: article.gradient }} />
        <div className="hero-veil" />
        <div className="article-hero-content">
          <span className="eyebrow">{article.category}</span>
          <h1 className="hero-title">{article.title}</h1>
          <p className="hero-sub">{article.subtitle}</p>
          <div className="hero-meta">
            <span>{article.author}</span>
            <span>·</span>
            <span>{formatDate(article.date)}</span>
            <span>·</span>
            <span>{article.readingMinutes} min de lectura</span>
          </div>
        </div>
      </div>

      <div className="article-body">
        {article.body.map((block, i) => renderBlock(block, i))}
      </div>
    </article>
  );
}

import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

export type Category =
  | "Cultura"
  | "Política"
  | "Economía"
  | "Teorías Conspirativas"
  | "Blogs";

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "list"; items: string[] };

export interface Article {
  slug: string;
  title: string;
  subtitle: string;
  category: Category;
  author: string;
  date: string; // ISO
  readingMinutes: number;
  color: string; // color pastel plano para la portada
  featured?: boolean;
  body: Block[];
}

/**
 * Las notas ya no viven en este archivo: vienen de Supabase, y a Supabase
 * llegan desde el vault privado (repo informal-vault) vía scripts/sync.mjs.
 *
 * RLS solo expone las que están en estado `published`, así que un borrador no
 * puede aparecer acá ni por error de query.
 */
interface FilaArticulo {
  slug: string;
  title: string;
  subtitle: string;
  category: Category;
  author: string;
  date: string;
  reading_minutes: number;
  color: string;
  featured: boolean;
  body: Block[];
}

function filaAArticulo(fila: FilaArticulo): Article {
  return {
    slug: fila.slug,
    title: fila.title,
    subtitle: fila.subtitle,
    category: fila.category,
    author: fila.author,
    date: fila.date,
    readingMinutes: fila.reading_minutes,
    color: fila.color,
    featured: fila.featured,
    body: fila.body ?? [],
  };
}

/**
 * Una sola consulta por request, compartida por todos los helpers: el catálogo
 * es chico y traerlo entero sale más barato que una query por sección.
 */
export const getArticles = cache(async (): Promise<Article[]> => {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("articles")
      .select(
        "slug, title, subtitle, category, author, date, reading_minutes, color, featured, body",
      )
      .eq("status", "published")
      .order("date", { ascending: false });

    if (error) throw new Error(error.message);

    return (data as FilaArticulo[]).map(filaAArticulo);
  } catch (e) {
    // Sin base (o sin env vars) el catálogo queda vacío y la portada muestra
    // su estado vacío. Preferible a tumbar el build o el sitio entero.
    console.error(
      "[articles] no pude leer de Supabase:",
      e instanceof Error ? e.message : e,
    );
    return [];
  }
});

export async function getArticle(slug: string): Promise<Article | undefined> {
  const articles = await getArticles();
  return articles.find((a) => a.slug === slug);
}

export async function getFeatured(): Promise<Article | undefined> {
  const articles = await getArticles();
  return articles.find((a) => a.featured) ?? articles[0];
}

export async function byCategory(category: Category): Promise<Article[]> {
  const articles = await getArticles();
  return articles.filter((a) => a.category === category);
}

export async function getLatest(limit = 8): Promise<Article[]> {
  const articles = await getArticles();
  return articles.slice(0, limit);
}

export const categories: Category[] = [
  "Cultura",
  "Política",
  "Economía",
  "Teorías Conspirativas",
  "Blogs",
];

export const categoryAnchors: Record<Category, string> = {
  Cultura: "cultura",
  Política: "politica",
  Economía: "economia",
  "Teorías Conspirativas": "teorias",
  Blogs: "blogs",
};

// Colores neón por categoría (arcade 80s / punk)
export const categoryColor: Record<Category, string> = {
  Cultura: "#ff2ec4",
  Política: "#ff2438",
  Economía: "#37ff8b",
  "Teorías Conspirativas": "#22e0ff",
  Blogs: "#ffe03a",
};

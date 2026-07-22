import type { Metadata } from "next";
import { Press_Start_2P, Anton, Space_Mono, DotGothic16 } from "next/font/google";
import GraphNav from "@/components/GraphNav";
import { getArticles } from "@/lib/articles";
import "./globals.css";

const arcade = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-arcade",
  display: "swap",
});
const display = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});
const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-mono",
  display: "swap",
});
const jp = DotGothic16({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-jp",
  display: "swap",
});

export const metadata: Metadata = {
  title: "info.rmal ▚ contra la desinformación de las redes",
  description:
    "Prensa subterránea contra la desinformación de las redes sociales. Verificá antes de compartir. Periodismo punk, análisis riguroso.",
};

function Logo() {
  return (
    <a className="brand" href="/" aria-label="info.rmal — inicio">
      <span className="brand-ja">インフォーマル</span>
      <span className="brand-word">
        info<span className="brand-dot">.</span>rmal
      </span>
      <span className="brand-sub">▲ 1UP · PRESS</span>
    </a>
  );
}

function Ticker() {
  const msg =
    "⚠ CONTRA LA DESINFORMACIÓN DE LAS REDES  ✶  VERIFICÁ ANTES DE COMPARTIR  Ⓐ  NO LE CREAS AL ALGORITMO  ✶  PENSÁ POR VOS  Ⓐ  PRENSA SUBTERRÁNEA  ✶  ";
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        <span>{msg}</span>
        <span>{msg}</span>
      </div>
    </div>
  );
}

function Nav() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Logo />
        <nav className="nav-links">
          <a href="/#novedades">Novedades</a>
          <a href="/#cultura">Cultura</a>
          <a href="/#politica">Política</a>
          <a href="/#economia">Economía</a>
          <a href="/#teorias">Teorías</a>
          <a href="/#blogs">Blogs</a>
          <a href="/#juegos">Juegos</a>
        </nav>
        <div className="nav-spacer" />
        <a className="nav-cta" href="/#destacado">
          ▶ Leer
        </a>
      </div>
      <Ticker />
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <strong className="footer-brand">
            info<span>.</span>rmal
          </strong>
          <div className="footer-manifesto">
            Prensa subterránea contra la desinformación de las redes. Verificá,
            dudá, pensá. Ⓐ
          </div>
        </div>
        <div className="footer-meta">
          © {new Date().getFullYear()} · No copyright, copyleft. Compartí con
          criterio.
        </div>
      </div>
    </footer>
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // El mapa estelar necesita el catálogo, y es un componente de cliente:
  // se lo pasamos ya resuelto desde el server.
  const articles = await getArticles();

  return (
    <html
      lang="es"
      className={`${arcade.variable} ${display.variable} ${mono.variable} ${jp.variable}`}
    >
      <body>
        <div className="scanlines" aria-hidden="true" />
        <Nav />
        <main>{children}</main>
        <Footer />
        <GraphNav articles={articles} />
      </body>
    </html>
  );
}

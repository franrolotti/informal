import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "info.rmal — Análisis, cultura, política y economía",
  description:
    "Editorial info.rmal: análisis riguroso y opinión sin corrección de temporada sobre cultura, política, economía y más.",
};

function Logo() {
  return (
    <a className="brand" href="/" aria-label="info.rmal — inicio">
      <span className="brand-sun" aria-hidden="true" />
      <span className="brand-word">
        info<span className="brand-dot">.</span>
        <span className="brand-tail">rmal</span>
      </span>
    </a>
  );
}

function Nav() {
  return (
    <header className="nav">
      <div className="nav-strip" aria-hidden="true" />
      <div className="container nav-inner">
        <Logo />
        <nav className="nav-links">
          <a href="/#novedades">Novedades</a>
          <a href="/#cultura">Cultura</a>
          <a href="/#politica">Política</a>
          <a href="/#economia">Economía</a>
          <a href="/#teorias">Teorías</a>
          <a href="/#blogs">Blogs</a>
        </nav>
        <div className="nav-spacer" />
        <a className="nav-cta" href="/#destacado">
          Leer lo último
        </a>
      </div>
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
          </strong>{" "}
          · Editorial de análisis, cultura, política y economía.
        </div>
        <div>© {new Date().getFullYear()} info.rmal — Argumentos, no volumen.</div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

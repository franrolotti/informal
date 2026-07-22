import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Informal — Análisis económico, cultura y sociedad",
  description:
    "Editorial Informal: análisis económico riguroso y opinión sin corrección de temporada sobre cultura y sociedad.",
};

function Nav() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="brand" href="/">
          <span className="dot" />
          Inform<em>al</em>
        </a>
        <nav className="nav-links">
          <a href="/#economia">Economía</a>
          <a href="/#cultura">Cultura</a>
          <a href="/#sociedad">Sociedad</a>
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
          <strong style={{ color: "var(--ink)" }}>Informal</strong> · Editorial
          de análisis, cultura y sociedad.
        </div>
        <div>© {new Date().getFullYear()} Informal. Argumentos, no volumen.</div>
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

"use client";

import { useState } from "react";
import type { Article, Block } from "@/lib/articles";
import { categoryColor } from "@/lib/articles";

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

// Sanitiza a Latin-1 (las fuentes core de jsPDF no soportan Unicode extendido)
function san(s: string): string {
  return s
    .replace(/[—–]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/ /g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?");
}

function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fingerprint(seed: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const hex = ("00000000" + h.toString(16)).slice(-8).toUpperCase();
  return hex.replace(/(..)(..)(..)(..)/, "$1 $2 $3 $4");
}

export default function DownloadPdf({
  article,
  label = "Descargar PDF",
}: {
  article: Article;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const PW = doc.internal.pageSize.getWidth();
      const PH = doc.internal.pageSize.getHeight();
      const M = 46;
      const CW = PW - 2 * M;
      const BOTTOM = PH - 66;

      const GREEN: RGB = [55, 255, 139];
      const DIMGREEN: RGB = [96, 176, 122];
      const CYAN: RGB = [34, 224, 255];
      const GRAY: RGB = [130, 130, 148];
      const accent = hexToRgb(categoryColor[article.category]);
      const fp = fingerprint(article.slug);

      let y = 0;

      const setColor = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);

      function paintBg() {
        doc.setFillColor(10, 10, 15);
        doc.rect(0, 0, PW, PH, "F");
        // marco HUD tenue
        doc.setDrawColor(30, 70, 50);
        doc.setLineWidth(0.8);
        doc.rect(20, 20, PW - 40, PH - 40);
        // esquinas neón
        doc.setDrawColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.setLineWidth(1.4);
        const c = 16;
        doc.line(20, 20, 20 + c, 20);
        doc.line(20, 20, 20, 20 + c);
        doc.line(PW - 20, 20, PW - 20 - c, 20);
        doc.line(PW - 20, 20, PW - 20, 20 + c);
        doc.line(20, PH - 20, 20 + c, PH - 20);
        doc.line(20, PH - 20, 20, PH - 20 - c);
        doc.line(PW - 20, PH - 20, PW - 20 - c, PH - 20);
        doc.line(PW - 20, PH - 20, PW - 20, PH - 20 - c);
      }

      function dash(x1: number, y1: number, x2: number, col: RGB) {
        doc.setDrawColor(col[0], col[1], col[2]);
        doc.setLineWidth(0.7);
        doc.setLineDashPattern([3, 3], 0);
        doc.line(x1, y1, x2, y1);
        doc.setLineDashPattern([], 0);
      }

      function runningHeader(): number {
        doc.setDrawColor(40, 90, 60);
        doc.setLineWidth(0.8);
        doc.line(M, 52, PW - M, 52);
        doc.setFont("courier", "normal");
        doc.setFontSize(7.5);
        setColor(DIMGREEN);
        doc.text("// INFO.RMAL", M, 44);
        const t = san(article.title).toUpperCase();
        doc.text(
          t.length > 52 ? t.slice(0, 51) + "..." : t,
          PW - M,
          44,
          { align: "right" }
        );
        return 78;
      }

      function newPage() {
        doc.addPage();
        paintBg();
        y = runningHeader();
      }

      function ensure(h: number) {
        if (y + h > BOTTOM) newPage();
      }

      function flow(
        text: string,
        size: number,
        color: RGB,
        style: "normal" | "bold" | "italic",
        indent = 0,
        gap = 0.5
      ) {
        doc.setFont("courier", style);
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(san(text), CW - indent) as string[];
        const lh = size * 1.5;
        for (const ln of lines) {
          ensure(lh);
          doc.setFont("courier", style);
          doc.setFontSize(size);
          setColor(color);
          doc.text(ln, M + indent, y);
          y += lh;
        }
        y += size * gap;
      }

      function heading(text: string) {
        y += 12;
        ensure(30);
        doc.setDrawColor(accent[0], accent[1], accent[2]);
        doc.setLineWidth(3);
        const top = y - 11;
        flow("> " + text, 13, accent, "bold", 12, 0.2);
        doc.line(M, top, M, y - 13);
      }

      function quote(text: string) {
        y += 10;
        doc.setFont("courier", "italic");
        doc.setFontSize(11);
        const lines = doc.splitTextToSize(
          "« " + san(text) + " »",
          CW - 24
        ) as string[];
        for (const ln of lines) {
          ensure(16);
          doc.setDrawColor(CYAN[0], CYAN[1], CYAN[2]);
          doc.setLineWidth(2);
          doc.line(M, y - 9, M, y + 3);
          doc.setFont("courier", "italic");
          doc.setFontSize(11);
          setColor(CYAN);
          doc.text(ln, M + 16, y);
          y += 16;
        }
        y += 8;
      }

      function listItem(text: string) {
        doc.setFont("courier", "normal");
        doc.setFontSize(10.5);
        const lines = doc.splitTextToSize(san(text), CW - 20) as string[];
        const lh = 10.5 * 1.5;
        lines.forEach((ln, i) => {
          ensure(lh);
          doc.setFont("courier", "normal");
          doc.setFontSize(10.5);
          if (i === 0) {
            setColor(accent);
            doc.text(">>", M, y);
          }
          setColor(GREEN);
          doc.text(ln, M + 20, y);
          y += lh;
        });
        y += 3;
      }

      // ---- Portada / header ----
      paintBg();
      doc.setDrawColor(GREEN[0], GREEN[1], GREEN[2]);
      doc.setLineWidth(1);
      doc.line(M, 54, PW - M, 54);
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      setColor(GREEN);
      doc.text("// INFO.RMAL ::: TRANSMISION CIFRADA", M, 46);
      doc.text(san(fmtDate(article.date)).toUpperCase(), PW - M, 46, {
        align: "right",
      });

      setColor(accent);
      doc.setFontSize(9);
      doc.text("[ " + san(article.category).toUpperCase() + " ]", M, 82);

      doc.setFont("courier", "bold");
      doc.setFontSize(21);
      setColor(GREEN);
      y = 106;
      for (const ln of doc.splitTextToSize(san(article.title), CW) as string[]) {
        doc.text(ln, M, y);
        y += 25;
      }

      doc.setFont("courier", "italic");
      doc.setFontSize(10.5);
      setColor(DIMGREEN);
      y += 4;
      for (const ln of doc.splitTextToSize(
        san(article.subtitle),
        CW
      ) as string[]) {
        doc.text(ln, M, y);
        y += 15;
      }

      doc.setFont("courier", "normal");
      doc.setFontSize(8.5);
      setColor(GRAY);
      y += 10;
      doc.text(
        san(article.author).toUpperCase() +
          "  //  " +
          article.readingMinutes +
          " MIN  //  ID:" +
          fp,
        M,
        y
      );
      y += 16;
      dash(M, y, PW - M, GREEN);
      y += 22;

      // ---- Cuerpo ----
      const blocks = article.body as Block[];
      for (const b of blocks) {
        if (b.type === "h2") heading(b.text);
        else if (b.type === "p") flow(b.text, 10.5, GREEN, "normal", 0, 0.7);
        else if (b.type === "quote") quote(b.text);
        else if (b.type === "list") {
          b.items.forEach((it) => listItem(it));
          y += 6;
        }
      }

      // ---- Pie de página en todas las hojas ----
      const total = doc.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.setDrawColor(40, 90, 60);
        doc.setLineWidth(0.8);
        doc.line(M, PH - 52, PW - M, PH - 52);
        doc.setFont("courier", "normal");
        doc.setFontSize(7.5);
        setColor(DIMGREEN);
        doc.text("COPYLEFT (A) - COMPARTI CON CRITERIO", M, PH - 40);
        setColor(GRAY);
        doc.text("PAG " + i + "/" + total, PW / 2, PH - 40, {
          align: "center",
        });
        doc.text("SHA256 " + fp, PW - M, PH - 40, { align: "right" });
      }

      doc.save(article.slug + ".pdf");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="pdf-btn" onClick={generate} disabled={busy}>
      {busy ? "cifrando…" : label}
    </button>
  );
}

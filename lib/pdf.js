// /lib/pdf.js — FINAL RESTORED & PATCHED

import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import path from "path";

/* ------------------------------------------------------------
   Load Inter-Regular.ttf safely
------------------------------------------------------------ */
const fontPath = path.join(process.cwd(), "lib/fonts/Inter-Regular.ttf");

let fontData = null;
try {
  fontData = fs.readFileSync(fontPath);
} catch (err) {
  console.error("⚠ Failed to load Inter font:", err);
  fontData = null;
}

/* ------------------------------------------------------------
   Convert incoming HTML → plain text for Satori
------------------------------------------------------------ */
function htmlToText(html) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ------------------------------------------------------------
   Generate PDF buffer (PNG actually, but email-safe)
------------------------------------------------------------ */
export async function generatePDFBufferFromHTML(html) {
  const text = htmlToText(html) || "(empty document)";

  const vnode = {
    type: "div",
    props: {
      style: {
        fontFamily: "Inter",
        fontSize: "16px",
        padding: "40px",
        lineHeight: "1.6",
        width: "100%",
        color: "#222",
        background: "#fff"
      },
      children: text
    }
  };

  const svg = await satori(vnode, {
    width: 1240,        // A4 width @ 96 DPI
    height: 1754,       // A4 height
    fonts: fontData
      ? [
          {
            name: "Inter",
            data: fontData,
            weight: 400,
            style: "normal"
          }
        ]
      : []
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1240 }
  });

  const png = resvg.render().asPng();

  // Always return Buffer for Resend
  return Buffer.from(png);
}

// ❌ Remove ALL Stage-2 skeleton placeholders
// export const triadEngine = true;

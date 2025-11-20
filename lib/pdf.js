// /lib/pdf.js
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import path from "path";
import url from "url";

/**
 * Load Inter font.
 * You MUST place Inter-Regular.ttf in /lib/fonts/
 */
const currentDir = path.dirname(url.fileURLToPath(import.meta.url));
const fontPath = path.join(currentDir, "fonts", "Inter-Regular.ttf");

let fontData = null;
try {
  fontData = fs.readFileSync(fontPath);
} catch (err) {
  console.error("ERROR: Font file not found at:", fontPath);
  console.error("Place Inter-Regular.ttf in /lib/fonts/");
}

/**
 * Convert REAL HTML → PDF using:
 *  - Satori (HTML → SVG layout engine)
 *  - Resvg  (SVG → PDF renderer)
 *
 * Perfect for reports, invoices, summaries, charts, etc.
 */
export async function generatePDFBufferFromHTML(htmlString) {
  // Wrap HTML inside a layout container configured for A4
  const component = {
    type: "div",
    props: {
      style: {
        width: "794px",     // A4 width
        padding: "40px",
        fontSize: "16px",
        fontFamily: "Inter",
        color: "#111",
        lineHeight: "1.55"
      },
      dangerouslySetInnerHTML: { __html: htmlString }
    }
  };

  // 1. Convert HTML → SVG via Satori
  const svg = await satori(component, {
    width: 794,
    height: 1123, // A4 height
    fonts: [
      {
        name: "Inter",
        data: fontData,
        weight: 400,
        style: "normal"
      }
    ]
  });

  // 2. Convert SVG → PDF using Resvg
  const resvgInstance = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: 794
    }
  });

  const pdf = resvgInstance.render().asPdf();
  return Buffer.from(pdf);
}

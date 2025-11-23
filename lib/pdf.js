// /lib/pdf.js — Puppeteer-core + Sparticuz Chromium (Vercel-stable)

import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export function wrapHTML(html) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      line-height: 1.6;
      color: #222;
    }
    h1 { font-size: 26px; margin-bottom: 20px; }
    pre {
      white-space: pre-wrap;
      font-size: 14px;
    }
  </style>
</head>
<body>
${html}
</body>
</html>
  `;
}

export async function generatePDFBufferFromHTML(html) {
  const executablePath = await chromium.executablePath();   // ✔ FIXED

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    headless: chromium.headless,
    executablePath,   // ✔ STRING path, not a function
  });

  const page = await browser.newPage();

  await page.setContent(wrapHTML(html), {
    waitUntil: "networkidle0"
  });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();
  return pdf;
}

// /lib/pdf.js — PUPPETEER + SPARTICUZ PDF ENGINE (FINAL)

import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

// HTML template wrapper
export function wrapHTML(content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          color: #222;
          line-height: 1.6;
        }
        h1 {
          font-size: 28px;
          margin-bottom: 20px;
        }
        pre {
          white-space: pre-wrap;
          word-break: break-word;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
}

export async function generatePDFBufferFromHTML(html) {
  const wrapped = wrapHTML(html);

  // Configure Chromium for AWS Lambda / Vercel
  const executablePath = await chromium.executablePath;

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    headless: chromium.headless,
    executablePath
  });

  const page = await browser.newPage();
  await page.setContent(wrapped, { waitUntil: "networkidle0" });

  // Generate PDF
  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "40px",
      bottom: "40px",
      left: "40px",
      right: "40px"
    }
  });

  await browser.close();
  return pdf;
}

// /lib/pdf.js — Puppeteer + Sparticuz Chromium (Vercel compatible)

import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

/**
 * HTML → PDF Buffer using Lambda-optimized Chromium
 */
export async function generatePDFBufferFromHTML(html) {
  try {
    const executablePath = await chromium.executablePath;

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: ["load", "domcontentloaded"]
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "40px",
        bottom: "40px",
        left: "24px",
        right: "24px"
      }
    });

    await browser.close();
    return pdf;

  } catch (err) {
    console.error("PDF ERROR:", err);
    throw err;
  }
}

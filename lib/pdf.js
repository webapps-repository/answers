import chromium from "@sparticuz/chromium";
import playwright from "playwright-core";

// ↓ REQUIRED BY VERCEL
chromium.setHeadlessMode(true);
chromium.setGraphicsMode(false);

export async function generatePDFBufferFromHTML(html) {
  const executablePath = await chromium.executablePath();

  const browser = await playwright.chromium.launch({
    args: chromium.args,
    executablePath,
    headless: true
  });

  const page = await browser.newPage();

  await page.setContent(html, {
    waitUntil: "networkidle"
  });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true
  });

  await browser.close();

  return pdf;
}

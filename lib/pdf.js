// /lib/pdf.js — Resend-based HTML-to-PDF generator (no Chromium required)

export function generatePDFHTML(html) {
  return `
  <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          font-size: 16px;
          line-height: 1.6;
          color: #222;
        }
        h1,h2,h3 {
          margin-top: 24px;
        }
        pre {
          white-space: pre-wrap;
          font-family: Consolas, monospace;
          background: #f5f5f5;
          padding: 12px;
          border-radius: 6px;
        }
      </style>
    </head>
    <body>
      ${html}
    </body>
  </html>
  `;
}

// ⛔ This no longer returns a Buffer
// ✔ It now returns an HTML string for Resend to convert internally.
export async function generatePDFBufferFromHTML(html) {
  return generatePDFHTML(html);
}

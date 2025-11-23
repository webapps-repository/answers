// /lib/pdf.js — Resend-based PDF generator (no chromium needed)

export function generatePDFHTML(html) {
  return `
  <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          line-height: 1.6;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 20px;
        }
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
  // Resend doesn't need a buffer — it takes HTML directly.
  return generatePDFHTML(html);
}

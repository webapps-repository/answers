export function buildUniversalEmailHTML({
  title = "Your Insight Report",
  question = "",
  engines = {},
  fullName = "",
  birthDate = "",
  birthTime = "",
  birthPlace = ""
}) {

  const style = `
    <style>
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background:#f4f4f7; 
        margin:0; padding:0;
      }
      .container {
        max-width: 720px;
        background:#ffffff;
        margin: 24px auto;
        padding: 32px;
        border-radius: 14px;
        box-shadow: 0px 4px 18px rgba(0,0,0,0.06);
      }
      h1 { font-size: 26px; font-weight:700; margin-bottom:20px; }
      h2 { font-size:20px; margin-top:30px; }
      h3 { font-size:17px; margin-top:20px; }
      .block { 
        background:#f7f7fb;
        padding:16px; 
        border-radius:10px;
        margin-top:10px;
        white-space:pre-wrap;
        line-height:1.55;
        font-size:15px;
        color:#333;
      }
      ul { line-height:1.55; }
      .section { margin-top:32px; }
      .label { font-weight:600; color:#444; }
      table { width:100%; border-collapse:collapse; margin-top:10px; }
      td { padding:8px 6px; border-bottom:1px solid #eee; vertical-align:top; }
      .key { font-weight:600; width:140px; color:#555; }
    </style>
  `;

  /* ------------------------------------
        Extract engine sections safely
  ------------------------------------ */
  const {
    answer,
    summary,
    palmistry = {},
    numerology = {},
    astrology = {},
    triad = {}
  } = engines;

  /* ------------------------------------
        Personal details block
  ------------------------------------ */
  const personalDetailsHTML =
    fullName || birthDate || birthTime || birthPlace
      ? `
        <h2>Personal Details</h2>
        <ul>
          ${fullName ? `<li><b>Name:</b> ${fullName}</li>` : ""}
          ${birthDate ? `<li><b>Date of Birth:</b> ${birthDate}</li>` : ""}
          ${birthTime ? `<li><b>Time of Birth:</b> ${birthTime}</li>` : ""}
          ${birthPlace ? `<li><b>Place of Birth:</b> ${birthPlace}</li>` : ""}
        </ul>
        `
      : "";

  /* ------------------------------------
        Build palmistry table
  ------------------------------------ */
  let palmHTML = "";
  if (palmistry && Object.keys(palmistry).length > 0) {
    palmHTML = `
      <h3>Palmistry</h3>
      <div class="block">${palmistry.summary || ""}</div>

      <table>
        ${Object.entries(palmistry)
          .filter(([k]) => k !== "summary")
          .map(([k, v]) => `
            <tr>
              <td class="key">${k}</td>
              <td>${v}</td>
            </tr>
          `)
          .join("")}
      </table>
    `;
  }

  /* ------------------------------------
        Astrology
  ------------------------------------ */
  let astroHTML = "";
  if (astrology && Object.keys(astrology).length > 0) {
    astroHTML = `
      <h3>Astrology</h3>
      <div class="block">${astrology.summary || ""}</div>
      <table>
        ${Object.entries(astrology)
          .filter(([k]) => k !== "summary")
          .map(([k, v]) => `
            <tr>
              <td class="key">${k}</td>
              <td>${v}</td>
            </tr>
          `)
          .join("")}
      </table>
    `;
  }

  /* ------------------------------------
        Numerology
  ------------------------------------ */
  let numHTML = "";
  if (numerology && Object.keys(numerology).length > 0) {
    numHTML = `
      <h3>Numerology</h3>
      <div class="block">${numerology.summary || ""}</div>
      <table>
        ${Object.entries(numerology)
          .filter(([k]) => k !== "summary")
          .map(([k, v]) => `
            <tr>
              <td class="key">${k}</td>
              <td>${v}</td>
            </tr>
          `)
          .join("")}
      </table>
    `;
  }

  /* ------------------------------------
        Triad combined insight
  ------------------------------------ */
  let triadHTML = "";
  if (triad && Object.keys(triad).length > 0) {
    triadHTML = `
      <h3>Combined Triad Insight</h3>
      <table>
        ${Object.entries(triad)
          .map(([k, v]) => `
            <tr>
              <td class="key">${k}</td>
              <td>${v}</td>
            </tr>
          `)
          .join("")}
      </table>
    `;
  }

  /* ------------------------------------
        FINAL EMAIL HTML
  ------------------------------------ */
  return `
  <!DOCTYPE html>
  <html><head>${style}</head>
  <body>
    <div class="container">

      <h1>${title}</h1>

      <h3>Your Question</h3>
      <div class="block">${question}</div>

      ${personalDetailsHTML}

      <h2>In-Depth Analysis</h2>
      <div class="block">${summary || ""}</div>

      <!-- Palmistry -->
      ${palmHTML}

      <!-- Astrology -->
      ${astroHTML}

      <!-- Numerology -->
      ${numHTML}

      <!-- Triad -->
      ${triadHTML}

      <p style="margin-top:30px; font-size:13px; color:#777;">
        This report was automatically generated based on the information you provided.
      </p>
    </div>
  </body></html>`;
}

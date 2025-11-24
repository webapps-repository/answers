/* ============================================================
   UNIVERSAL EMAIL HTML (Apple-style, clean, professional)
============================================================ */
export function buildUniversalEmailHTML({
  title = "Your Insight Report",
  question = "",
  engines = {},
  fullName = "",
  birthDate = "",
  birthTime = "",
  birthPlace = ""
}) {
  const prettyJSON = JSON.stringify(engines, null, 2);

  return `
    <div style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 24px;
      background: #f7f7f9;
      color: #222;
    ">
      <div style="
        max-width: 720px;
        background: #ffffff;
        margin: auto;
        padding: 32px;
        border-radius: 14px;
        box-shadow: 0px 4px 18px rgba(0,0,0,0.06);
      ">

        <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 10px;">
          ${title}
        </h1>

        <p style="font-size: 15px; color:#555; margin-bottom: 20px;">
          Below is your in-depth AI-generated insight based on your question.
        </p>

        <h2 style="font-size:18px; margin-bottom:6px;">Your Question</h2>
        <div style="
          background:#f2f2f5;
          padding:12px 16px;
          border-radius:10px;
          margin-bottom:22px;
          white-space:pre-wrap;
        ">${question}</div>

        ${
          fullName || birthDate || birthTime || birthPlace
            ? `
              <h2 style="font-size:18px; margin-bottom:6px;">Personal Details</h2>
              <ul style="padding-left:16px; margin-bottom:20px; color:#444; font-size:14px;">
                ${fullName ? `<li><b>Name:</b> ${fullName}</li>` : ""}
                ${birthDate ? `<li><b>Date of Birth:</b> ${birthDate}</li>` : ""}
                ${birthTime ? `<li><b>Time of Birth:</b> ${birthTime}</li>` : ""}
                ${birthPlace ? `<li><b>Place of Birth:</b> ${birthPlace}</li>` : ""}
              </ul>
            `
            : ""
        }

        <h2 style="font-size:18px; margin-bottom:6px;">In-Depth Analysis</h2>
        <div style="
          background:#f8f7ff;
          padding:16px;
          border-radius:12px;
          white-space:pre-wrap;
          font-size:14px;
          line-height:1.48;
        ">
${prettyJSON}
        </div>

        <p style="margin-top:28px; font-size:13px; color:#777;">
          This report was generated automatically.  
          If you have further questions, feel free to ask again.
        </p>

      </div>
    </div>
  `;
}

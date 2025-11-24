// /api/detailed-report.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { generateInsights, buildUniversalEmailHTML } from "../lib/insights.js";

export default async function handler(req, res) {
  return res.status(200).json({
    ok: true,
    message: "This endpoint is now internal — called by report APIs"
  });
}

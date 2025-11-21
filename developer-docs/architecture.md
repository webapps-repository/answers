
# System Architecture (Full Overview)

The Melodies Answers Platform is built as a hybrid system:

- **Shopify Frontend** — Liquid template + JavaScript
- **Vercel Serverless Backend** — Node.js APIs
- **Triad Engine** — Palmistry, Astrology, Numerology fusion AI engine
- **PDF Rendering System** — Satori + Resvg (modern minimal style)
- **Email System** — Resend API
- **ReCAPTCHA v2** — bot protection
- **Optional future integrations** — Stripe, user accounts, storage, analytics

## Core Flow

1. User asks a question on Shopify storefront
2. Frontend collects:
   - Question
   - Optional: personal info
   - Optional: palm image
   - reCAPTCHA token
3. Frontend sends to:
   - `/api/spiritual-report` for personal questions
   - `/api/detailed-report` for technical PDF requests
4. Serverless backend:
   - Verifies CORS
   - Parses form
   - Verifies reCAPTCHA
   - Classifies question (JSON-safe mode)
   - Runs Triad Engine:
     - Palmistry AI module
     - Astrology AI module
     - Numerology AI module
   - Generates short answer + insights
5. PDF Generator:
   - Builds premium PDF (ultra-minimal Apple-style)
6. Email System:
   - Sends branded HTML email
   - Attaches generated PDF
7. Frontend:
   - Displays short answer
   - Shows “PDF Sent” modal

A full diagram is located in `diagrams/system.png` (placeholder).

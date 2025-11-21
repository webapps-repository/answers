
# Backend API Documentation

There are two primary API endpoints:

---

## 1. POST /api/spiritual-report
Main processor for **personal** and **technical** questions.

### Incoming fields:
- question (string)
- isPersonal (true/false)
- recaptchaToken (string)
- email (optional)
- fullName (optional)
- birthDate (optional)
- birthTime (optional)
- birthPlace (optional)
- palmImage (optional file)

### Responsibilities:
- CORS enforcement for Shopify embedding
- Parse multipart form using formidable
- Verify Google reCAPTCHA v2
- Classify question using OpenAI in JSON-mode
- Run Triad Engine modules:
  - palmistry
  - astrology
  - numerology
- Generate insights + short answer
- Generate PDF buffer
- Email PDF if applicable
- Return JSON response to frontend

### Returns:
```
{
  "ok": true,
  "mode": "personal" | "technical",
  "shortAnswer": "...",
  "pdfEmailed": true/false,
  "insights": { ... }
}
```

---

## 2. POST /api/detailed-report
Triggered ONLY when a **technical** user clicks “Get Full Report”.

### Incoming fields:
- email
- question

### Returns:
```
{ "ok": true }
```

---

For full error codes, see `error-handling.md`.

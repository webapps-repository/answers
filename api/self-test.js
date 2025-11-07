// /api/self-test.js
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve the correct import path for verifyRecaptcha
import { verifyRecaptcha } from './utils/verify-recaptcha.js'; // ✅ fixed relative path

export default async function handler(req, res) {
  try {
    // Simple environment check
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        RECAPTCHA_SECRET_KEY: process.env.RECAPTCHA_SECRET_KEY ? '✅ Present' : '❌ Missing',
        RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY ? '✅ Present' : '❌ Missing',
        RESEND_API_KEY: process.env.RESEND_API_KEY ? '✅ Present' : '❌ Missing',
      },
      recaptcha: {},
    };

    // Run dummy verification
    const recaptchaResponse = await verifyRecaptcha('invalid_token', '127.0.0.1');
    report.recaptcha.status = recaptchaResponse?.success
      ? '❌ Unexpected success'
      : '✅ Verification failed as expected (test mode working)';
    report.recaptcha.details = recaptchaResponse;

    return res.status(200).json({
      success: true,
      message: 'GET OK - /api/self-test is operational',
      report,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error running /api/self-test',
      error: err.message,
    });
  }
}


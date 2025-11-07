// self-test.js

import { verifyRecaptcha } from '../utils/verify-recaptcha.js';

export default async function handler(req, res) {
  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      RECAPTCHA_SECRET_KEY: process.env.RECAPTCHA_SECRET_KEY ? '✅ Present' : '❌ Missing',
      RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY ? '✅ Present' : '❌ Missing',
      RESEND_API_KEY: process.env.RESEND_API_KEY ? '✅ Present' : '❌ Missing',
    },
    recaptcha: {},
  };

  // Run dummy verification (invalid token, just to test endpoint works)
  const recaptchaResponse = await verifyRecaptcha('invalid_token', '127.0.0.1');
  report.recaptcha.status = recaptchaResponse.success
    ? '❌ Unexpected success'
    : '✅ Verification failed as expected (test mode working)';
  report.recaptcha.details = recaptchaResponse;

  return res.status(200).json({
    success: true,
    message: 'GET OK - /api/self-test is operational',
    report,
  });
}

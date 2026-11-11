import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

/**
 * Rate limiter for sensitive authentication endpoints (login, registration).
 * Max 15 attempts per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Rate limiter for email triggers (resend verification, password reset requests).
 * Max 5 requests per 15 minutes per IP.
 */
export const emailActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many email requests sent. Please wait before requesting another.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});


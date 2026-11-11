import type { Request, Response, NextFunction } from 'express';
import { SessionModel, type SessionDocument } from '../models/Session.js';
import { UserModel, type UserDocument } from '../models/User.js';
import { safeEqual } from '../utils/tokens.js';

export const SESSION_COOKIE_NAME = 'anisume_session';
export const CSRF_COOKIE_NAME = 'anisume_csrf';
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Extend Express Request interface to hold authenticated user and session
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserDocument;
      session?: SessionDocument;
      csrfToken?: string;
    }
  }
}

/**
 * Attaches the session cookie (HttpOnly) and CSRF cookie (Readable by JS) to the response.
 */
export function setSessionCookies(res: Response, sessionId: string, csrfToken: string): void {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS,
    path: '/',
  });

  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // Accessible by JavaScript client to send in X-CSRF-Token header
    secure: isProduction,
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS,
    path: '/',
  });
}

/**
 * Clears the session and CSRF cookies on logout or session invalidation.
 */
export function clearSessionCookies(res: Response): void {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });

  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Resolves the active user session from cookies.
 * Does not block if unauthenticated — attaches req.user if valid.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId =
      req.cookies?.[SESSION_COOKIE_NAME] ||
      (req.headers['authorization']?.startsWith('Bearer ')
        ? req.headers['authorization'].slice(7)
        : undefined);

    if (!sessionId) {
      return next();
    }

    const session = await SessionModel.findOne({
      sessionId,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return next();
    }

    const user = await UserModel.findById(session.userId);
    if (!user) {
      // Invalidate dangling session if user was deleted
      await SessionModel.deleteOne({ _id: session._id });
      return next();
    }

    // Attach to request
    req.session = session;
    req.user = user;
    req.csrfToken = req.cookies?.[CSRF_COOKIE_NAME] || (req.headers['x-csrf-token'] as string);

    // Update lastActiveAt periodically (throttle to once per 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (session.lastActiveAt < tenMinutesAgo) {
      session.lastActiveAt = new Date();
      session.save().catch(() => {});
    }

    next();
  } catch (error) {
    console.error('[Auth Middleware] authenticate error:', error);
    next();
  }
}

/**
 * Guard middleware requiring an active authenticated session.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !req.session) {
    res.status(401).json({
      error: 'Authentication required. Please log in.',
      code: 'UNAUTHORIZED',
    });
    return;
  }
  next();
}

/**
 * Guard middleware requiring an active authenticated user with a verified email.
 */
export function requireVerifiedEmail(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required. Please log in.',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  if (!req.user.isEmailVerified) {
    res.status(403).json({
      error: 'Email verification required to perform this action. Please check your inbox.',
      code: 'EMAIL_NOT_VERIFIED',
    });
    return;
  }

  next();
}

/**
 * CSRF protection middleware for state-changing requests when session cookies are present.
 * Uses Double Submit Cookie pattern: client reads `anisume_csrf` cookie and sends it in `X-CSRF-Token` header.
 */
export function validateCsrf(req: Request, res: Response, next: NextFunction): void {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  const sessionCookie = req.cookies?.[SESSION_COOKIE_NAME];
  // If there's no session cookie, user is not performing a cookie-authenticated session action
  if (!sessionCookie) {
    return next();
  }

  const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
  const csrfHeader = (req.headers['x-csrf-token'] as string) || req.body?._csrf;

  if (!csrfCookie || !csrfHeader || !safeEqual(csrfCookie, csrfHeader)) {
    res.status(403).json({
      error: 'Invalid or missing CSRF token. Please refresh the page and try again.',
      code: 'CSRF_INVALID',
    });
    return;
  }

  next();
}


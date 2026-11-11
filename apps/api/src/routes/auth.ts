import { Router, type Request, type Response } from 'express';
import { UserModel } from '../models/User.js';
import { SessionModel } from '../models/Session.js';
import { TokenModel } from '../models/Token.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateSessionId, generateCsrfToken, generateToken, hashToken } from '../utils/tokens.js';
import { sanitizeUser } from '../utils/sanitize.js';
import { setSessionCookies, clearSessionCookies, SESSION_DURATION_MS } from '../middleware/auth.js';
import { authLimiter, emailActionLimiter } from '../middleware/rateLimit.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.js';

const router: Router = Router();

// Validation helpers
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePasswordStrength(password: string): string | null {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }
  return null;
}

/**
 * POST /api/auth/register
 * Register a new user account with email/password.
 */
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body || {};

    // 1. Validate fields
    if (!username || typeof username !== 'string' || !USERNAME_REGEX.test(username.trim())) {
      res.status(400).json({
        error: 'Username must be between 3 and 30 characters and contain only letters, numbers, underscores, and hyphens.',
        code: 'INVALID_USERNAME',
      });
      return;
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({
        error: 'Please provide a valid email address.',
        code: 'INVALID_EMAIL',
      });
      return;
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      res.status(400).json({ error: passwordError, code: 'WEAK_PASSWORD' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // 2. Duplicate checks
    const [existingEmail, existingUsername] = await Promise.all([
      UserModel.findOne({ email: cleanEmail }),
      UserModel.findOne({ username: cleanUsername }),
    ]);

    if (existingEmail) {
      res.status(409).json({
        error: 'An account with this email address already exists.',
        code: 'EMAIL_EXISTS',
      });
      return;
    }

    if (existingUsername) {
      res.status(409).json({
        error: 'This username is already taken. Please choose another.',
        code: 'USERNAME_TAKEN',
      });
      return;
    }

    // 3. Hash password using Argon2id
    const passwordHash = await hashPassword(password);

    // 4. Create user
    const user = await UserModel.create({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      isEmailVerified: false,
      emailVerifiedAt: null,
      favoriteGenres: [],
    });

    // 5. Create persistent session & CSRF token
    const sessionId = generateSessionId();
    const csrfToken = generateCsrfToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await SessionModel.create({
      sessionId,
      userId: user._id,
      expiresAt,
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || '',
      lastActiveAt: new Date(),
    });

    setSessionCookies(res, sessionId, csrfToken);

    // 6. Generate single-use verification token (24-hour expiration)
    const { token: verifyToken, hash: verifyTokenHash } = generateToken();
    const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await TokenModel.create({
      userId: user._id,
      type: 'email_verification',
      tokenHash: verifyTokenHash,
      expiresAt: verifyExpiresAt,
    });

    // Send verification email asynchronously
    sendVerificationEmail(cleanEmail, cleanUsername, verifyToken).catch((err) =>
      console.error('[Auth] Failed to send verification email on register:', err)
    );

    res.status(201).json({
      message: 'Account registered successfully. Please check your email to verify your account.',
      user: sanitizeUser(user),
      csrfToken,
    });
  } catch (error) {
    console.error('[Auth] Register error:', error);
    res.status(500).json({ error: 'Failed to register account', code: 'SERVER_ERROR' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate with email/username and password.
 */
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { identifier, email, username, password } = req.body || {};
    const candidateId = (identifier || email || username || '').trim().toLowerCase();

    if (!candidateId || !password) {
      res.status(400).json({
        error: 'Please enter your email/username and password.',
        code: 'MISSING_CREDENTIALS',
      });
      return;
    }

    // Find user by either email or username, explicitly selecting passwordHash
    const user = await UserModel.findOne({
      $or: [{ email: candidateId }, { username: candidateId }],
    }).select('+passwordHash');

    if (!user) {
      res.status(401).json({
        error: 'Invalid email/username or password.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    // Verify Argon2id hash
    const isMatch = await verifyPassword(user.passwordHash, password);
    if (!isMatch) {
      res.status(401).json({
        error: 'Invalid email/username or password.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    // Create new persistent session
    const sessionId = generateSessionId();
    const csrfToken = generateCsrfToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await SessionModel.create({
      sessionId,
      userId: user._id,
      expiresAt,
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || '',
      lastActiveAt: new Date(),
    });

    setSessionCookies(res, sessionId, csrfToken);

    res.json({
      message: 'Logged in successfully.',
      user: sanitizeUser(user),
      csrfToken,
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Failed to log in', code: 'SERVER_ERROR' });
  }
});

/**
 * POST /api/auth/logout
 * Invalidate current session and clear authentication cookies.
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    if (req.session) {
      await SessionModel.deleteOne({ _id: req.session._id });
    }

    clearSessionCookies(res);

    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    res.status(500).json({ error: 'Failed to log out', code: 'SERVER_ERROR' });
  }
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user and CSRF token, or null if unauthenticated.
 */
router.get('/me', (req: Request, res: Response) => {
  if (!req.user) {
    res.json({ user: null, csrfToken: '' });
    return;
  }

  res.json({
    user: sanitizeUser(req.user),
    csrfToken: req.csrfToken || req.cookies?.anisume_csrf || '',
  });
});

/**
 * POST /api/auth/verify-email
 * Verifies email address using single-use cryptographic token.
 */
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const token = (req.body?.token || req.query?.token as string || '').trim();

    if (!token) {
      res.status(400).json({ error: 'Verification token is required.', code: 'MISSING_TOKEN' });
      return;
    }

    const tokenHash = hashToken(token);

    const tokenDoc = await TokenModel.findOne({
      tokenHash,
      type: 'email_verification',
      expiresAt: { $gt: new Date() },
      usedAt: null,
    });

    if (!tokenDoc) {
      res.status(400).json({
        error: 'Invalid or expired verification token. Please request a new verification email.',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    // Mark token used
    tokenDoc.usedAt = new Date();
    await tokenDoc.save();

    // Update user
    const user = await UserModel.findById(tokenDoc.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.', code: 'USER_NOT_FOUND' });
      return;
    }

    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    res.json({
      message: 'Email address verified successfully!',
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('[Auth] verify-email error:', error);
    res.status(500).json({ error: 'Failed to verify email address', code: 'SERVER_ERROR' });
  }
});

/**
 * POST /api/auth/resend-verification
 * Resends verification email with rate-limiting.
 */
router.post('/resend-verification', emailActionLimiter, async (req: Request, res: Response) => {
  try {
    const emailCandidate = (req.body?.email || req.user?.email || '').trim().toLowerCase();

    // Standard generic response to prevent account enumeration
    const genericResponse = {
      message: 'If an account exists with this email address and is unverified, a verification link has been sent.',
    };

    if (!emailCandidate) {
      res.status(400).json({ error: 'Email address is required.', code: 'MISSING_EMAIL' });
      return;
    }

    const user = await UserModel.findOne({ email: emailCandidate });
    if (!user || user.isEmailVerified) {
      res.json(genericResponse);
      return;
    }

    // Invalidate existing unused verification tokens
    await TokenModel.deleteMany({ userId: user._id, type: 'email_verification' });

    // Generate new token
    const { token, hash } = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await TokenModel.create({
      userId: user._id,
      type: 'email_verification',
      tokenHash: hash,
      expiresAt,
    });

    sendVerificationEmail(user.email, user.username, token).catch((err) =>
      console.error('[Auth] Failed to send verification email:', err)
    );

    res.json(genericResponse);
  } catch (error) {
    console.error('[Auth] resend-verification error:', error);
    res.status(500).json({ error: 'Failed to process request', code: 'SERVER_ERROR' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Initiates password recovery via single-use reset token.
 */
router.post('/forgot-password', emailActionLimiter, async (req: Request, res: Response) => {
  try {
    const emailCandidate = (req.body?.email || '').trim().toLowerCase();

    const genericResponse = {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };

    if (!emailCandidate) {
      res.status(400).json({ error: 'Please enter your email address.', code: 'MISSING_EMAIL' });
      return;
    }

    const user = await UserModel.findOne({ email: emailCandidate });
    if (!user) {
      res.json(genericResponse);
      return;
    }

    // Invalidate prior unused reset tokens
    await TokenModel.deleteMany({ userId: user._id, type: 'password_reset' });

    // Generate 1-hour reset token
    const { token, hash } = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await TokenModel.create({
      userId: user._id,
      type: 'password_reset',
      tokenHash: hash,
      expiresAt,
    });

    sendPasswordResetEmail(user.email, user.username, token).catch((err) =>
      console.error('[Auth] Failed to send password reset email:', err)
    );

    res.json(genericResponse);
  } catch (error) {
    console.error('[Auth] forgot-password error:', error);
    res.status(500).json({ error: 'Failed to process request', code: 'SERVER_ERROR' });
  }
});

/**
 * POST /api/auth/reset-password
 * Completes password reset with new password, invalidating token and all active sessions.
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body || {};

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Reset token is required.', code: 'MISSING_TOKEN' });
      return;
    }

    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      res.status(400).json({ error: passwordError, code: 'WEAK_PASSWORD' });
      return;
    }

    const tokenHash = hashToken(token.trim());

    const tokenDoc = await TokenModel.findOne({
      tokenHash,
      type: 'password_reset',
      expiresAt: { $gt: new Date() },
      usedAt: null,
    });

    if (!tokenDoc) {
      res.status(400).json({
        error: 'Invalid or expired password reset token. Please request a new one.',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    const user = await UserModel.findById(tokenDoc.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.', code: 'USER_NOT_FOUND' });
      return;
    }

    // Hash new password using Argon2id
    const newPasswordHash = await hashPassword(newPassword);
    user.passwordHash = newPasswordHash;
    await user.save();

    // Mark token consumed
    tokenDoc.usedAt = new Date();
    await tokenDoc.save();

    // Security requirement: Invalidate ALL active sessions for this user
    await SessionModel.deleteMany({ userId: user._id });

    // Clear any active session cookies
    clearSessionCookies(res);

    res.json({
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    console.error('[Auth] reset-password error:', error);
    res.status(500).json({ error: 'Failed to reset password', code: 'SERVER_ERROR' });
  }
});

export default router;


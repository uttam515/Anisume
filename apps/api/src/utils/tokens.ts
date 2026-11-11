import crypto from 'node:crypto';

/**
 * Generates a cryptographically secure random token and its SHA-256 hash.
 * Only the hash should ever be stored in the database.
 */
export function generateToken(bytes = 32): { token: string; hash: string } {
  const token = crypto.randomBytes(bytes).toString('hex');
  const hash = hashToken(token);
  return { token, hash };
}

/**
 * Computes the SHA-256 digest of a plaintext token.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates a random session ID (64 characters hex).
 */
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generates a random CSRF token (32 characters hex).
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 */
export function safeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}


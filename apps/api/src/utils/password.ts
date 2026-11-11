import { hash, verify, Algorithm } from '@node-rs/argon2';

/**
 * Argon2id password hashing parameters as recommended by OWASP:
 * - Algorithm: Argon2id (resistant to GPU and side-channel attacks)
 * - Memory cost: 19456 KiB (~19 MB)
 * - Time cost / iterations: 2
 * - Parallelism: 1
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    algorithm: Algorithm.Argon2id,
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

/**
 * Verifies a plaintext password against an Argon2id hash.
 */
export async function verifyPassword(passwordHash: string, candidate: string): Promise<boolean> {
  try {
    return await verify(passwordHash, candidate);
  } catch (error) {
    console.error('[Auth] Password verification error:', error);
    return false;
  }
}


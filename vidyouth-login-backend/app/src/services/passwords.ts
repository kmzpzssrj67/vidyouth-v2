/**
 * Password hashing + verification.
 *
 * Uses bcrypt (industry standard) plus a server-side pepper (BCRYPT_PEPPER)
 * concatenated with the password before hashing. The pepper is held in
 * Secrets Manager / env, never the database — so a database leak alone
 * doesn't enable offline brute-force.
 */

import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

const pepper = (raw: string): string => `${raw}:${env.BCRYPT_PEPPER}`;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(pepper(plain), env.BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(pepper(plain), hash);
}

/** Constant-time string compare for tokens / OTPs. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

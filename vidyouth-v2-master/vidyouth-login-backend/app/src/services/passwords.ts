/**
 * Password hashing + verification.
 *
 * Uses bcrypt (industry standard) plus a server-side pepper (BCRYPT_PEPPER)
 * concatenated with the password before hashing. The pepper is held in
 * Secrets Manager / env, never the database — so a database leak alone
 * doesn't enable offline brute-force.
 */

import bcrypt from 'bcrypt';
import { env } from '@/config/env.js';

const pepper = (raw: string): string => `${raw}:${env.BCRYPT_PEPPER}`;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(pepper(plain), env.BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(pepper(plain), hash);
}

export interface PasswordStrengthResult {
  valid: boolean;
  issues: string[];
}

export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const issues: string[] = [];
  const trimmed = password.trim();

  if (password.length < 12) issues.push('minimum_length');
  if (trimmed.length === 0) issues.push('empty_password');
  if (password !== trimmed) issues.push('leading_or_trailing_space');
  if (!/[a-z]/.test(password)) issues.push('missing_lowercase');
  if (!/[A-Z]/.test(password)) issues.push('missing_uppercase');
  if (!/\d/.test(password)) issues.push('missing_number');
  if (!/[^A-Za-z0-9]/.test(password)) issues.push('missing_symbol');
  if (/(.)\1{3,}/.test(password)) issues.push('repeated_characters');

  const commonWeakPasswords = new Set([
    'password',
    'password123',
    'password123!',
    'strongpassword123!',
    'qwerty123!',
    'admin123!',
    'vidyouth123!',
  ]);
  if (commonWeakPasswords.has(password.toLowerCase())) {
    issues.push('common_password');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
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

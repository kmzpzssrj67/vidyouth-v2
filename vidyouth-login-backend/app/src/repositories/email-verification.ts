/**
 * Email verification repository.
 *
 * Stores only token hashes. The raw token is shown once to the email provider
 * and never persisted.
 */

import { query } from '../db/pg.js';

export interface EmailVerificationTokenRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  consumed_at: Date | null;
  created_at: Date;
  requested_ip: string | null;
  user_agent: string | null;
}

export interface CreateVerificationTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  requestedIp?: string | null;
  userAgent?: string | null;
}

const tokenColumns = `
  id,
  user_id,
  token_hash,
  expires_at,
  consumed_at,
  created_at,
  requested_ip::text AS requested_ip,
  user_agent
`;

export async function createVerificationToken(
  input: CreateVerificationTokenInput,
): Promise<EmailVerificationTokenRecord> {
  const result = await query<EmailVerificationTokenRecord>(
    `INSERT INTO email_verification_tokens
       (user_id, token_hash, expires_at, requested_ip, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${tokenColumns}`,
    [
      input.userId,
      input.tokenHash,
      input.expiresAt,
      input.requestedIp ?? null,
      input.userAgent ?? null,
    ],
  );
  return result.rows[0] as EmailVerificationTokenRecord;
}

export async function findValidVerificationToken(
  tokenHash: string,
): Promise<EmailVerificationTokenRecord | null> {
  const result = await query<EmailVerificationTokenRecord>(
    `SELECT ${tokenColumns}
     FROM email_verification_tokens
     WHERE token_hash = $1
       AND consumed_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function consumeVerificationToken(
  tokenHash: string,
): Promise<EmailVerificationTokenRecord | null> {
  const result = await query<EmailVerificationTokenRecord>(
    `UPDATE email_verification_tokens
     SET consumed_at = NOW()
     WHERE token_hash = $1
       AND consumed_at IS NULL
       AND expires_at > NOW()
     RETURNING ${tokenColumns}`,
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function revokeUserVerificationTokens(userId: string): Promise<void> {
  await query(
    `UPDATE email_verification_tokens
     SET consumed_at = NOW()
     WHERE user_id = $1 AND consumed_at IS NULL`,
    [userId],
  );
}
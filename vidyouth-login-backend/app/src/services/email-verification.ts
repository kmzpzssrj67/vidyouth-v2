/**
 * Email verification orchestration.
 *
 * Generates raw tokens, stores only hashes, sends through a provider
 * abstraction, and consumes tokens atomically on verification.
 */

import type { FastifyBaseLogger } from 'fastify';
import { createHash, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
import {
  consumeVerificationToken,
  createVerificationToken,
  revokeUserVerificationTokens,
} from '../repositories/email-verification.js';
import {
  findActiveUserByEmail,
  markEmailVerified,
  type UserRecord,
} from '../repositories/users.js';
import { recordAudit } from '../services/audit.js';
import { getEmailProvider } from '../services/email/index.js';

export interface IssueEmailVerificationInput {
  user: UserRecord;
  ip?: string | undefined;
  userAgent?: string | undefined;
  logger: FastifyBaseLogger;
}

export interface VerifyEmailInput {
  token: string;
  ip?: string | undefined;
  userAgent?: string | undefined;
}

export interface ResendEmailVerificationInput {
  email: string;
  ip?: string | undefined;
  userAgent?: string | undefined;
  logger: FastifyBaseLogger;
}

export class InvalidEmailVerificationTokenError extends Error {
  constructor() {
    super('invalid_email_verification_token');
    this.name = 'InvalidEmailVerificationTokenError';
  }
}

export function hashVerificationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function createRawVerificationToken(): string {
  return randomBytes(32).toString('base64url');
}

function getVerificationExpiry(): Date {
  return new Date(Date.now() + env.EMAIL_VERIFICATION_TTL_SECONDS * 1000);
}

function buildVerificationUrl(token: string): string {
  const baseUrl = env.APP_BASE_URL.replace(/\/+$/, '');
  return `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
}

export async function issueEmailVerification(
  input: IssueEmailVerificationInput,
): Promise<void> {
  if (!input.user.email || input.user.email_verified_at) return;

  const rawToken = createRawVerificationToken();
  const tokenHash = hashVerificationToken(rawToken);
  const expiresAt = getVerificationExpiry();

  await createVerificationToken({
    userId: input.user.id,
    tokenHash,
    expiresAt,
    requestedIp: input.ip ?? null,
    userAgent: input.userAgent ?? null,
  });

  await getEmailProvider().sendVerificationEmail({
    to: input.user.email,
    verificationUrl: buildVerificationUrl(rawToken),
    expiresAt,
    logger: input.logger,
  });
}

export async function verifyEmail(input: VerifyEmailInput): Promise<UserRecord> {
  const tokenHash = hashVerificationToken(input.token);
  const consumed = await consumeVerificationToken(tokenHash);

  if (!consumed) {
    await recordAudit({
      action: 'email.verification.failed',
      ip: input.ip,
      userAgent: input.userAgent,
      meta: { reason: 'invalid_or_expired' },
      succeeded: false,
    });
    throw new InvalidEmailVerificationTokenError();
  }

  const user = await markEmailVerified(consumed.user_id);
  if (!user) {
    await recordAudit({
      userId: consumed.user_id,
      action: 'email.verification.failed',
      ip: input.ip,
      userAgent: input.userAgent,
      meta: { reason: 'user_not_found' },
      succeeded: false,
    });
    throw new InvalidEmailVerificationTokenError();
  }

  await revokeUserVerificationTokens(user.id);

  await recordAudit({
    userId: user.id,
    action: 'email.verified',
    ip: input.ip,
    userAgent: input.userAgent,
    succeeded: true,
  });

  return user;
}

export async function resendEmailVerification(
  input: ResendEmailVerificationInput,
): Promise<void> {
  const user = await findActiveUserByEmail(input.email);

  // Generic behavior prevents email/account enumeration.
  if (!user || !user.email || user.email_verified_at) {
    await recordAudit({
      userId: user?.id,
      action: 'email.verification.requested',
      ip: input.ip,
      userAgent: input.userAgent,
      meta: { delivered: false },
      succeeded: true,
    });
    return;
  }

  await revokeUserVerificationTokens(user.id);
  await issueEmailVerification({
    user,
    ip: input.ip,
    userAgent: input.userAgent,
    logger: input.logger,
  });

  await recordAudit({
    userId: user.id,
    action: 'email.verification.requested',
    ip: input.ip,
    userAgent: input.userAgent,
    meta: { delivered: true },
    succeeded: true,
  });
}

// TODO(email-templates): add branded HTML and plain-text templates.
// TODO(email-queue): enqueue provider sends with retry/backoff.
// TODO(SES): plug SesEmailProvider in without changing auth/signup logic.
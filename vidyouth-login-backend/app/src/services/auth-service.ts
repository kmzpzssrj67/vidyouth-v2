/**
 * Shared auth orchestration.
 *
 * Routes decide *which* credential flow succeeded. This service performs the
 * common post-auth work: create the durable session, activate it in Redis,
 * enforce session quotas, sign JWTs, and record audit events.
 */

import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { createPasswordIdentityPlaceholder } from '../repositories/auth-identities.js';
import { createSession, type SessionRecord } from '../repositories/sessions.js';
import {
  createUser,
  findUserByEmailIncludingDeleted,
  findUserByMobileIncludingDeleted,
  updateLastLogin,
  type UserRecord,
} from '../repositories/users.js';
import { signAccess, signRefresh, type AuthClaims } from '../services/jwt.js';
import { hashPassword } from '../services/passwords.js';
import { startSession } from '../services/sessions.js';
import { recordAudit, type AuditAction } from '../services/audit.js';
import { issueEmailVerification } from '../services/email-verification.js';
import type { FastifyBaseLogger } from 'fastify';

export interface AuthenticatedSessionResult {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  session: SessionRecord;
  claims: AuthClaims;
  evictedSessionIds: string[];
}

export interface CreateAuthenticatedSessionInput {
  user: UserRecord;
  ip?: string | undefined;
  userAgent?: string | undefined;
  auditAction: AuditAction;
}

export interface SignupWithEmailPasswordInput {
  email: string;
  password: string;
  displayName: string;
  ip?: string | undefined;
  userAgent?: string | undefined;
  logger: FastifyBaseLogger;
}

export class SignupUnavailableError extends Error {
  constructor() {
    super('signup_unavailable');
    this.name = 'SignupUnavailableError';
  }
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object'
    && err !== null
    && 'code' in err
    && (err as { code?: unknown }).code === '23505';
}

export async function createAuthenticatedSession(
  input: CreateAuthenticatedSessionInput,
): Promise<AuthenticatedSessionResult> {
  const sid = randomUUID();
  const session = await createSession({
    id: sid,
    userId: input.user.id,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
  });

  const evictedSessionIds = await startSession({
    id: sid,
    userId: input.user.id,
    createdAt: Date.now(),
  });

  if (evictedSessionIds.length > 0) {
    await recordAudit({
      userId: input.user.id,
      action: 'session.evicted',
      succeeded: true,
      meta: { evicted: evictedSessionIds },
    });
  }

  const claims: AuthClaims = {
    sub: input.user.id,
    sid,
    role: input.user.role,
    org: input.user.organisation_id ?? undefined,
  };
  const access = await signAccess(claims);
  const refresh = await signRefresh({ sub: input.user.id, sid });

  await updateLastLogin(input.user.id);

  await recordAudit({
    userId: input.user.id,
    action: input.auditAction,
    ip: input.ip,
    userAgent: input.userAgent,
    succeeded: true,
  });

  return {
    access_token: access,
    refresh_token: refresh,
    token_type: 'Bearer',
    expires_in: env.JWT_ACCESS_TTL_SECONDS,
    session,
    claims,
    evictedSessionIds,
  };
}

export async function signupWithEmailPassword(
  input: SignupWithEmailPasswordInput,
): Promise<AuthenticatedSessionResult> {
  const existingEmail = await findUserByEmailIncludingDeleted(input.email);
  if (existingEmail) {
    await recordAudit({
      userId: existingEmail.deleted_at ? undefined : existingEmail.id,
      action: 'account.created',
      ip: input.ip,
      userAgent: input.userAgent,
      meta: {
        provider: 'password',
        reason: existingEmail.deleted_at ? 'deleted_email_exists' : 'email_exists',
      },
      succeeded: false,
    });
    throw new SignupUnavailableError();
  }

  // Future-safe collision check for mobile-first accounts. Email signup does
  // not set mobile today, but this preserves the repository/service boundary
  // for account linking and phone signup later.
  const existingMobile = await findUserByMobileIncludingDeleted(input.email);
  if (existingMobile) {
    await recordAudit({
      userId: existingMobile.deleted_at ? undefined : existingMobile.id,
      action: 'account.created',
      ip: input.ip,
      userAgent: input.userAgent,
      meta: { provider: 'password', reason: 'mobile_collision' },
      succeeded: false,
    });
    throw new SignupUnavailableError();
  }

  const passwordHash = await hashPassword(input.password);
  let user: UserRecord;
  try {
    user = await createUser({
      role: 'student',
      email: input.email,
      passwordHash,
      displayName: input.displayName,
    });
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    await recordAudit({
      action: 'account.created',
      ip: input.ip,
      userAgent: input.userAgent,
      meta: { provider: 'password', reason: 'duplicate_race' },
      succeeded: false,
    });
    throw new SignupUnavailableError();
  }

  await createPasswordIdentityPlaceholder({
    userId: user.id,
    email: input.email,
  });

  await issueEmailVerification({
    user,
    ip: input.ip,
    userAgent: input.userAgent,
    logger: input.logger,
  });

  // TODO(email-verification-enforcement): allow login today, but gate sensitive
  // features after signup until email_verified_at is set.
  // TODO(welcome-email): enqueue welcome email after the transaction boundary.
  // TODO(account-activation): gate activation if onboarding approval is required.
  // TODO(signup-analytics): publish account.created event for product analytics.

  return createAuthenticatedSession({
    user,
    auditAction: 'account.created',
    ip: input.ip,
    userAgent: input.userAgent,
  });
}

// TODO(oauth-identities): reuse this after Google/Apple/GitHub/Microsoft login.
// TODO(refresh-token-rotation): persist hashed refresh tokens per session.
// TODO(email-verification): gate session privileges for unverified identities.
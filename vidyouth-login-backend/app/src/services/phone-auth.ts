/**
 * Phone OTP authentication.
 *
 * Mobile-first login/signup: request an OTP for an E.164 phone number, verify
 * it, then either log in the existing user or create a passwordless account.
 */

import type { FastifyBaseLogger } from 'fastify';
import {
  createPhoneUser,
  findUserByPhone,
  markPhoneVerified,
  type UserRecord,
} from '../repositories/users.js';
import {
  createAuthenticatedSession,
  type AuthenticatedSessionResult,
} from '../services/auth-service.js';
import { recordAudit } from '../services/audit.js';
import { issueOtp, verifyOtp } from '../services/otp.js';
import { getSmsProvider } from '../services/sms/index.js';

export interface RequestPhoneOtpInput {
  phoneNumber: string;
  ip?: string | undefined;
  userAgent?: string | undefined;
  logger: FastifyBaseLogger;
}

export interface VerifyPhoneOtpInput {
  phoneNumber: string;
  code: string;
  ip?: string | undefined;
  userAgent?: string | undefined;
}

export class InvalidPhoneNumberError extends Error {
  constructor() {
    super('invalid_phone_number');
    this.name = 'InvalidPhoneNumberError';
  }
}

export class InvalidPhoneOtpError extends Error {
  constructor() {
    super('invalid_phone_otp');
    this.name = 'InvalidPhoneOtpError';
  }
}

export function normalizePhoneNumber(phoneNumber: string): string {
  const normalized = phoneNumber.trim().replace(/[()\-\s]/g, '');
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw new InvalidPhoneNumberError();
  }
  return normalized;
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object'
    && err !== null
    && 'code' in err
    && (err as { code?: unknown }).code === '23505';
}

export async function requestPhoneOtp(input: RequestPhoneOtpInput): Promise<void> {
  const phoneNumber = normalizePhoneNumber(input.phoneNumber);

  // TODO(phone-rate-limit): add per-phone, per-IP, and device fingerprint limits.
  // TODO(phone-fraud-detection): block premium-rate and suspicious destinations.
  const otp = await issueOtp('sms', phoneNumber);
  await getSmsProvider().sendOtp({
    to: phoneNumber,
    code: otp.code,
    expiresInSec: otp.expiresInSec,
    logger: input.logger,
  });

  await recordAudit({
    action: 'phone.otp.requested',
    ip: input.ip,
    userAgent: input.userAgent,
    meta: { phone_number: phoneNumber },
    succeeded: true,
  });
}

export async function verifyPhoneOtp(
  input: VerifyPhoneOtpInput,
): Promise<AuthenticatedSessionResult> {
  const phoneNumber = normalizePhoneNumber(input.phoneNumber);
  const ok = await verifyOtp('sms', phoneNumber, input.code);

  if (!ok) {
    await recordAudit({
      action: 'phone.otp.failed',
      ip: input.ip,
      userAgent: input.userAgent,
      meta: { phone_number: phoneNumber },
      succeeded: false,
    });
    throw new InvalidPhoneOtpError();
  }

  let user = await findUserByPhone(phoneNumber);
  let created = false;

  if (!user) {
    try {
      user = await createPhoneUser(phoneNumber);
      created = true;
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      user = await findUserByPhone(phoneNumber);
    }
  }

  if (!user || !user.is_active) {
    await recordAudit({
      userId: user?.id,
      action: 'phone.otp.failed',
      ip: input.ip,
      userAgent: input.userAgent,
      meta: { phone_number: phoneNumber, reason: 'inactive_or_missing_user' },
      succeeded: false,
    });
    throw new InvalidPhoneOtpError();
  }

  const verifiedUser = await markPhoneVerified(user.id, phoneNumber);
  if (!verifiedUser) {
    throw new InvalidPhoneOtpError();
  }

  await recordAudit({
    userId: verifiedUser.id,
    action: 'phone.otp.verified',
    ip: input.ip,
    userAgent: input.userAgent,
    meta: { phone_number: phoneNumber, created },
    succeeded: true,
  });

  // TODO(phone-session-revocation): optionally revoke older sessions for risky
  // phone re-verification events or SIM-swap signals.
  // TODO(MFA): reuse this flow as a second factor for password accounts.
  return createAuthenticatedSession({
    user: verifiedUser,
    auditAction: created ? 'account.created' : 'login.success',
    ip: input.ip,
    userAgent: input.userAgent,
  });
}

// TODO(phone-normalization): replace the simple E.164 check with libphonenumber.
// TODO(resend-cooldowns): add UX-friendly cooldowns separate from hard limits.
// TODO(suspicious-activity): detect impossible travel, SIM swap, and OTP sprays.
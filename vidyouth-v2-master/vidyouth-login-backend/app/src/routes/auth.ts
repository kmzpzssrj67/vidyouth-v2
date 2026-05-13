/**
 * /auth routes — email + password login, refresh, logout.
 * OTP variants live in routes/otp.ts.
 *
 * Most handlers are scaffolded with `// TODO` markers; the full DB schema
 * lands once the migrations apply on RDS. The shape and headers are correct
 * so the frontend can integrate against this scaffold today.
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { findUserByEmailOrMobile } from '@/repositories/users.js';
import { isLocked, recordFailure, resetFailures } from '@/services/lockout.js';
import { validatePasswordStrength, verifyPassword } from '@/services/passwords.js';
import { signAccess, verify } from '@/services/jwt.js';
import { endSession } from '@/services/sessions.js';
import { recordAudit } from '@/services/audit.js';
import {
  createAuthenticatedSession,
  SignupUnavailableError,
  signupWithEmailPassword,
} from '@/services/auth-service.js';
import {
  InvalidEmailVerificationTokenError,
  resendEmailVerification,
  verifyEmail,
} from '@/services/email-verification.js';

const displayName = z.string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[A-Za-z0-9][A-Za-z0-9 .'-]*[A-Za-z0-9]$/);

const signupBody = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128).superRefine((value, ctx) => {
    const strength = validatePasswordStrength(value);
    for (const issue of strength.issues) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: issue,
      });
    }
  }),
  display_name: displayName,
});

const loginBody = z.object({
  identifier: z.string().min(3).max(254),
  password: z.string().min(8).max(128),
});

const refreshBody = z.object({
  refresh_token: z.string().min(20),
});

const verifyEmailBody = z.object({
  token: z.string().min(32).max(512),
});

const resendVerificationBody = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/signup', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '10 minutes',
      },
    },
  }, async (req, reply) => {
    const parsed = signupBody.safeParse(req.body);
    if (!parsed.success) {
      await recordAudit({
        action: 'account.created',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        meta: { reason: 'invalid_request' },
        succeeded: false,
      });
      reply.code(400).send({ error: 'invalid_request', issues: parsed.error.issues });
      return;
    }

    try {
      const session = await signupWithEmailPassword({
        email: parsed.data.email,
        password: parsed.data.password,
        displayName: parsed.data.display_name,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        logger: req.log,
      });

      reply.code(201).send({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        token_type: session.token_type,
        expires_in: session.expires_in,
      });
    } catch (err) {
      if (err instanceof SignupUnavailableError) {
        reply.code(409).send({ error: 'signup_unavailable' });
        return;
      }
      throw err;
    }
  });

  app.post('/auth/verify-email', async (req, reply) => {
    const parsed = verifyEmailBody.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_request', issues: parsed.error.issues });
      return;
    }

    try {
      await verifyEmail({
        token: parsed.data.token,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      reply.send({ status: 'verified' });
    } catch (err) {
      if (err instanceof InvalidEmailVerificationTokenError) {
        reply.code(400).send({ error: 'invalid_or_expired_token' });
        return;
      }
      throw err;
    }
  });

  app.post('/auth/resend-verification', {
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '15 minutes',
      },
    },
  }, async (req, reply) => {
    const parsed = resendVerificationBody.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_request', issues: parsed.error.issues });
      return;
    }

    await resendEmailVerification({
      email: parsed.data.email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      logger: req.log,
    });

    reply.send({ status: 'sent_if_account_exists' });
  });

  app.post('/auth/login', async (req, reply) => {
    const parsed = loginBody.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_request', issues: parsed.error.issues });
      return;
    }
    const { identifier, password } = parsed.data;

    const user = await findUserByEmailOrMobile(identifier);

    // Constant-ish 401 to avoid user enumeration.
    if (!user || !user.is_active) {
      await recordAudit({
        action: 'login.failed',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        meta: { reason: 'unknown_user' },
        succeeded: false,
      });
      reply.code(401).send({ error: 'invalid_credentials' });
      return;
    }

    if (await isLocked(user.id)) {
      await recordAudit({
        userId: user.id,
        action: 'login.locked',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        succeeded: false,
      });
      reply.code(423).send({ error: 'account_locked' });
      return;
    }

    const ok = await verifyPassword(password, user.password_hash ?? '');
    if (!ok) {
      const fail = await recordFailure(user.id);
      await recordAudit({
        userId: user.id,
        action: fail.locked ? 'login.locked' : 'login.failed',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        meta: { failures: fail.failures },
        succeeded: false,
      });
      reply.code(fail.locked ? 423 : 401).send({
        error: fail.locked ? 'account_locked' : 'invalid_credentials',
      });
      return;
    }

    await resetFailures(user.id);

    const session = await createAuthenticatedSession({
      user,
      auditAction: 'login.success',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    reply.send({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      token_type: session.token_type,
      expires_in: session.expires_in,
    });
  });

  app.post('/auth/refresh', async (req, reply) => {
    const parsed = refreshBody.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_request' });
      return;
    }
    let claims;
    try {
      claims = await verify(parsed.data.refresh_token, 'refresh');
    } catch {
      reply.code(401).send({ error: 'invalid_refresh_token' });
      return;
    }

    // TODO: reload user role from DB in case it changed since the refresh token issued
    const access = await signAccess({
      sub: claims.sub,
      sid: claims.sid,
      role: claims.role ?? 'student',
    });

    await recordAudit({
      userId: claims.sub,
      action: 'session.refreshed',
      succeeded: true,
    });

    reply.send({
      access_token: access,
      token_type: 'Bearer',
      expires_in: 900,
    });
  });

  app.post('/auth/logout', { preHandler: app.auth }, async (req, reply) => {
    const u = req.user;
    if (!u) {
      reply.code(401).send({ error: 'unauthenticated' });
      return;
    }
    await endSession(u.sub, u.sid);
    await recordAudit({
      userId: u.sub,
      action: 'session.logout',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      succeeded: true,
    });
    reply.code(204).send();
  });
}

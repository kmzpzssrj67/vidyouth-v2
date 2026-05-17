/**
 * Email-verification routes.
 *   POST /auth/email-verify          — consume a verification token
 *   POST /auth/email-verify/resend   — re-issue a verification email
 *
 * Routes are thin: the orchestration (token gen, audit, revocation) lives in
 * services/email-verification.ts.
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  InvalidEmailVerificationTokenError,
  resendEmailVerification,
  verifyEmail,
} from '../services/email-verification.js';

const verifyBody = z.object({
  token: z.string().min(16).max(256),
});

const resendBody = z.object({
  email: z.string().email().max(254),
});

export async function emailVerifyRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/email-verify', async (req, reply) => {
    const parsed = verifyBody.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_request' });
      return;
    }
    try {
      const user = await verifyEmail({
        token: parsed.data.token,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      reply.send({
        id: user.id,
        email: user.email,
        email_verified_at: user.email_verified_at?.toISOString() ?? null,
      });
    } catch (err) {
      if (err instanceof InvalidEmailVerificationTokenError) {
        reply.code(400).send({ error: 'invalid_or_expired_token' });
        return;
      }
      throw err;
    }
  });

  app.post('/auth/email-verify/resend', async (req, reply) => {
    const parsed = resendBody.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_request' });
      return;
    }
    await resendEmailVerification({
      email: parsed.data.email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      logger: req.log,
    });
    // Generic 202 response — never leak whether the email exists.
    reply.code(202).send({ status: 'queued_if_eligible' });
  });
}

/**
 * Password-reset routes.
 *   POST /auth/password-reset/request  — email a reset link (generic 202)
 *   POST /auth/password-reset/confirm  — consume token + set new password
 *
 * Service is services/password-reset.ts. The request endpoint deliberately
 * returns the same 202 for known and unknown emails to prevent enumeration.
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  InvalidPasswordResetTokenError,
  WeakPasswordResetPasswordError,
  requestPasswordReset,
  resetPassword,
} from '../services/password-reset.js';

const requestBody = z.object({
  email: z.string().email().max(254),
});

const confirmBody = z.object({
  token: z.string().min(16).max(256),
  newPassword: z.string().min(8).max(128),
});

export async function passwordResetRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/password-reset/request', async (req, reply) => {
    const parsed = requestBody.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_request' });
      return;
    }
    await requestPasswordReset({
      email: parsed.data.email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      logger: req.log,
    });
    reply.code(202).send({ status: 'queued_if_eligible' });
  });

  app.post('/auth/password-reset/confirm', async (req, reply) => {
    const parsed = confirmBody.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_request' });
      return;
    }
    try {
      await resetPassword({
        token: parsed.data.token,
        newPassword: parsed.data.newPassword,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      reply.code(204).send();
    } catch (err) {
      if (err instanceof WeakPasswordResetPasswordError) {
        reply.code(400).send({ error: 'weak_password', issues: err.issues });
        return;
      }
      if (err instanceof InvalidPasswordResetTokenError) {
        reply.code(400).send({ error: 'invalid_or_expired_token' });
        return;
      }
      throw err;
    }
  });
}

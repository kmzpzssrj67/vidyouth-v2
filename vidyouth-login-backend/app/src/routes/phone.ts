/**
 * Phone OTP authentication routes.
 *   POST /auth/phone/start   — send an OTP to an E.164 phone number
 *   POST /auth/phone/verify  — verify OTP, log in or auto-create the user
 *
 * Service is services/phone-auth.ts. SMS delivery goes through the configured
 * provider (mock in dev, SNS in prod).
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  InvalidPhoneNumberError,
  InvalidPhoneOtpError,
  requestPhoneOtp,
  verifyPhoneOtp,
} from '../services/phone-auth.js';

const startBody = z.object({
  phone_number: z.string().min(8).max(20),
});

const verifyBody = z.object({
  phone_number: z.string().min(8).max(20),
  code: z.string().regex(/^\d{4,8}$/),
});

export async function phoneAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/phone/start', async (req, reply) => {
    const parsed = startBody.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_request' });
      return;
    }
    try {
      await requestPhoneOtp({
        phoneNumber: parsed.data.phone_number,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        logger: req.log,
      });
      reply.send({ status: 'sent' });
    } catch (err) {
      if (err instanceof InvalidPhoneNumberError) {
        reply.code(400).send({ error: 'invalid_phone_number' });
        return;
      }
      const e = err as { statusCode?: number };
      if (e.statusCode === 429) {
        reply.code(429).send({ error: 'rate_limited' });
        return;
      }
      throw err;
    }
  });

  app.post('/auth/phone/verify', async (req, reply) => {
    const parsed = verifyBody.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_request' });
      return;
    }
    try {
      const result = await verifyPhoneOtp({
        phoneNumber: parsed.data.phone_number,
        code: parsed.data.code,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      reply.send({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        token_type: result.token_type,
        expires_in: result.expires_in,
      });
    } catch (err) {
      if (err instanceof InvalidPhoneNumberError) {
        reply.code(400).send({ error: 'invalid_phone_number' });
        return;
      }
      if (err instanceof InvalidPhoneOtpError) {
        reply.code(401).send({ error: 'invalid_phone_otp' });
        return;
      }
      throw err;
    }
  });
}

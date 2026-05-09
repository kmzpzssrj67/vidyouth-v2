/**
 * OTP routes — /auth/otp/request and /auth/otp/verify.
 *
 * Channel is 'sms' or 'email'. The actual delivery (MSG91 / SES) is
 * abstracted to a sender service that's mocked in dev.
 */

import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { issueOtp, verifyOtp } from '@/services/otp.js';
import { recordAudit } from '@/services/audit.js';
import { query } from '@/db/pg.js';
import { signAccess, signRefresh } from '@/services/jwt.js';
import { startSession } from '@/services/sessions.js';

const requestBody = z.object({
  channel: z.enum(['sms', 'email']),
  identifier: z.string().min(3).max(254),
});

const verifyBody = z.object({
  channel: z.enum(['sms', 'email']),
  identifier: z.string().min(3).max(254),
  code: z.string().regex(/^\d{4,8}$/),
});

interface UserRow {
  id: string;
  organisation_id: string | null;
  role: 'student' | 'admin' | 'vendor' | 'organisation';
  is_active: boolean;
}

export async function otpRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/otp/request', async (req, reply) => {
    const parsed = requestBody.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_request' });
      return;
    }
    const { channel, identifier } = parsed.data;
    try {
      const { code, expiresInSec } = await issueOtp(channel, identifier);

      // TODO: dispatch to MSG91 (sms) or SES (email). For now, dev-only —
      // do NOT log the code in production.
      if (process.env.NODE_ENV !== 'production') {
        req.log.info({ channel, identifier, code }, '[DEV] OTP issued');
      }

      await recordAudit({
        action: 'otp.requested',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        meta: { channel, identifier },
        succeeded: true,
      });

      reply.send({ status: 'sent', expires_in: expiresInSec });
    } catch (err) {
      const e = err as { statusCode?: number; message?: string };
      if (e.statusCode === 429) {
        reply.code(429).send({ error: 'rate_limited' });
        return;
      }
      throw err;
    }
  });

  app.post('/auth/otp/verify', async (req, reply) => {
    const parsed = verifyBody.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_request' });
      return;
    }
    const { channel, identifier, code } = parsed.data;

    const ok = await verifyOtp(channel, identifier, code);
    if (!ok) {
      await recordAudit({
        action: 'otp.failed',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        meta: { channel, identifier },
        succeeded: false,
      });
      reply.code(401).send({ error: 'invalid_otp' });
      return;
    }

    // Resolve the user from the channel identifier.
    const result = await query<UserRow>(
      channel === 'email'
        ? `SELECT id, organisation_id, role, is_active FROM users
           WHERE lower(email) = lower($1) AND deleted_at IS NULL LIMIT 1`
        : `SELECT id, organisation_id, role, is_active FROM users
           WHERE mobile = $1 AND deleted_at IS NULL LIMIT 1`,
      [identifier],
    );
    const user = result.rows[0];
    if (!user || !user.is_active) {
      reply.code(401).send({ error: 'invalid_credentials' });
      return;
    }

    const sid = randomUUID();
    await query(
      `INSERT INTO sessions (id, user_id, ip, user_agent, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [sid, user.id, req.ip, req.headers['user-agent'] ?? null],
    );
    await startSession({ id: sid, userId: user.id, createdAt: Date.now() });

    const access = await signAccess({
      sub: user.id,
      sid,
      role: user.role,
      org: user.organisation_id ?? undefined,
    });
    const refresh = await signRefresh({ sub: user.id, sid });

    await recordAudit({
      userId: user.id,
      action: 'otp.verified',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      succeeded: true,
    });

    reply.send({
      access_token: access,
      refresh_token: refresh,
      token_type: 'Bearer',
      expires_in: 900,
    });
  });
}

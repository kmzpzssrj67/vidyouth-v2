/**
 * /auth routes — email + password login, refresh, logout.
 * OTP variants live in routes/otp.ts.
 *
 * Most handlers are scaffolded with `// TODO` markers; the full DB schema
 * lands once the migrations apply on RDS. The shape and headers are correct
 * so the frontend can integrate against this scaffold today.
 */

import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { query } from '@/db/pg.js';
import { isLocked, recordFailure, resetFailures } from '@/services/lockout.js';
import { verifyPassword } from '@/services/passwords.js';
import { signAccess, signRefresh, verify } from '@/services/jwt.js';
import { startSession, endSession } from '@/services/sessions.js';
import { recordAudit } from '@/services/audit.js';

const loginBody = z.object({
  identifier: z.string().min(3).max(254),
  password: z.string().min(8).max(128),
});

const refreshBody = z.object({
  refresh_token: z.string().min(20),
});

interface UserRow {
  id: string;
  organisation_id: string | null;
  role: 'student' | 'admin' | 'vendor' | 'organisation';
  password_hash: string;
  is_active: boolean;
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/login', async (req, reply) => {
    const parsed = loginBody.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_request', issues: parsed.error.issues });
      return;
    }
    const { identifier, password } = parsed.data;

    // Lookup by email OR mobile.
    const result = await query<UserRow>(
      `SELECT id, organisation_id, role, password_hash, is_active
       FROM users
       WHERE (lower(email) = lower($1) OR mobile = $1) AND deleted_at IS NULL
       LIMIT 1`,
      [identifier],
    );
    const user = result.rows[0];

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

    const ok = await verifyPassword(password, user.password_hash);
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

    const sid = randomUUID();
    await query(
      `INSERT INTO sessions (id, user_id, ip, user_agent, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [sid, user.id, req.ip, req.headers['user-agent'] ?? null],
    );
    const evicted = await startSession({ id: sid, userId: user.id, createdAt: Date.now() });
    if (evicted.length > 0) {
      await recordAudit({
        userId: user.id,
        action: 'session.evicted',
        succeeded: true,
        meta: { evicted },
      });
    }

    const access = await signAccess({
      sub: user.id,
      sid,
      role: user.role,
      org: user.organisation_id ?? undefined,
    });
    const refresh = await signRefresh({ sub: user.id, sid });

    await recordAudit({
      userId: user.id,
      action: 'login.success',
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

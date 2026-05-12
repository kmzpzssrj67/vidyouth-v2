/**
 * GET /me — return the authenticated user profile. Requires auth.
 */

import type { FastifyInstance } from 'fastify';
import { query } from '@/db/pg.js';

interface MeRow {
  id: string;
  email: string | null;
  mobile: string | null;
  role: string;
  organisation_id: string | null;
  display_name: string | null;
  created_at: Date;
}

export async function meRoutes(app: FastifyInstance): Promise<void> {
  app.get('/me', { preHandler: app.auth }, async (req, reply) => {
    const u = req.user;
    if (!u) {
      reply.code(401).send({ error: 'unauthenticated' });
      return;
    }
    const result = await query<MeRow>(
      `SELECT id, email, mobile, role, organisation_id, display_name, created_at
       FROM users WHERE id = $1 LIMIT 1`,
      [u.sub],
    );
    const me = result.rows[0];
    if (!me) {
      reply.code(404).send({ error: 'not_found' });
      return;
    }
    reply.send({
      id: me.id,
      email: me.email,
      mobile: me.mobile,
      role: me.role,
      organisationId: me.organisation_id,
      displayName: me.display_name,
      createdAt: me.created_at.toISOString(),
      sessionId: u.sid,
    });
  });
}

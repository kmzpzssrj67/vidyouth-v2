/**
 * GET /healthz — liveness + dependency check. Returns 200 only when the
 * app process can reach Postgres and Redis. The ALB target group polls
 * this every 10s.
 */

import type { FastifyInstance } from 'fastify';
import { pingDb } from '@/db/pg.js';
import { pingRedis } from '@/db/redis.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/healthz', async (_req, reply) => {
    const [db, cache] = await Promise.all([pingDb(), pingRedis()]);
    const ok = db && cache;
    reply.code(ok ? 200 : 503).send({
      status: ok ? 'ok' : 'degraded',
      uptimeSec: Math.round(process.uptime()),
      checks: { db, cache },
      version: process.env.GIT_SHA ?? 'dev',
    });
  });

  // Cheap liveness probe (process up; ignore deps). Useful for k8s/ASG when
  // a slow dependency shouldn't cause restart loops.
  app.get('/livez', async (_req, reply) => {
    reply.send({ status: 'ok' });
  });
}

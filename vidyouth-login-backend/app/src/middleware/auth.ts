/**
 * Auth middleware. Extracts Bearer access token, verifies signature,
 * checks the session is still active in Redis, and attaches a typed
 * `req.user` for downstream handlers.
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { verify, type AccessClaims } from '../services/jwt.js';
import { isActive } from '../services/sessions.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AccessClaims;
  }
}

export async function authRequired(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = req.headers.authorization ?? '';
  if (!header.toLowerCase().startsWith('bearer ')) {
    reply.code(401).send({ error: 'missing_token' });
    return;
  }
  const token = header.slice(7).trim();
  if (!token) {
    reply.code(401).send({ error: 'missing_token' });
    return;
  }
  let claims: AccessClaims;
  try {
    claims = await verify(token, 'access');
  } catch {
    reply.code(401).send({ error: 'invalid_token' });
    return;
  }

  // Confirm the session still exists (so logout / quota-eviction / forced
  // revocation actually invalidates the token even before its TTL runs out).
  if (!(await isActive(claims.sub, claims.sid))) {
    reply.code(401).send({ error: 'session_revoked' });
    return;
  }

  req.user = claims;
}

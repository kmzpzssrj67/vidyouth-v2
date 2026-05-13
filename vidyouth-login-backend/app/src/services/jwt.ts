/**
 * JWT signing + verification using RS256.
 *
 *   - access tokens   : short-lived (15 min default), carry sub + role + sid
 *   - refresh tokens  : long-lived (30 days default), opaque-to-clients,
 *                       sid links back to the sessions table
 *
 * Keys are PEM strings from env (loaded from Secrets Manager in prod).
 * If keys are missing the service throws on first use — useful in dev where
 * /healthz works without keys but /auth endpoints do not.
 */

import { SignJWT, jwtVerify, importPKCS8, importSPKI, type JWTPayload, type KeyLike } from 'jose';
import { env } from '../config/env.js';

let cachedPrivateKey: KeyLike | null = null;
let cachedPublicKey: KeyLike | null = null;

async function getPrivateKey(): Promise<KeyLike> {
  if (cachedPrivateKey) return cachedPrivateKey;
  if (!env.JWT_PRIVATE_KEY) throw new Error('JWT_PRIVATE_KEY not configured');
  cachedPrivateKey = await importPKCS8(env.JWT_PRIVATE_KEY, 'RS256');
  return cachedPrivateKey;
}

async function getPublicKey(): Promise<KeyLike> {
  if (cachedPublicKey) return cachedPublicKey;
  if (!env.JWT_PUBLIC_KEY) throw new Error('JWT_PUBLIC_KEY not configured');
  cachedPublicKey = await importSPKI(env.JWT_PUBLIC_KEY, 'RS256');
  return cachedPublicKey;
}

export interface AccessClaims extends JWTPayload {
  sub: string;        // user id
  sid: string;        // session id
  role: 'student' | 'admin' | 'vendor' | 'organisation' | 'superadmin';
  org?: string | undefined;
}

/** Alias for the type imported by services/auth-service.ts (added by PR #2). */
export type AuthClaims = AccessClaims;

export type TokenKind = 'access' | 'refresh';

export async function signAccess(claims: AccessClaims): Promise<string> {
  const k = await getPrivateKey();
  return new SignJWT({ ...claims, kind: 'access' satisfies TokenKind })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${env.JWT_ACCESS_TTL_SECONDS}s`)
    .sign(k);
}

export async function signRefresh(claims: Pick<AccessClaims, 'sub' | 'sid'>): Promise<string> {
  const k = await getPrivateKey();
  return new SignJWT({ sub: claims.sub, sid: claims.sid, kind: 'refresh' satisfies TokenKind })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${env.JWT_REFRESH_TTL_SECONDS}s`)
    .sign(k);
}

export async function verify(token: string, expected: TokenKind): Promise<AccessClaims> {
  const k = await getPublicKey();
  const { payload } = await jwtVerify(token, k, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
  if ((payload as { kind?: string }).kind !== expected) {
    throw new Error('wrong_token_kind');
  }
  return payload as AccessClaims;
}

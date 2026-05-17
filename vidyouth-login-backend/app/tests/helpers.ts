/**
 * Shared test helpers.
 *
 * Integration tests run the real Fastify app in-process via app.inject()
 * (no network sockets) against the live Postgres + Redis the dev stack
 * already provides. OTP codes and verification/reset tokens are produced
 * deterministically by calling the service/repository layer directly,
 * so tests never scrape logs or sleep on delivery.
 */

import { after } from 'node:test';
import { buildApp } from '../src/server.js';
import { closeDb } from '../src/db/pg.js';
import { closeRedis } from '../src/db/redis.js';
import type { FastifyInstance } from 'fastify';

let appPromise: Promise<FastifyInstance> | null = null;

/** One shared app per test file — buildApp wires DB + Redis pools. */
export async function getApp(): Promise<FastifyInstance> {
  if (!appPromise) {
    appPromise = buildApp({ logger: false }).then(async (app) => {
      await app.ready();
      return app;
    });
  }
  return appPromise;
}

// Registered at MODULE top level (not inside a test) so node:test scopes it
// to the whole file: it runs once, after every test in the file, closing the
// app + DB pool + Redis so the worker exits cleanly with no open handles.
after(async () => {
  try {
    if (appPromise) await (await appPromise).close();
  } catch {
    /* already closed */
  }
  await closeDb().catch(() => {});
  await closeRedis().catch(() => {});
});

let counter = 0;
/** Collision-proof identifiers per test. */
export function uniqueEmail(tag = 't'): string {
  counter += 1;
  return `test+${tag}.${Date.now()}.${counter}@vidyouth.test`;
}
export function uniquePhone(): string {
  counter += 1;
  // E.164, India range, last 9 digits unique-ish for the run.
  const tail = String(Date.now()).slice(-7) + String(100 + (counter % 900));
  return `+91${tail.slice(-10)}`;
}

interface InjectResult {
  status: number;
  json: <T = unknown>() => T;
  body: string;
  headers: Record<string, unknown>;
}

export async function post(
  path: string,
  payload: unknown,
  headers: Record<string, string> = {},
): Promise<InjectResult> {
  const app = await getApp();
  const res = await app.inject({
    method: 'POST',
    url: path,
    payload,
    headers: { 'content-type': 'application/json', ...headers },
  });
  return wrap(res);
}

export async function get(
  path: string,
  headers: Record<string, string> = {},
): Promise<InjectResult> {
  const app = await getApp();
  const res = await app.inject({ method: 'GET', url: path, headers });
  return wrap(res);
}

function wrap(res: {
  statusCode: number;
  body: string;
  headers: Record<string, unknown>;
}): InjectResult {
  return {
    status: res.statusCode,
    body: res.body,
    headers: res.headers,
    json: <T = unknown>() => JSON.parse(res.body) as T,
  };
}

/** Decode a JWT payload (no signature check — for asserting claims only). */
export function decodeJwt(token: string): Record<string, unknown> {
  const part = token.split('.')[1] ?? '';
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
}

/** Register a fresh email user and return its tokens + email. */
export async function signupEmailUser(password = 'GoodPass123') {
  const email = uniqueEmail('signup');
  const res = await post('/auth/signup', {
    displayName: 'Test User',
    password,
    channel: 'email',
    email,
  });
  return { email, password, res, tokens: res.status === 200 ? res.json<any>() : null };
}

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { get } from '../helpers.js';

describe('health endpoints', () => {
  test('GET /livez → 200 ok', async () => {
    const r = await get('/livez');
    assert.equal(r.status, 200);
    assert.equal(r.json<{ status: string }>().status, 'ok');
  });

  test('GET /healthz → 200 with db + cache true', async () => {
    const r = await get('/healthz');
    assert.equal(r.status, 200);
    const body = r.json<{ status: string; checks: { db: boolean; cache: boolean } }>();
    assert.equal(body.status, 'ok');
    assert.equal(body.checks.db, true, 'Postgres must be reachable');
    assert.equal(body.checks.cache, true, 'Redis must be reachable');
  });
});

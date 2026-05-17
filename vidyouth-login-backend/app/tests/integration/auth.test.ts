import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { post, get, uniqueEmail, uniquePhone, decodeJwt } from '../helpers.js';

interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

describe('POST /auth/signup', () => {
  test('email signup → 200 with a usable JWT', async () => {
    const email = uniqueEmail('su');
    const r = await post('/auth/signup', {
      displayName: 'Signup User',
      password: 'GoodPass123',
      channel: 'email',
      email,
    });
    assert.equal(r.status, 200);
    const t = r.json<Tokens>();
    assert.ok(t.access_token && t.refresh_token);
    assert.equal(t.token_type, 'Bearer');
    const claims = decodeJwt(t.access_token);
    assert.equal(claims.role, 'student');
    assert.equal((claims as { kind?: string }).kind, 'access');
  });

  test('mobile signup → 200 with a JWT', async () => {
    const r = await post('/auth/signup', {
      displayName: 'Mobile User',
      password: 'GoodPass123',
      channel: 'mobile',
      mobile: uniquePhone(),
    });
    assert.equal(r.status, 200);
    assert.ok(r.json<Tokens>().access_token);
  });

  test('duplicate email → 409 signup_unavailable', async () => {
    const email = uniqueEmail('dup');
    const body = { displayName: 'Dup', password: 'GoodPass123', channel: 'email', email };
    assert.equal((await post('/auth/signup', body)).status, 200);
    const second = await post('/auth/signup', body);
    assert.equal(second.status, 409);
    assert.equal(second.json<{ error: string }>().error, 'signup_unavailable');
  });

  test('weak password → 400', async () => {
    const r = await post('/auth/signup', {
      displayName: 'Weak',
      password: 'short',
      channel: 'email',
      email: uniqueEmail('weak'),
    });
    assert.equal(r.status, 400);
  });

  test('missing identifier for channel → 400', async () => {
    const r = await post('/auth/signup', {
      displayName: 'NoEmail',
      password: 'GoodPass123',
      channel: 'email',
    });
    assert.equal(r.status, 400);
  });
});

describe('POST /auth/login', () => {
  test('correct credentials → 200 + JWT for the same subject', async () => {
    const email = uniqueEmail('login');
    const signup = await post('/auth/signup', {
      displayName: 'Login User',
      password: 'GoodPass123',
      channel: 'email',
      email,
    });
    const sub = decodeJwt(signup.json<Tokens>().access_token).sub;

    const r = await post('/auth/login', { identifier: email, password: 'GoodPass123' });
    assert.equal(r.status, 200);
    assert.equal(decodeJwt(r.json<Tokens>().access_token).sub, sub);
  });

  test('wrong password → 401 invalid_credentials', async () => {
    const email = uniqueEmail('wrongpw');
    await post('/auth/signup', {
      displayName: 'WP',
      password: 'GoodPass123',
      channel: 'email',
      email,
    });
    const r = await post('/auth/login', { identifier: email, password: 'WrongPass999' });
    assert.equal(r.status, 401);
    assert.equal(r.json<{ error: string }>().error, 'invalid_credentials');
  });

  test('unknown user → 401 (no enumeration)', async () => {
    const r = await post('/auth/login', {
      identifier: uniqueEmail('ghost'),
      password: 'GoodPass123',
    });
    assert.equal(r.status, 401);
  });

  test('malformed body → 400', async () => {
    const r = await post('/auth/login', { identifier: 'x' });
    assert.equal(r.status, 400);
  });
});

describe('GET /me + refresh + logout', () => {
  test('Bearer token returns the profile; refresh issues a new access; logout 204', async () => {
    const email = uniqueEmail('me');
    const signup = await post('/auth/signup', {
      displayName: 'Me User',
      password: 'GoodPass123',
      channel: 'email',
      email,
    });
    const t = signup.json<Tokens>();

    const me = await get('/me', { authorization: `Bearer ${t.access_token}` });
    assert.equal(me.status, 200);
    assert.equal(me.json<{ email: string }>().email, email.toLowerCase());

    const refreshed = await post('/auth/refresh', { refresh_token: t.refresh_token });
    assert.equal(refreshed.status, 200);
    assert.ok(refreshed.json<{ access_token: string }>().access_token);

    const out = await post('/auth/logout', {}, { authorization: `Bearer ${t.access_token}` });
    assert.equal(out.status, 204);
  });

  test('GET /me without a token → 401', async () => {
    const r = await get('/me');
    assert.equal(r.status, 401);
  });

  test('refresh with a garbage token → 401', async () => {
    const r = await post('/auth/refresh', { refresh_token: 'not-a-real-token-value' });
    assert.equal(r.status, 401);
  });
});

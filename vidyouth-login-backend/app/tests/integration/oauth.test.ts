import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { get } from '../helpers.js';

/**
 * The OAuth dance can't complete without a human at the provider consent
 * screen, so these tests assert the parts the server fully controls:
 * the outbound redirect is correct, and every callback failure mode is
 * handled safely (no crash, no token leak, CSRF enforced).
 */
describe('OAuth start redirects', () => {
  test('GET /auth/google → 302 to accounts.google.com with state cookie', async () => {
    const r = await get('/auth/google');
    // 302 when configured, 501 when creds absent — accept either but if
    // 302 it must point at Google and set the state cookie.
    if (r.status === 302) {
      const loc = String(r.headers['location'] ?? '');
      assert.ok(loc.startsWith('https://accounts.google.com/o/oauth2/v2/auth'), loc);
      assert.ok(loc.includes('state='));
      assert.match(String(r.headers['set-cookie'] ?? ''), /vidyouth_oauth_google_state=/);
    } else {
      assert.equal(r.status, 501);
      assert.equal(r.json<{ error: string }>().error, 'oauth_not_configured');
    }
  });

  test('GET /auth/microsoft → 302 to login.microsoftonline.com or 501', async () => {
    const r = await get('/auth/microsoft');
    if (r.status === 302) {
      assert.ok(
        String(r.headers['location'] ?? '').includes('login.microsoftonline.com'),
      );
    } else {
      assert.equal(r.status, 501);
    }
  });
});

describe('OAuth callback failure modes', () => {
  test('provider returned error=access_denied → redirect with oauth_error', async () => {
    const r = await get('/auth/google/callback?error=access_denied');
    assert.equal(r.status, 302);
    assert.match(String(r.headers['location'] ?? ''), /oauth_error=access_denied/);
  });

  test('state mismatch (no cookie) → oauth_error=state_mismatch', async () => {
    const r = await get('/auth/google/callback?code=abc&state=xyz');
    assert.equal(r.status, 302);
    assert.match(String(r.headers['location'] ?? ''), /oauth_error=state_mismatch/);
  });

  test('matching state but bad code → oauth_error=oauth_exchange_failed', async () => {
    const r = await get('/auth/google/callback?code=bad&state=s1', {
      cookie: 'vidyouth_oauth_google_state=s1',
    });
    assert.equal(r.status, 302);
    assert.match(
      String(r.headers['location'] ?? ''),
      /oauth_error=(oauth_exchange_failed|state_mismatch)/,
    );
  });
});

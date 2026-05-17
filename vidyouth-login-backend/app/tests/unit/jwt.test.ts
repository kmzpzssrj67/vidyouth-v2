import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { signAccess, signRefresh, verify } from '../../src/services/jwt.js';

const baseClaims = {
  sub: '11111111-1111-1111-1111-111111111111',
  sid: '22222222-2222-2222-2222-222222222222',
  role: 'student' as const,
};

describe('JWT sign + verify (RS256)', () => {
  test('access token round-trips with its claims', async () => {
    const token = await signAccess(baseClaims);
    const claims = await verify(token, 'access');
    assert.equal(claims.sub, baseClaims.sub);
    assert.equal(claims.sid, baseClaims.sid);
    assert.equal(claims.role, 'student');
    assert.equal((claims as { kind?: string }).kind, 'access');
  });

  test('refresh token round-trips and is marked kind=refresh', async () => {
    const token = await signRefresh({ sub: baseClaims.sub, sid: baseClaims.sid });
    const claims = await verify(token, 'refresh');
    assert.equal(claims.sub, baseClaims.sub);
    assert.equal((claims as { kind?: string }).kind, 'refresh');
  });

  test('verifying an access token as refresh is rejected', async () => {
    const token = await signAccess(baseClaims);
    await assert.rejects(() => verify(token, 'refresh'), /wrong_token_kind/);
  });

  test('a tampered token fails verification', async () => {
    const token = await signAccess(baseClaims);
    const tampered = token.slice(0, -4) + 'AAAA';
    await assert.rejects(() => verify(tampered, 'access'));
  });

  test('garbage string fails verification', async () => {
    await assert.rejects(() => verify('not.a.jwt', 'access'));
  });
});

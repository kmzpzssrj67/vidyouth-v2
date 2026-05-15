import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  safeEqual,
  validatePasswordStrength,
} from '../../src/services/passwords.js';

describe('validatePasswordStrength', () => {
  test('accepts 8+ chars with a letter and a digit', () => {
    const r = validatePasswordStrength('GoodPass123');
    assert.equal(r.valid, true);
    assert.deepEqual(r.issues, []);
  });

  test('rejects shorter than 8', () => {
    const r = validatePasswordStrength('Ab1');
    assert.equal(r.valid, false);
    assert.ok(r.issues.includes('too_short_min_8'));
  });

  test('rejects > 128 chars', () => {
    const r = validatePasswordStrength('a1'.repeat(70)); // 140 chars
    assert.equal(r.valid, false);
    assert.ok(r.issues.includes('too_long_max_128'));
  });

  test('rejects missing digit', () => {
    const r = validatePasswordStrength('allletters');
    assert.equal(r.valid, false);
    assert.ok(r.issues.includes('missing_digit'));
  });

  test('rejects missing letter', () => {
    const r = validatePasswordStrength('12345678');
    assert.equal(r.valid, false);
    assert.ok(r.issues.includes('missing_letter'));
  });

  test('empty string is invalid', () => {
    assert.equal(validatePasswordStrength('').valid, false);
  });
});

describe('hashPassword / verifyPassword', () => {
  test('hash verifies against the original', async () => {
    const hash = await hashPassword('GoodPass123');
    assert.notEqual(hash, 'GoodPass123');
    assert.equal(await verifyPassword('GoodPass123', hash), true);
  });

  test('wrong password does not verify', async () => {
    const hash = await hashPassword('GoodPass123');
    assert.equal(await verifyPassword('WrongPass999', hash), false);
  });

  test('empty hash never verifies', async () => {
    assert.equal(await verifyPassword('anything', ''), false);
  });

  test('two hashes of the same password differ (salted)', async () => {
    const a = await hashPassword('GoodPass123');
    const b = await hashPassword('GoodPass123');
    assert.notEqual(a, b);
  });
});

describe('safeEqual', () => {
  test('equal strings → true', () => {
    assert.equal(safeEqual('abcdef', 'abcdef'), true);
  });
  test('different content same length → false', () => {
    assert.equal(safeEqual('abcdef', 'abcxef'), false);
  });
  test('different length → false', () => {
    assert.equal(safeEqual('abc', 'abcd'), false);
  });
});

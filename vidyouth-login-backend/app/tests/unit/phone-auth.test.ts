import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePhoneNumber,
  InvalidPhoneNumberError,
} from '../../src/services/phone-auth.js';

describe('normalizePhoneNumber', () => {
  test('passes a clean E.164 number through', () => {
    assert.equal(normalizePhoneNumber('+919876543210'), '+919876543210');
  });

  test('strips spaces, dashes, parentheses', () => {
    assert.equal(normalizePhoneNumber('+91 (98765) 43-210'), '+919876543210');
  });

  test('trims surrounding whitespace', () => {
    assert.equal(normalizePhoneNumber('  +14155552671  '), '+14155552671');
  });

  test('rejects a number without country code', () => {
    assert.throws(() => normalizePhoneNumber('9876543210'), InvalidPhoneNumberError);
  });

  test('rejects letters', () => {
    assert.throws(() => normalizePhoneNumber('+91ABCDEF1234'), InvalidPhoneNumberError);
  });

  test('rejects a leading +0', () => {
    assert.throws(() => normalizePhoneNumber('+0123456789'), InvalidPhoneNumberError);
  });

  test('rejects too-short numbers', () => {
    assert.throws(() => normalizePhoneNumber('+12345'), InvalidPhoneNumberError);
  });
});

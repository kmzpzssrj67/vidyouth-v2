import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { post, uniquePhone } from '../helpers.js';
import { issueOtp } from '../../src/services/otp.js';

describe('phone OTP auth', () => {
  test('start with a valid E.164 → 200 sent', async () => {
    const r = await post('/auth/phone/start', { phone_number: uniquePhone() });
    assert.equal(r.status, 200);
    assert.equal(r.json<{ status: string }>().status, 'sent');
  });

  test('start with an invalid number → 400 invalid_phone_number', async () => {
    const r = await post('/auth/phone/start', { phone_number: 'not-a-number' });
    assert.equal(r.status, 400);
    assert.equal(r.json<{ error: string }>().error, 'invalid_phone_number');
  });

  test('verify with the correct code auto-creates the account + returns JWT', async () => {
    const phone = uniquePhone();
    // phone-auth issues OTP on the 'sms' channel keyed by the E.164 number
    const { code } = await issueOtp('sms', phone);
    const r = await post('/auth/phone/verify', { phone_number: phone, code });
    assert.equal(r.status, 200);
    assert.ok(r.json<{ access_token: string }>().access_token);
  });

  test('verify with a wrong code → 401 invalid_phone_otp', async () => {
    const phone = uniquePhone();
    await issueOtp('sms', phone);
    const r = await post('/auth/phone/verify', { phone_number: phone, code: '000000' });
    assert.equal(r.status, 401);
    assert.equal(r.json<{ error: string }>().error, 'invalid_phone_otp');
  });

  test('verify with a malformed code → 400', async () => {
    const r = await post('/auth/phone/verify', {
      phone_number: uniquePhone(),
      code: 'xx',
    });
    assert.equal(r.status, 400);
  });
});

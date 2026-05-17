# Test cases — Vidyouth Login API

Every test case for the backend lives in **this folder**. Nothing test-related
sits anywhere else in `src/`.

```
tests/
├── setup.ts                  # forces NODE_ENV=test before any app import
├── helpers.ts                # in-process app (app.inject), fixtures, teardown
├── README.md                 # this index
├── unit/                     # pure logic — no Postgres / Redis, ~1.5s
│   ├── passwords.test.ts     # 13 cases
│   ├── jwt.test.ts           #  5 cases
│   └── phone-auth.test.ts    #  7 cases
└── integration/              # real Postgres + Redis via app.inject()
    ├── health.test.ts        #  2 cases
    ├── auth.test.ts          # 12 cases
    ├── otp.test.ts           #  5 cases
    ├── phone.test.ts         #  5 cases
    ├── account.test.ts       #  6 cases
    └── oauth.test.ts         #  5 cases
```

Total: **60 test cases** (25 unit + 35 integration).

## Run

```bash
npm test               # everything (unit + integration)
npm run test:unit      # unit only — no infra needed
npm run test:integration   # needs Postgres + Redis reachable via app/.env
```

Exit code is non-zero on any failure — wire `npm test` as a required CI gate
before deployment.

## What each file covers

| File | Cases |
|---|---|
| `unit/passwords.test.ts` | strength rules (length / letter / digit / max-128), bcrypt+pepper hash & verify, salting, constant-time `safeEqual` |
| `unit/jwt.test.ts` | RS256 access/refresh round-trip, wrong-kind rejection, tamper rejection, garbage rejection |
| `unit/phone-auth.test.ts` | E.164 normalization, strips spaces/dashes/parens, rejects no-country-code / letters / `+0` / too-short |
| `integration/health.test.ts` | `/livez`, `/healthz` (asserts db + cache reachable) |
| `integration/auth.test.ts` | signup (email + mobile), duplicate→409, weak pw→400, missing identifier→400; login correct / wrong / unknown / malformed; `/me` with & without token; refresh; logout |
| `integration/otp.test.ts` | email OTP request + verify, wrong code→401, single-use replay→401, malformed→400 |
| `integration/phone.test.ts` | start valid / invalid, verify auto-creates account, wrong code→401, malformed→400 |
| `integration/account.test.ts` | email-verify single-use, unknown token→400, resend no-enumeration; password-reset full cycle (old fails / new works / token single-use), weak new pw→400 |
| `integration/oauth.test.ts` | Google/Microsoft 302 redirects; callback denied / CSRF state-mismatch / bad-code all handled safely |

## Conventions

- Built on Node's built-in test runner (`node:test`) + `tsx` — no extra
  framework. Cross-platform, ESM + `.js`-import safe.
- Integration tests use `app.inject()` (in-process, no network sockets) and
  generate OTP codes / verification tokens deterministically via the service
  layer — they never scrape logs or sleep on delivery.
- Each test uses a unique email/phone (`helpers.ts`), so runs are repeatable
  against the same dev database without manual cleanup.
- `helpers.ts` registers one file-level teardown that closes the app, the
  Postgres pool, and the Redis client so every worker exits cleanly.

# Vidyouth Login Backend

Authentication service for the Vidyouth LMS — web + mobile clients,
email/password + mobile OTP, JWT sessions, audit-grade logging.

## Repo layout

```
vidyouth-login-backend/
├── app/                      Node 20 + TypeScript + Fastify API
│   ├── src/
│   │   ├── server.ts         Fastify bootstrap
│   │   ├── config/env.ts     Zod-validated env loader
│   │   ├── db/               pg pool + ioredis client
│   │   ├── middleware/       JWT auth
│   │   ├── routes/           /healthz, /auth, /auth/otp, /me
│   │   └── services/         passwords, lockout, otp, sessions, jwt, audit
│   ├── Dockerfile            multi-stage; runs as non-root
│   ├── tsconfig.json
│   └── package.json
├── database/migrations/      raw SQL (organisations → users → sessions →
│                             login_attempts → audit_events → otp_challenges)
├── docker-compose.yml        local dev: postgres + redis + api on one network
└── README.md                 you are here

../vidyouth-aws-infra/        Terraform — AWS IaC (parallel folder)
```

## Local dev — five commands

```pwsh
# 1. Build + run everything
docker compose up --build

# 2. Once the api logs "vidyouth-login-api ready", verify health
curl http://localhost:8080/healthz

# 3. Tail logs in another terminal if you want
docker compose logs -f api

# 4. Stop
docker compose down

# 5. Wipe the dev database (keeps containers, drops the volume)
docker compose down -v
```

The API will reach Postgres + Redis via the compose network. `docker
compose up` is idempotent — re-run to pick up code changes.

## API surface

| Method | Path                  | Auth | Status |
|--------|-----------------------|------|--------|
| GET    | `/healthz`            | no   | working — pings pg + redis |
| GET    | `/livez`              | no   | working — process-up only |
| POST   | `/auth/login`         | no   | wired (email/mobile + password, lockout, sessions) |
| POST   | `/auth/refresh`       | no   | wired (refresh token → new access) |
| POST   | `/auth/logout`        | yes  | wired (ends current session) |
| POST   | `/auth/otp/request`   | no   | wired (issues OTP; SMS/email delivery is mocked in dev) |
| POST   | `/auth/otp/verify`    | no   | wired (verifies + signs in) |
| GET    | `/me`                 | yes  | wired (returns profile) |

Auth tokens use **RS256** with key material from `JWT_PRIVATE_KEY` /
`JWT_PUBLIC_KEY` env vars (loaded from Secrets Manager in prod).
Refresh tokens are valid for 30 days, access tokens for 15 minutes.

## Security policy (codified)

| Rule | Where it lives |
|---|---|
| 5 failed logins → 30-min lockout | [services/lockout.ts](app/src/services/lockout.ts) |
| Max 3 active sessions per user | [services/sessions.ts](app/src/services/sessions.ts) |
| OTP rate-limit 5 per 10 min per identifier | [services/otp.ts](app/src/services/otp.ts) |
| OTP TTL 10 min | env `OTP_TTL_SECONDS` |
| Bcrypt rounds = 12 + server-side pepper | [services/passwords.ts](app/src/services/passwords.ts) |
| All errors include constant-time response shape | [routes/auth.ts](app/src/routes/auth.ts) |
| Sensitive fields redacted from request logs | [server.ts](app/src/server.ts) `redact:` |

## AWS infra (separate folder)

Infrastructure-as-code lives at [`../vidyouth-aws-infra/`](../vidyouth-aws-infra/)
in **Terraform** (per the project's existing toolchain). The Terraform
project provisions:

- VPC (Multi-AZ, public/private/data subnets, 1–2 NAT gateways)
- KMS keys (data, secrets, audit) + IAM roles
- RDS Postgres 16 (Multi-AZ in production, single-AZ in learning mode)
- ElastiCache Redis 7 replication group
- ECR repository for the auth-service image
- EC2 launch template + ASG + ALB + listeners
- Route 53 + CloudFront + ACM + WAFv2 (conditional on a domain being set)
- CloudWatch alarms + CloudTrail + S3 audit archive with Object Lock

Cost knobs sit in `vidyouth-aws-infra/variables.tf` under `cost_mode`
(`production` ≈ ₹60,000/mo, `learning` ≈ ₹7,500/mo).

### Deploy steps (once IAM is sorted)

```pwsh
# 0. Verify CLI auth
aws sts get-caller-identity --profile vidyouth

# 1. Create state bucket + lock table (one-time)
cd ..\vidyouth-aws-infra
.\bootstrap-backend.ps1     # uses --profile vidyouth by default

# 2. Configure inputs
copy terraform.tfvars.example terraform.tfvars
# edit cost_mode, domain_name, alerts_email

# 3. Init + plan + apply
terraform init
terraform plan -out tfplan
terraform apply tfplan
```

## Status

| Layer | Status |
|---|---|
| App scaffold (this folder) | done — `docker compose up` works |
| DB migrations | done — auto-applied via `/docker-entrypoint-initdb.d` mount |
| Terraform scaffolding (versions, providers, backend, vars) | done |
| Terraform modules (kms/iam/vpc/rds/redis/ecr/asg/alb/edge/observability) | not yet — blocked on AWS IAM permissions |
| AWS state backend (S3 + DynamoDB) | not yet — blocked on AWS IAM permissions |
| Live AWS deploy | not yet |

The IAM blocker: the CLI is authenticated as `arn:aws:iam::940932546129:user/sunny`
who currently has zero policies attached. Attach `AdministratorAccess` (or a
narrower set: `AmazonS3FullAccess`, `AmazonDynamoDBFullAccess`, `IAMFullAccess`,
`AmazonVPCFullAccess`, `AmazonRDSFullAccess`, `AmazonElastiCacheFullAccess`,
`AmazonEC2ContainerRegistryFullAccess`, `AWSKeyManagementServicePowerUser`,
`SecretsManagerReadWrite`, `CloudWatchFullAccess`, `AWSCloudFrontFullAccess`,
`AWSWAFConsoleFullAccess`) to user `sunny`, then say "done" to resume.

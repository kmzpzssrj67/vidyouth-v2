# Vidyouth Backend Docker Setup

This guide is only for the Node.js + TypeScript + Fastify backend in this folder.

## 1. Install Docker Desktop on Windows

### Step 1: Enable WSL2

Open PowerShell as Administrator and run:

```powershell
wsl --install
```

Restart Windows if it asks you to.

After restart, verify WSL:

```powershell
wsl --status
wsl --list --verbose
```

If WSL is installed but not using version 2, run:

```powershell
wsl --set-default-version 2
```

### Step 2: Install Docker Desktop

1. Download Docker Desktop for Windows from `https://www.docker.com/products/docker-desktop/`.
2. Run the installer.
3. Keep `Use WSL 2 instead of Hyper-V` enabled.
4. Finish installation.
5. Restart Windows if requested.
6. Open Docker Desktop.
7. Go to `Settings > General` and confirm `Use the WSL 2 based engine` is enabled.
8. Go to `Settings > Resources > WSL Integration` and enable your default Linux distro.

### Step 3: Verify Docker

Open a new PowerShell window:

```powershell
docker --version
docker compose version
docker run hello-world
```

If all three commands work, Docker is ready.

## 2. Project Docker Analysis

Backend folder:

```text
vidyouth-login-backend/
  app/
    src/
    package.json
    package-lock.json
    tsconfig.json
    Dockerfile
    .dockerignore
  database/
    migrations/
  docker-compose.yml
  docker-compose.prod.yml
  .env.docker.example
```

Required Docker files:

- `app/Dockerfile`: builds the Fastify API image.
- `docker-compose.yml`: local development with API + Postgres + Redis.
- `docker-compose.prod.yml`: production-mode override for the API image.
- `app/.dockerignore`: keeps unnecessary files out of Docker builds.
- `.env.docker.example`: template for Docker Compose environment variables.

Docker-related dependency added:

- `tsc-alias`: rewrites TypeScript `@/...` path aliases after `tsc` builds the app. Without this, compiled production JavaScript can fail at runtime.

## 3. Environment Setup

From this folder:

```powershell
cd D:\vidyouth-v2-master\vidyouth-v2-master\vidyouth-login-backend
copy .env.docker.example .env
```

The default `.env` values are enough for `/healthz` and `/livez`.

For real login token signing, fill:

```env
JWT_PRIVATE_KEY=
JWT_PUBLIC_KEY=
```

## 4. Development Mode

Development mode uses:

- TypeScript source files
- `tsx watch`
- hot reload
- local Postgres container
- local Redis container
- API exposed at `http://localhost:8080`

Start everything:

```powershell
docker compose up --build
```

Run in background:

```powershell
docker compose up --build -d
```

View logs:

```powershell
docker compose logs -f api
```

Stop containers:

```powershell
docker compose down
```

Stop containers and delete the Postgres volume:

```powershell
docker compose down -v
```

Rebuild after dependency changes:

```powershell
docker compose build --no-cache api
docker compose up -d
```

### Applying New Migrations To An Existing Dev Database

Postgres only runs files mounted at `/docker-entrypoint-initdb.d` when the
database volume is created for the first time. If a new SQL file is added after
your local `vidyouth-pgdata` volume already exists, apply it manually without
resetting data:

```powershell
docker exec vidyouth-postgres psql -U vidyouth -d vidyouth_lms -f /docker-entrypoint-initdb.d/009_phone_auth_columns.sql
```

Or use the helper script from this folder:

```powershell
.\scripts\apply-migration.ps1 -FileName 009_phone_auth_columns.sql
```

Verify the phone auth columns:

```powershell
docker exec vidyouth-postgres psql -U vidyouth -d vidyouth_lms -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name IN ('phone_number','phone_verified_at') ORDER BY column_name;"
```

## 5. Production Mode

Production mode uses:

- TypeScript build output from `dist/`
- `node dist/server.js`
- no source-code bind mount
- non-root container user
- Docker healthcheck

Build production image:

```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml build api
```

Start production-mode stack:

```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

View production logs:

```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api
```

Stop production-mode stack:

```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

## 6. Useful Docker Commands

Build only the API image:

```powershell
docker compose build api
```

Start all containers:

```powershell
docker compose up -d
```

Stop all containers:

```powershell
docker compose down
```

Restart only API:

```powershell
docker compose restart api
```

View all logs:

```powershell
docker compose logs -f
```

View API logs:

```powershell
docker compose logs -f api
```

List running containers:

```powershell
docker ps
```

Open a shell inside the API container:

```powershell
docker compose exec api sh
```

Rebuild everything:

```powershell
docker compose up --build -d
```

## 7. Verification

Check containers:

```powershell
docker compose ps
```

Expected services:

- `vidyouth-api`
- `vidyouth-postgres`
- `vidyouth-redis`

Check API liveness:

```powershell
curl http://localhost:8080/livez
```

Expected:

```json
{"status":"ok"}
```

Check API dependency health:

```powershell
curl http://localhost:8080/healthz
```

Expected:

```json
{
  "status": "ok",
  "checks": {
    "db": true,
    "cache": true
  }
}
```

Check exposed ports:

```powershell
docker compose ps
```

Expected port mappings:

- API: `localhost:8080 -> container:8080`
- Postgres: `localhost:5432 -> container:5432`
- Redis: `localhost:6379 -> container:6379`

## 8. Beginner Concepts

### Docker Image

An image is a packaged version of your application. It contains Node.js, your installed dependencies, and your built app.

For this project, the API image is built from:

```text
app/Dockerfile
```

### Container

A container is a running image.

This project runs three containers:

- API container
- Postgres container
- Redis container

### Volume

A volume stores data outside the container lifecycle.

This project uses:

```text
vidyouth-pgdata
```

That keeps Postgres data even if you stop and recreate containers.

### Docker Compose

Docker Compose runs multiple containers together using one YAML file.

This project uses Compose to start:

- Fastify API
- Postgres
- Redis
- shared backend network
- persistent database volume

### Networking

Compose creates a private network named:

```text
vidyouth-backend
```

Inside that network, the API connects to:

```text
postgres:5432
redis:6379
```

Your browser or tools connect from Windows using:

```text
http://localhost:8080
```

## 9. Notes For AWS/Terraform

This Docker setup does not change your Terraform files.

Terraform can later use the production Docker image by:

1. Building the production image.
2. Pushing it to ECR.
3. Updating the image tag used by your AWS application layer.

The local Docker setup is for development and local production-style testing.

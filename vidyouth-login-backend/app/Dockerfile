# syntax=docker/dockerfile:1.7
# Multi-stage build for the Vidyouth login API.
# Final image is Node 20 LTS on Alpine, ~150 MB, runs as non-root.

# ─── deps ────────────────────────────────────────────────────────────────────
FROM node:20.11.1-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force

# ─── build ───────────────────────────────────────────────────────────────────
FROM node:20.11.1-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── runtime ─────────────────────────────────────────────────────────────────
FROM node:20.11.1-alpine AS runtime
RUN apk add --no-cache tini && \
    addgroup -S vidyouth && adduser -S vidyouth -G vidyouth
WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080 \
    NPM_CONFIG_LOGLEVEL=warn

COPY --from=deps  /app/node_modules ./node_modules
COPY --from=build /app/dist         ./dist
COPY package.json ./

USER vidyouth
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/livez || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]

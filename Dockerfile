# ── OpenMind — one laptop, one command ──────────────────────────────────────
# Build:  docker build -t openmind .
# Run:    docker run -p 4173:4173 -v ./openmind-data:/data openmind
# Or:     docker compose up -d

# 1. Install exact dependencies from the lockfile.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# 2. Build the standalone server (next.config.mjs: output "standalone").
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3. Runtime: standalone server only — no npm, no source, no build tools.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=4173 \
    HOSTNAME=0.0.0.0 \
    OPENMIND_DATA_DIR=/data

# Run as a non-root user; data volume owned by the same user.
RUN addgroup -S openmind && adduser -S openmind -G openmind \
    && mkdir -p /data && chown openmind:openmind /data
VOLUME /data

COPY --from=build --chown=openmind:openmind /app/.next/standalone ./
COPY --from=build --chown=openmind:openmind /app/.next/static ./.next/static
COPY --from=build --chown=openmind:openmind /app/public ./public

USER openmind
EXPOSE 4173
CMD ["node", "server.js"]

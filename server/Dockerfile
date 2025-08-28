# Stage1 Base
FROM oven/bun:1.1.36-slim AS base
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# Stage 3: Builder
FROM base AS builder
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run db:generate

RUN bun run build

# Stage 4: Production
FROM base AS production
WORKDIR /app

RUN apt-get update && apt-get install -y curl dnsutils && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bunjs

COPY --from=deps --chown=bunjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=bunjs:nodejs /app/dist ./dist
COPY --from=builder --chown=bunjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=bunjs:nodejs /app/prisma ./prisma

ENV NODE_ENV=production
ENV BUN_ENV=production

USER bunjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["bun", "run", "start"]
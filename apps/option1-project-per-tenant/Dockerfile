FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

# ── deps stage ──────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json turbo.json ./
COPY apps/option1-project-per-tenant/package.json ./apps/option1-project-per-tenant/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY packages/logger/package.json ./packages/logger/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/medplum/package.json ./packages/medplum/
COPY packages/database/package.json ./packages/database/
RUN npm install --frozen-lockfile

# ── build stage ─────────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN npm run build -- --filter=option1-project-per-tenant...

# ── production stage ─────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/option1-project-per-tenant/dist ./apps/option1-project-per-tenant/dist
COPY --from=builder /app/apps/option1-project-per-tenant/package.json ./apps/option1-project-per-tenant/
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

WORKDIR /app/apps/option1-project-per-tenant

RUN npx prisma generate --schema=../../packages/database/prisma/schema.prisma

EXPOSE 3001
CMD ["node", "dist/index.js"]

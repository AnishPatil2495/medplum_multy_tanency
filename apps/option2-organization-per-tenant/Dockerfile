FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS deps
COPY package.json turbo.json ./
COPY apps/option2-organization-per-tenant/package.json ./apps/option2-organization-per-tenant/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY packages/logger/package.json ./packages/logger/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/medplum/package.json ./packages/medplum/
COPY packages/database/package.json ./packages/database/
RUN npm install --frozen-lockfile

FROM deps AS builder
COPY . .
RUN npm run build -- --filter=option2-organization-per-tenant...

FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/option2-organization-per-tenant/dist ./apps/option2-organization-per-tenant/dist
COPY --from=builder /app/apps/option2-organization-per-tenant/package.json ./apps/option2-organization-per-tenant/
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

WORKDIR /app/apps/option2-organization-per-tenant

RUN npx prisma generate --schema=../../packages/database/prisma/schema.prisma

EXPOSE 3002
CMD ["node", "dist/index.js"]

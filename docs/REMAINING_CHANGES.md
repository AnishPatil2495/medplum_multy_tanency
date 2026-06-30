# Remaining Changes — Resume Point

## Status Summary

| Phase | Status |
|-------|--------|
| Phase 1: Monorepo + shared packages + Docker | ✅ Complete |
| Phase 2: App 1 (Project-per-Tenant) | ✅ Complete |
| Phase 3: App 2 (Organization-per-Tenant) | ✅ Complete |
| Phase 4: Tests (Vitest) | ✅ Complete |
| Phase 5: Docs + Postman + Diagrams | ✅ Complete |
| TypeScript compile fixes | ✅ Complete |
| Full build verification | ✅ Complete |

---

## All Fixes Applied

### 1. App 2 TypeScript — `practitioner.service.ts`

**Root cause**: `client.search('PractitionerRole', ...)` types `entry.resource` as `PractitionerRole`,
but with `_include=PractitionerRole:practitioner` the bundle also contains `Practitioner` resources.
TypeScript rejects comparing `PractitionerRole.resourceType` to `'Practitioner'`.

**Fix** (lines 103–105): Cast through `unknown` first, then use a type-predicate filter:

```ts
const practitioners = (roleBundle.entry ?? [])
  .map((e) => e.resource as unknown as Practitioner | PractitionerRole | undefined)
  .filter((r): r is Practitioner => r?.resourceType === 'Practitioner');
```

### 2. Vitest alias location — both app configs

**Root cause**: `test.alias` is processed after Vite's module resolution; `@repo/*` package
imports were failing because Vite resolved them against `package.json#main` (which points to
`./dist/index.js`, not built yet) before the alias was applied.

**Fix**: Move aliases from `test.alias` into `resolve.alias` in both
[apps/option1-project-per-tenant/vitest.config.ts](../apps/option1-project-per-tenant/vitest.config.ts) and
[apps/option2-organization-per-tenant/vitest.config.ts](../apps/option2-organization-per-tenant/vitest.config.ts).

### 3. Root vitest workspace config

**Root cause**: Running `npx vitest run` from the repo root used a single Vite instance with no
aliases, ignoring per-app configs entirely.

**Fix**: Added [vitest.workspace.ts](../vitest.workspace.ts) at the repo root:

```ts
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/utils/vitest.config.ts',
  'apps/option1-project-per-tenant/vitest.config.ts',
  'apps/option2-organization-per-tenant/vitest.config.ts',
]);
```

Also added `test` + `test:all` + `test:watch` scripts to root `package.json` and
`vitest` to root `devDependencies`.

### 4. `packages/utils/package.json` — missing test script

Added `"test": "vitest run"` so `turbo run test` includes the utils test suite.

### 5. App 2 patient search test — URL encoding

**Root cause**: The service uses `URLSearchParams.toString()` which encodes `/` as `%2F`.
The test asserted the raw string contained `'Organization/org-1'`.

**Fix**: Decode before asserting:

```ts
expect(decodeURIComponent(queryArg)).toContain('Organization/org-1');
```

---

## Verified Final State

```
✓ tsc --noEmit (App 1)  → EXIT 0
✓ tsc --noEmit (App 2)  → EXIT 0
✓ npm run test:all       → 7 test files, 48 tests, 0 failures
✓ turbo run build        → 9 tasks, 9 successful
```

---

## Next Steps (runtime — requires env/Docker)

### 1 — Start dependencies

```bash
npm run docker:up
# Wait ~30 s for Medplum server to initialize
```

### 2 — Copy and edit .env files

```bash
cp apps/option1-project-per-tenant/.env.example apps/option1-project-per-tenant/.env
cp apps/option2-organization-per-tenant/.env.example apps/option2-organization-per-tenant/.env
# Edit both files with real credentials
```

### 3 — Run database migrations

```bash
npm run db:migrate
```

### 4 — Start both apps in dev mode

```bash
npm run dev
# App 1 → http://localhost:3001
# App 2 → http://localhost:3002
```

### 5 — Import Postman collections

- `docs/postman/app1-project-per-tenant.json`
- `docs/postman/app2-organization-per-tenant.json`

---

## Known Notes

1. `medplum-server.config.json` in `docker/` uses a placeholder RSA private key — replace with a
   real key before running Medplum in production or for full OAuth flows.
2. App 1's super-admin tenant registration flow requires Medplum to have a pre-configured
   super-admin `ClientApplication` (id + secret match `MEDPLUM_SUPER_ADMIN_CLIENT_*` env vars).
3. The Prisma types require `npm run db:generate` to have been run at least once
   (`packages/database/prisma/schema.prisma` → `node_modules/.prisma/client`).

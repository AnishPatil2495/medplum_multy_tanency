# Project Structure

## Monorepo Layout

```
medplum-multi-tenancy/
├── apps/
│   ├── option1-project-per-tenant/     # App 1: Each tenant = Medplum Project
│   │   ├── src/
│   │   │   ├── config/                 # Parses App1Config from env
│   │   │   ├── controllers/            # HTTP request handlers
│   │   │   ├── medplum/                # Tenant-aware client provider + cache
│   │   │   ├── middleware/             # TenantResolver, auth guards
│   │   │   ├── repositories/           # Prisma data access (tenant, user)
│   │   │   ├── routes/                 # Express routers
│   │   │   ├── services/               # Business logic
│   │   │   ├── types/                  # Express augmentations
│   │   │   ├── utils/                  # DI container
│   │   │   ├── validators/             # Zod schemas
│   │   │   ├── app.ts                  # Express factory
│   │   │   └── index.ts                # Entry point
│   │   ├── Dockerfile
│   │   ├── vitest.config.ts
│   │   └── package.json
│   │
│   └── option2-organization-per-tenant/ # App 2: Each tenant = FHIR Organization
│       ├── src/
│       │   ├── config/                  # Parses App2Config from env
│       │   ├── controllers/             # HTTP request handlers
│       │   ├── medplum/                 # Shared client provider
│       │   ├── middleware/              # TenantOrgResolver (loads Organization)
│       │   ├── repositories/            # Prisma data access (tenant, user)
│       │   ├── routes/                  # Express routers
│       │   ├── services/                # Business logic (auto-injects org)
│       │   ├── types/                   # Express augmentations
│       │   ├── utils/                   # DI container
│       │   ├── validators/              # Zod schemas
│       │   ├── app.ts
│       │   └── index.ts
│       ├── Dockerfile
│       ├── vitest.config.ts
│       └── package.json
│
├── packages/
│   ├── config/          # Zod config schemas (BaseAppConfig, App1Config, App2Config)
│   ├── logger/          # Pino logger factory
│   ├── types/           # Shared TypeScript types (Tenant, User, API, FHIR DTOs)
│   ├── utils/           # AppError, response helpers, FHIR builders, slug, crypto
│   ├── medplum/         # MedplumClientFactory, MedplumClientCache, FhirValidator
│   ├── database/        # PrismaClient singleton, shared schema.prisma
│   └── shared/          # Express middleware (error handler, auth, validate, logger, app factory)
│
├── docker/
│   ├── docker-compose.yml
│   ├── medplum-server.config.json
│   └── postgres/init.sql
│
├── docs/
│   ├── setup.md
│   ├── architecture-option1.md
│   ├── architecture-option2.md
│   ├── comparison.md
│   ├── project-structure.md       ← you are here
│   └── postman/
│
├── turbo.json
├── tsconfig.base.json
├── .eslintrc.base.js
├── .prettierrc
└── package.json
```

## Package Dependency Graph

```mermaid
graph TD
    A1[option1-project-per-tenant] --> SH[shared]
    A1 --> CF[config]
    A1 --> LG[logger]
    A1 --> TY[types]
    A1 --> UT[utils]
    A1 --> MP[medplum]
    A1 --> DB[database]

    A2[option2-organization-per-tenant] --> SH
    A2 --> CF
    A2 --> LG
    A2 --> TY
    A2 --> UT
    A2 --> MP
    A2 --> DB

    SH --> CF
    SH --> LG
    SH --> TY
    SH --> UT

    MP --> LG
    MP --> TY
    MP --> UT

    DB --> nothing[(@prisma/client)]
    UT --> TY
    CF --> nothing2[(zod + dotenv)]
    LG --> nothing3[(pino)]
```

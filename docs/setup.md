# Setup Guide

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20.0.0 |
| npm | ≥ 10.0.0 |
| Docker Desktop | ≥ 4.x |
| Postman | any |

---

## 1 — Clone & Install

```bash
cd "Medplum Multi Tenancy"
npm install
```

---

## 2 — Start Infrastructure (PostgreSQL + Medplum)

```bash
# Copy the docker env template
cp docker/.env.example docker/.env

# Start PostgreSQL and Medplum server
npm run docker:up
```

PostgreSQL is exposed on port **5432**.  
Medplum server is exposed on port **8103**.

Wait ~30 seconds for Medplum to finish its first-run migrations.

---

## 3 — Configure Medplum

Open `http://localhost:8103` in a browser.  
Complete the initial Medplum setup wizard to create a super-admin account.  
Then create a **Client Application** under Project Settings and note:

- `clientId`
- `clientSecret`

---

## 4 — Configure App 1 (Project-per-Tenant)

```bash
cp apps/option1-project-per-tenant/.env.example apps/option1-project-per-tenant/.env
```

Edit the `.env` and fill in:

```env
DATABASE_URL=postgresql://medplum:medplum_secret@localhost:5432/medplum_poc_app1
JWT_SECRET=<random-32-char-string>
MEDPLUM_SUPER_ADMIN_CLIENT_ID=<from step 3>
MEDPLUM_SUPER_ADMIN_CLIENT_SECRET=<from step 3>
```

Run migrations:

```bash
cd apps/option1-project-per-tenant
npm run db:migrate:dev
```

---

## 5 — Configure App 2 (Organization-per-Tenant)

```bash
cp apps/option2-organization-per-tenant/.env.example apps/option2-organization-per-tenant/.env
```

Edit the `.env`:

```env
DATABASE_URL=postgresql://medplum:medplum_secret@localhost:5432/medplum_poc_app2
JWT_SECRET=<random-32-char-string>
MEDPLUM_PROJECT_ID=<your shared project ID>
MEDPLUM_CLIENT_ID=<from step 3>
MEDPLUM_CLIENT_SECRET=<from step 3>
```

Run migrations:

```bash
cd apps/option2-organization-per-tenant
npm run db:migrate:dev
```

---

## 6 — Start Both Apps

```bash
# From monorepo root
npm run dev
```

| App | Port | Swagger |
|-----|------|---------|
| App 1 (Project-per-Tenant) | 3001 | http://localhost:3001/api-docs |
| App 2 (Organization-per-Tenant) | 3002 | http://localhost:3002/api-docs |

---

## 7 — Run Tests

```bash
npm run test
```

---

## 8 — Import Postman Collections

Import the files from `docs/postman/` into Postman.

Set the `baseUrl` environment variable:
- App 1: `http://localhost:3001`
- App 2: `http://localhost:3002`

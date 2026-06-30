#!/usr/bin/env bash
set -e

echo "==> Setting up databases for both apps..."

# App 1
echo "==> Running App 1 migrations..."
(cd apps/option1-project-per-tenant && npm run db:migrate:dev -- --name init)

# App 2
echo "==> Running App 2 migrations..."
(cd apps/option2-organization-per-tenant && npm run db:migrate:dev -- --name init)

echo "==> Done! Both databases are ready."

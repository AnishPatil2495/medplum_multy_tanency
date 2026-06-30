import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/utils/vitest.config.ts',
  'apps/option1-project-per-tenant/vitest.config.ts',
  'apps/option2-organization-per-tenant/vitest.config.ts',
]);

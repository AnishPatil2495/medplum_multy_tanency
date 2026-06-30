import { loadEnv, parseConfig, App1ConfigSchema } from '@repo/config';

loadEnv();

export const config = parseConfig(App1ConfigSchema);

export default config;

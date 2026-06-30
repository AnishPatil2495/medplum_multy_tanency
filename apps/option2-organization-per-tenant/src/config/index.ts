import { loadEnv, parseConfig, App2ConfigSchema } from '@repo/config';

loadEnv();

export const config = parseConfig(App2ConfigSchema);

export default config;

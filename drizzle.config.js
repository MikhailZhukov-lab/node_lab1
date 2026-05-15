import { readFileSync } from 'node:fs';
import { env as runtimeEnv } from 'node:process';
import { parseEnv } from 'node:util';
import { defineConfig } from 'drizzle-kit';

function loadEnvConfig() {
  try {
    const envFile = readFileSync(new URL('./.env', import.meta.url), 'utf8');
    return {
      ...parseEnv(envFile),
      ...runtimeEnv,
    };
  } catch {
    return { ...runtimeEnv };
  }
}

const config = loadEnvConfig();

export default defineConfig({
  dialect: 'mysql',
  schema: './db/schema.js',
  out: './drizzle',
  dbCredentials: {
    host: config.MYSQL_HOST,
    port: Number.parseInt(config.MYSQL_PORT, 10),
    user: config.MYSQL_USER,
    database: config.MYSQL_DB,
    ...(config.MYSQL_PASSWORD ? { password: config.MYSQL_PASSWORD } : {}),
  },
});

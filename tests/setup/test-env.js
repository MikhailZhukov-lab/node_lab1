/* eslint-disable no-restricted-properties */
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { afterEach, vi } from 'vitest';

function loadTestEnv() {
  const envFile = readFileSync(
    new URL('../../.env.test', import.meta.url),
    'utf8'
  );
  return parseEnv(envFile);
}

const testEnv = loadTestEnv();

for (const [key, value] of Object.entries(testEnv)) {
  process.env[key] = value;
}

process.env.NODE_ENV = 'test';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

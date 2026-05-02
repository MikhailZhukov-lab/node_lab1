import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { env as runtimeEnv } from 'node:process';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseEnv } from 'node:util';
import mysql from 'mysql2/promise';

const projectRoot = fileURLToPath(new URL('../..', import.meta.url));
const schemaPath = join(projectRoot, 'db', 'schema.sql');
const envFilePath = join(projectRoot, '.env');
const migrationName = 'inventory_schema';

function getSchemaHash(schemaContent) {
  return createHash('md5').update(schemaContent).digest('hex');
}

async function loadEnvConfig() {
  try {
    const envFile = await readFile(envFilePath, 'utf8');
    return {
      ...parseEnv(envFile),
      ...runtimeEnv,
    };
  } catch {
    return { ...runtimeEnv };
  }
}

async function createStandalonePool() {
  const config = await loadEnvConfig();

  return mysql.createPool({
    host: config.MYSQL_HOST,
    port: Number.parseInt(config.MYSQL_PORT, 10),
    user: config.MYSQL_USER,
    password: config.MYSQL_PASSWORD,
    database: config.MYSQL_DB,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true,
    decimalNumbers: true,
  });
}

async function getStoredSchemaHash(db) {
  const [rows] = await db.execute(
    'SELECT schema_hash FROM migrations WHERE name = ? LIMIT 1',
    [migrationName]
  );

  return rows[0]?.schema_hash ?? null;
}

async function saveSchemaHash(db, hash) {
  await db.execute(
    `INSERT INTO migrations (name, schema_hash)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE
       schema_hash = VALUES(schema_hash),
       updated_at = CURRENT_TIMESTAMP`,
    [migrationName, hash]
  );
}

function logInfo(logger, message) {
  if (typeof logger?.info === 'function') {
    logger.info(message);
    return;
  }

  console.info(message);
}

function logWarn(logger, message) {
  if (typeof logger?.warn === 'function') {
    logger.warn(message);
    return;
  }

  console.warn(message);
}

async function runMigration({ db, logger = console, force = false } = {}) {
  const schemaContent = await readFile(schemaPath, 'utf8');
  const schemaHash = getSchemaHash(schemaContent);
  const pool = db ?? (await createStandalonePool());

  try {
    await pool.query(schemaContent);

    const storedHash = await getStoredSchemaHash(pool);

    if (!storedHash) {
      await saveSchemaHash(pool, schemaHash);
      logInfo(logger, 'MySQL schema initialized.');
      return {
        changed: false,
        initialized: true,
        schemaHash,
      };
    }

    if (storedHash !== schemaHash) {
      logWarn(
        logger,
        'Schema hash changed. Review db/schema.sql and sync the database.'
      );

      if (force) {
        await saveSchemaHash(pool, schemaHash);
        logInfo(logger, 'Schema hash in migrations table has been updated.');
      }

      return {
        changed: true,
        initialized: false,
        schemaHash,
      };
    }

    return {
      changed: false,
      initialized: false,
      schemaHash,
    };
  } finally {
    if (!db) {
      await pool.end();
    }
  }
}

async function checkSchemaVersion({ db, logger = console } = {}) {
  const result = await runMigration({ db, logger, force: false });
  return result.changed;
}

const isDirectRun =
  typeof process.argv[1] === 'string' &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  runMigration({ force: true }).catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export { checkSchemaVersion, runMigration };

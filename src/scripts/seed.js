import mysql from 'mysql2/promise';
import { runMigration } from '../migrations/migrate.js';
import { createInventoryRepository } from '../../repositories/inventory.repository.js';
import itemModel from '../models/item.model.js';
import { env as runtimeEnv } from 'node:process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

const initialItems = [
  { name: 'Laptop', quantity: 5, price: 1200, category: 'electronics' },
  { name: 'Mouse', quantity: 15, price: 25, category: 'accessories' },
];

function buildItemRecord(values = {}) {
  const itemRecord = {};
  const itemModelEntries = Object.entries(itemModel);

  for (const [key, defaultValue] of itemModelEntries) {
    itemRecord[key] =
      Object.hasOwn(values, key) && values[key] !== undefined
        ? values[key]
        : defaultValue;
  }

  return itemRecord;
}

const projectRoot = fileURLToPath(new URL('../..', import.meta.url));
const envFilePath = join(projectRoot, '.env');

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

async function createPool() {
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

async function seed({ force = false } = {}) {
  console.log('Starting database seeding...');

  const pool = await createPool();

  try {
    await runMigration({ db: pool, logger: console, force });

    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM inventory_items'
    );
    const total = rows[0]?.total ?? 0;

    if (total > 0 && !force) {
      console.log('Database is not empty. Seed skipped.');
      return;
    }

    if (force) {
      await pool.query('TRUNCATE TABLE inventory_items');
      console.log('Existing inventory data cleared.');
    }

    const inventoryRepository = createInventoryRepository(pool);

    for (const item of initialItems) {
      const itemRecord = buildItemRecord(item);
      const createdItem = await inventoryRepository.create(itemRecord);
      console.log(`Created item: ${createdItem.name} (id: ${createdItem.id})`);
    }

    console.log(`Seeding complete. ${initialItems.length} items created.`);
  } finally {
    await pool.end();
  }
}

const force = process.argv.includes('--force');

seed({ force }).catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});

/* eslint-disable no-restricted-properties */
import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { buildApp, readEnvFile } from '../../app.js';
import inventoryService from '../../services/inventory.service.js';

const uploadsRootPath = fileURLToPath(
  new URL('../../uploads', import.meta.url)
);
const inventoryTableSql = `
  CREATE TABLE IF NOT EXISTS inventory_items (
    id int AUTO_INCREMENT NOT NULL,
    name varchar(255) NOT NULL DEFAULT '',
    quantity int NOT NULL DEFAULT 0,
    price decimal(10,2) NOT NULL DEFAULT '0.00',
    category varchar(100) NOT NULL DEFAULT '',
    image varchar(255) DEFAULT NULL,
    discount int NOT NULL DEFAULT 0,
    CONSTRAINT inventory_items_id PRIMARY KEY (id)
  )
`;
const usersTableSql = `
  CREATE TABLE IF NOT EXISTS users (
    id int AUTO_INCREMENT NOT NULL,
    email varchar(255) NOT NULL,
    password varchar(255) NOT NULL,
    CONSTRAINT users_id PRIMARY KEY (id),
    CONSTRAINT users_email_unique UNIQUE (email)
  )
`;
let testAppCounter = 0;

function getTestEnvData(overrides = {}) {
  return {
    ...readEnvFile(new URL('../../.env.test', import.meta.url)),
    ...process.env,
    NODE_ENV: 'test',
    ...overrides,
  };
}

async function cleanupTestUploads() {
  let uploadDirectories = [];

  try {
    uploadDirectories = await readdir(uploadsRootPath, { withFileTypes: true });
  } catch {
    return;
  }

  await Promise.all(
    uploadDirectories
      .filter(
        (entry) =>
          entry.isDirectory() && Number.parseInt(entry.name, 10) >= 50000
      )
      .map((entry) =>
        rm(join(uploadsRootPath, entry.name), {
          recursive: true,
          force: true,
        })
      )
  );
}

async function createIsolatedDatabase(envData, databaseName) {
  const connection = await mysql.createConnection({
    host: envData.MYSQL_HOST,
    port: Number.parseInt(envData.MYSQL_PORT, 10),
    user: envData.MYSQL_USER,
    password: envData.MYSQL_PASSWORD,
    multipleStatements: true,
  });

  try {
    await connection.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
    await connection.query(`CREATE DATABASE \`${databaseName}\``);
    await connection.query(`USE \`${databaseName}\``);
    await connection.query(inventoryTableSql);
    await connection.query(usersTableSql);
  } finally {
    await connection.end();
  }
}

async function dropIsolatedDatabase(envData, databaseName) {
  const connection = await mysql.createConnection({
    host: envData.MYSQL_HOST,
    port: Number.parseInt(envData.MYSQL_PORT, 10),
    user: envData.MYSQL_USER,
    password: envData.MYSQL_PASSWORD,
  });

  try {
    await connection.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
  } finally {
    await connection.end();
  }
}

async function createTestApp(overrides = {}) {
  testAppCounter += 1;
  const isolatedDatabaseName = `lab_10_inventory_test_${testAppCounter}`;
  const isolatedRedisDb = 1 + (testAppCounter % 14);
  const envData = getTestEnvData({
    MYSQL_DB: isolatedDatabaseName,
    REDIS_DB: String(isolatedRedisDb),
    ...overrides.envData,
  });

  await createIsolatedDatabase(envData, isolatedDatabaseName);

  const app = buildApp({
    envData,
    loggerOptions: false,
  });

  if (typeof overrides.configureApp === 'function') {
    await overrides.configureApp(app);
  }

  await app.ready();
  await inventoryService.initializeInventoryStorage();
  app.testDatabaseName = isolatedDatabaseName;
  app.testRedisDb = isolatedRedisDb;

  return app;
}

async function resetTestState(app) {
  await app.redis.flushdb();
  await app.mysql.query('SET FOREIGN_KEY_CHECKS = 0');
  await app.mysql.query('TRUNCATE TABLE inventory_items');
  await app.mysql.query('TRUNCATE TABLE users');
  await app.mysql.query('ALTER TABLE inventory_items AUTO_INCREMENT = 50000');
  await app.mysql.query('ALTER TABLE users AUTO_INCREMENT = 50000');
  await app.mysql.query('SET FOREIGN_KEY_CHECKS = 1');
  await cleanupTestUploads();
}

async function closeTestApp(app) {
  if (!app) {
    return;
  }

  await cleanupTestUploads();
  await app.redis.flushdb();
  const envData = getTestEnvData({
    MYSQL_DB: app.testDatabaseName,
    REDIS_DB: String(app.testRedisDb),
  });
  await app.close();
  await dropIsolatedDatabase(envData, app.testDatabaseName);
}

export { closeTestApp, createTestApp, getTestEnvData, resetTestState };

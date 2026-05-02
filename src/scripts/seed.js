import { readFileSync } from 'node:fs';
import { env as runtimeEnv } from 'node:process';
import { parseEnv } from 'node:util';
import mongoose from 'mongoose';
import InventoryItemModel from '#db/models/inventory-item.model';
import itemModel from '#models/item.model';

const initialItems = [
  { name: 'Laptop', quantity: 5, price: 1200, category: 'electronics' },
  { name: 'Mouse', quantity: 15, price: 25, category: 'accessories' },
];

function buildItemRecord(values = {}) {
  const itemRecord = {};
  const itemModelEntries = Object.entries(itemModel).filter(
    ([key]) => key !== 'id'
  );

  for (const [key, defaultValue] of itemModelEntries) {
    itemRecord[key] =
      Object.hasOwn(values, key) && values[key] !== undefined
        ? values[key]
        : defaultValue;
  }

  return itemRecord;
}

async function connectToMongo() {
  const envFile = readFileSync(new URL('../../.env', import.meta.url), 'utf8');
  const parsedEnv = parseEnv(envFile);
  const mongoUrl = runtimeEnv.MONGO_URL ?? parsedEnv.MONGO_URL;
  const mongoDbName = runtimeEnv.MONGO_DB_NAME ?? parsedEnv.MONGO_DB_NAME;

  await mongoose.connect(mongoUrl, {
    dbName: mongoDbName,
  });
}

async function seed({ force = false } = {}) {
  console.log('Starting MongoDB seeding...');

  await connectToMongo();

  if (force) {
    await InventoryItemModel.deleteMany({});
    console.log('Existing MongoDB documents have been cleared.');
  } else {
    const existingDocumentsCount = await InventoryItemModel.countDocuments();

    if (existingDocumentsCount > 0) {
      console.log('Database is not empty. Seed skipped.');
      await mongoose.connection.close();
      return;
    }
  }

  const documents = initialItems.map((item, index) => ({
    _id: index + 1,
    ...buildItemRecord(item),
  }));

  await InventoryItemModel.insertMany(documents, { ordered: true });

  console.log(`Seeding complete. ${documents.length} items created.`);
  await mongoose.connection.close();
}

seed({ force: process.argv.includes('--force') }).catch(async (error) => {
  console.error('MongoDB seeding failed:', error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});

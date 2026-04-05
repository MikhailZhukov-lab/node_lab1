import { rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import itemModel from '../../src/models/item.model.js';
import { writeJsonFileAtomically } from '../../utils/item-files.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');
const itemsDirectory = join(projectRoot, 'data', 'items');

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

async function seed() {
  console.log('Starting database seeding...');

  try {
    await rm(itemsDirectory, { recursive: true, force: true });
    console.log('Cleared existing data files.');
  } catch {
    console.log('No existing data to clear.');
  }

  for (let i = 0; i < initialItems.length; i++) {
    const item = initialItems[i];
    const itemRecord = buildItemRecord({ ...item, id: i + 1 });
    await writeJsonFileAtomically(itemRecord.id, itemRecord);
    console.log(`Created item: ${item.name} (id: ${itemRecord.id})`);
  }

  console.log(`Seeding complete. ${initialItems.length} items created.`);
}

seed();

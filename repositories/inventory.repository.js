import { rm } from 'node:fs/promises';
import itemModel from '#models/item.model';
import {
  ensureItemsDirectory,
  getItemFilePath,
  listItemFileNames,
  readJsonFile,
  writeJsonFileAtomically,
} from '#utils/item-files';

const itemModelEntries = Object.entries(itemModel);

function buildItemRecord(values = {}) {
  const itemRecord = {};

  for (const [key, defaultValue] of itemModelEntries) {
    itemRecord[key] =
      Object.hasOwn(values, key) && values[key] !== undefined
        ? values[key]
        : defaultValue;
  }

  return itemRecord;
}

function needsMigration(storedItem) {
  return itemModelEntries.some(([key]) => !Object.hasOwn(storedItem, key));
}

async function findById(id) {
  try {
    const storedItem = await readJsonFile(getItemFilePath(id));
    const normalizedItem = buildItemRecord({ ...storedItem, id });

    if (needsMigration(storedItem) || storedItem.id !== id) {
      await writeJsonFileAtomically(id, normalizedItem);
    }

    return normalizedItem;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

async function findAll() {
  const fileNames = await listItemFileNames();
  const items = await Promise.all(
    fileNames.map((fileName) => {
      const itemId = Number.parseInt(fileName, 10);
      return findById(itemId);
    })
  );

  return items.filter(Boolean).sort((left, right) => left.id - right.id);
}

async function getNextId() {
  const fileNames = await listItemFileNames();
  const itemIds = fileNames.map((fileName) => Number.parseInt(fileName, 10));

  if (itemIds.length === 0) {
    return 1;
  }

  return Math.max(...itemIds) + 1;
}

async function create(payload) {
  const id = await getNextId();
  const newItem = buildItemRecord({ ...payload, id });

  await writeJsonFileAtomically(id, newItem);

  return newItem;
}

async function update(id, payload) {
  const currentItem = await findById(id);

  if (!currentItem) {
    return null;
  }

  const updatedItem = buildItemRecord({ ...currentItem, ...payload, id });

  await writeJsonFileAtomically(id, updatedItem);

  return updatedItem;
}

async function remove(id) {
  const currentItem = await findById(id);

  if (!currentItem) {
    return null;
  }

  await rm(getItemFilePath(id));

  return currentItem;
}

async function initialize() {
  await ensureItemsDirectory();
}

export default {
  create,
  findAll,
  findById,
  initialize,
  remove,
  update,
};

import { asc, eq } from 'drizzle-orm';
import { inventoryItems } from '#db/schema';
import itemModel from '#models/item.model';

const itemModelEntries = Object.entries(itemModel);
const updatableColumns = itemModelEntries
  .map(([key]) => key)
  .filter((key) => key !== 'id');

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

function buildInsertPayload(payload = {}) {
  const normalizedItem = buildItemRecord(payload);
  return Object.fromEntries(
    updatableColumns.map((key) => [key, normalizedItem[key]])
  );
}

function createInventoryRepository(db) {
  const create = async (payload) => {
    const result = await db
      .insert(inventoryItems)
      .values(buildInsertPayload(payload))
      .$returningId();

    return findById(result[0]?.id ?? null);
  };

  const findById = async (id) => {
    const rows = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id))
      .limit(1);

    return rows[0] ? buildItemRecord(rows[0]) : null;
  };

  const findAll = async () => {
    const rows = await db
      .select()
      .from(inventoryItems)
      .orderBy(asc(inventoryItems.id));

    return rows.map((row) => buildItemRecord(row));
  };

  const update = async (id, payload) => {
    const currentItem = await findById(id);

    if (!currentItem) {
      return null;
    }

    const updatedItem = buildItemRecord({ ...currentItem, ...payload, id });

    await db
      .update(inventoryItems)
      .set(buildInsertPayload(updatedItem))
      .where(eq(inventoryItems.id, id));

    return findById(id);
  };

  const remove = async (id) => {
    const currentItem = await findById(id);

    if (!currentItem) {
      return null;
    }

    await db.delete(inventoryItems).where(eq(inventoryItems.id, id));

    return currentItem;
  };

  const initialize = async () => {};

  return {
    create,
    findAll,
    findById,
    initialize,
    remove,
    update,
  };
}

export { createInventoryRepository };

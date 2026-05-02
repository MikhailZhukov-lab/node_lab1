import itemModel from '#models/item.model';

const itemModelEntries = Object.entries(itemModel);
const itemColumns = itemModelEntries.map(([key]) => key);
const updatableColumns = itemColumns.filter((key) => key !== 'id');
const selectColumnsSql = itemColumns.join(', ');

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

function buildInsertValues(payload = {}) {
  const normalizedItem = buildItemRecord(payload);
  return updatableColumns.map((key) => normalizedItem[key]);
}

function createInventoryRepository(db) {
  const create = async (payload) => {
    const placeholders = updatableColumns.map(() => '?').join(', ');

    const [result] = await db.execute(
      `INSERT INTO inventory_items (${updatableColumns.join(', ')})
       VALUES (${placeholders})`,
      buildInsertValues(payload)
    );

    return findById(result.insertId);
  };

  const findById = async (id) => {
    const [rows] = await db.execute(
      `SELECT ${selectColumnsSql}
       FROM inventory_items
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    return rows[0] ? buildItemRecord(rows[0]) : null;
  };

  const findAll = async () => {
    const [rows] = await db.query(
      `SELECT ${selectColumnsSql}
       FROM inventory_items
       ORDER BY id ASC`
    );

    return rows.map((row) => buildItemRecord(row));
  };

  const update = async (id, payload) => {
    const currentItem = await findById(id);

    if (!currentItem) {
      return null;
    }

    const updatedItem = buildItemRecord({ ...currentItem, ...payload, id });
    const assignments = updatableColumns.map((column) => `${column} = ?`);

    await db.execute(
      `UPDATE inventory_items
       SET ${assignments.join(', ')}
       WHERE id = ?`,
      [...updatableColumns.map((key) => updatedItem[key]), id]
    );

    return findById(id);
  };

  const remove = async (id) => {
    const currentItem = await findById(id);

    if (!currentItem) {
      return null;
    }

    await db.execute('DELETE FROM inventory_items WHERE id = ?', [id]);

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

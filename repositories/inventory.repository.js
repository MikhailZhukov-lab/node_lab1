import { Readable } from 'node:stream';
import InventoryItemModel from '#db/models/inventory-item.model';
import itemModel from '#models/item.model';

const itemModelEntries = Object.entries(itemModel).filter(([key]) => key !== 'id');

function buildInventoryItemRecord(values = {}) {
  const itemRecord = {};

  for (const [key, defaultValue] of itemModelEntries) {
    itemRecord[key] =
      Object.hasOwn(values, key) && values[key] !== undefined
        ? values[key]
        : defaultValue;
  }

  return itemRecord;
}

function normalizeDocument(document) {
  if (!document) {
    return null;
  }

  const { _id, ...rest } = document;

  return {
    id: _id,
    ...buildInventoryItemRecord(rest),
  };
}

function buildInventoryRepository(db) {
  const InventoryItem = db.models.InventoryItem || InventoryItemModel;

  async function findById(id) {
    const document = await InventoryItem.findById(id).lean();
    return normalizeDocument(document);
  }

  async function findAll() {
    const documents = await InventoryItem.find().sort({ _id: 1 }).lean();
    return documents.map(normalizeDocument);
  }

  async function* iterateAll() {
    const cursor = InventoryItem.find().sort({ _id: 1 }).lean().cursor();

    for await (const document of cursor) {
      yield normalizeDocument(document);
    }
  }

  function createReadStream() {
    return Readable.from(iterateAll(), { objectMode: true });
  }

  async function getNextId() {
    const lastItem = await InventoryItem.findOne().sort({ _id: -1 }).lean();

    if (!lastItem) {
      return 1;
    }

    return lastItem._id + 1;
  }

  async function create(payload) {
    const id = await getNextId();
    const document = await InventoryItem.create({
      _id: id,
      ...buildInventoryItemRecord(payload),
    });

    return normalizeDocument(document.toObject());
  }

  async function update(id, payload) {
    const currentItem = await findById(id);

    if (!currentItem) {
      return null;
    }

    const updatedDocument = await InventoryItem.findOneAndUpdate(
      { _id: id },
      {
        $set: buildInventoryItemRecord({
          ...currentItem,
          ...payload,
        }),
      },
      {
        new: true,
        lean: true,
      }
    );

    return normalizeDocument(updatedDocument);
  }

  async function remove(id) {
    const removedDocument = await InventoryItem.findOneAndDelete({
      _id: id,
    }).lean();

    return normalizeDocument(removedDocument);
  }

  async function initialize() {
    await InventoryItem.createCollection().catch((error) => {
      if (error?.codeName !== 'NamespaceExists') {
        throw error;
      }
    });
  }

  return {
    createReadStream,
    create,
    findAll,
    findById,
    initialize,
    iterateAll,
    remove,
    update,
  };
}

export { buildInventoryRepository };

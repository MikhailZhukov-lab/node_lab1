import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ERROR_MESSAGES } from '#constants/error-messages';
import { inventoryItemImportSchema } from '#schemas/inventory.schema';
import inventoryService from '#services/inventory.service';
import {
  buildImageUrl,
  buildItemWithImageUrl,
  buildItemsWithImageUrl,
} from '#utils/item-images';
import {
  ensureItemUploadDirectory,
  getItemImagePath,
  getItemUploadDirectoryPath,
} from '#utils/item-files';

const ajvValidator = new (await import('ajv')).default();
const validateItemForImport = ajvValidator.compile(inventoryItemImportSchema);
const maxImageFileSize = 5 * 1024 * 1024;

function normalizeImportedItem(record) {
  const quantity =
    record.quantity === undefined ||
    record.quantity === null ||
    record.quantity === ''
      ? undefined
      : Number.parseInt(record.quantity, 10);
  const price =
    record.price === undefined || record.price === null || record.price === ''
      ? undefined
      : Number.parseFloat(record.price);
  const id =
    record.id === undefined || record.id === null || record.id === ''
      ? undefined
      : Number.parseInt(record.id, 10);

  return {
    id,
    name: record.name,
    quantity,
    price,
    category: record.category,
    image:
      record.image === undefined || record.image === null || record.image === ''
        ? undefined
        : record.image,
  };
}

const getList = async (request, reply) => {
  const items = await inventoryService.getList(request.query);
  return reply.send(buildItemsWithImageUrl(request, items));
};

const getPaginatedList = async (request, reply) => {
  const result = await inventoryService.getPaginatedList(request.query);

  return reply.send({
    data: buildItemsWithImageUrl(request, result.data),
    limit: result.limit,
    page: result.page,
    total: result.total,
    totalPages: result.totalPages,
  });
};

const addItem = async (request, reply) => {
  const newItem = await inventoryService.addItem(request.body);
  return reply.status(201).send(buildItemWithImageUrl(request, newItem));
};

const updateItem = async (request, reply) => {
  const itemId = Number.parseInt(request.params.id, 10);
  const updatedItem = await inventoryService.updateItem(itemId, request.body);

  if (!updatedItem) {
    return reply.notFound(ERROR_MESSAGES.INVENTORY_ITEM_NOT_FOUND);
  }

  return reply.status(200).send(buildItemWithImageUrl(request, updatedItem));
};

const removeItem = async (request, reply) => {
  const itemId = Number.parseInt(request.params.id, 10);
  const deletedItem = await inventoryService.removeItem(itemId);

  if (!deletedItem) {
    return reply.notFound(ERROR_MESSAGES.INVENTORY_ITEM_NOT_FOUND);
  }

  return reply.status(200).send({
    message: 'Item deleted successfully',
    item: buildItemWithImageUrl(request, deletedItem),
  });
};

const exportItems = async (request, reply) => {
  const items = await inventoryService.getList();

  const itemsWithFullImageUrl = items.map((item) => ({
    ...item,
    image: buildImageUrl(request, item.image) ?? '',
  }));

  const csvColumns = ['id', 'name', 'quantity', 'price', 'category', 'image'];

  return reply
    .header('Content-Type', 'text/csv')
    .header('Content-Disposition', 'attachment; filename="items.csv"')
    .send(
      stringify(itemsWithFullImageUrl, {
        header: true,
        columns: csvColumns,
      })
    );
};

const uploadImage = async (request, reply) => {
  const itemId = Number.parseInt(request.params.id, 10);
  const item = await inventoryService.getById(itemId);

  if (!item) {
    return reply.notFound(ERROR_MESSAGES.INVENTORY_ITEM_NOT_FOUND);
  }

  let data;

  try {
    data = await request.file({
      limits: {
        fileSize: maxImageFileSize,
      },
    });
  } catch (error) {
    if (error?.code === 'FST_REQ_FILE_TOO_LARGE') {
      return reply.badRequest('File too large. Maximum size is 5MB');
    }

    throw error;
  }

  if (!data) {
    return reply.badRequest('No file uploaded');
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png'];
  if (!allowedMimeTypes.includes(data.mimetype)) {
    return reply.badRequest('Invalid file type. Only JPEG and PNG are allowed');
  }

  const fileBuffer = await data.toBuffer();
  if (data.file.truncated || fileBuffer.length > maxImageFileSize) {
    return reply.badRequest('File too large. Maximum size is 5MB');
  }

  await rm(getItemUploadDirectoryPath(itemId), {
    recursive: true,
    force: true,
  });
  await ensureItemUploadDirectory(itemId);

  const imagePath = getItemImagePath(itemId, data.mimetype);
  const projectRoot = fileURLToPath(new URL('..', import.meta.url));
  const fullPath = join(projectRoot, 'uploads', imagePath.slice(1));

  await writeFile(fullPath, fileBuffer);

  await inventoryService.updateItem(itemId, { image: imagePath });

  const updatedItem = await inventoryService.getById(itemId);

  return reply.status(200).send(buildItemWithImageUrl(request, updatedItem));
};

const importItems = async (request, reply) => {
  const data = await request.file();
  if (!data) {
    return reply.badRequest('No file uploaded');
  }

  const fileName = data.filename.toLowerCase();
  const fileBuffer = await data.toBuffer();

  let records = [];

  if (fileName.endsWith('.json')) {
    try {
      records = JSON.parse(fileBuffer.toString('utf8'));
      if (!Array.isArray(records)) {
        records = [records];
      }
    } catch {
      return reply.badRequest('Invalid JSON file');
    }
  } else if (fileName.endsWith('.csv')) {
    records = await new Promise((resolve, reject) => {
      parse(
        fileBuffer.toString('utf8'),
        {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        },
        (err, records) => {
          if (err) reject(err);
          else resolve(records);
        }
      );
    });
  } else {
    return reply.badRequest('Unsupported file format. Use CSV or JSON');
  }

  const imported = [];
  const rejected = [];
  const lineOffset = fileName.endsWith('.csv') ? 2 : 1;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const itemData = normalizeImportedItem(record);

    if (!validateItemForImport(itemData)) {
      rejected.push({
        line: i + lineOffset,
        reason:
          validateItemForImport.errors
            ?.map((e) => `${e.instancePath} ${e.message}`)
            .join('; ') || 'Validation failed',
      });
      continue;
    }

    try {
      const existingItem = Number.isInteger(itemData.id)
        ? await inventoryService.getById(itemData.id)
        : null;
      let result;
      if (existingItem) {
        result = await inventoryService.updateItem(itemData.id, itemData);
      } else {
        result = await inventoryService.addItem(itemData);
      }
      imported.push(result);
    } catch (err) {
      rejected.push({
        line: i + lineOffset,
        reason: err.message,
      });
    }
  }

  return reply.status(200).send({
    imported: imported.length,
    rejected: rejected.length,
    rejectedRecords: rejected,
  });
};

export default {
  getList,
  getPaginatedList,
  addItem,
  updateItem,
  removeItem,
  exportItems,
  importItems,
  uploadImage,
};

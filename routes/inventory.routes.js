import inventoryController from '#controllers/inventory.controller';
import {
  createInventorySchema,
  deleteInventorySchema,
  exportInventorySchema,
  getInventoryDetailsSchema,
  getInventoryListSchema,
  importInventorySchema,
  uploadInventoryImageSchema,
  updateInventorySchema,
} from '#schemas/inventory.schema';
import { requireSession } from '#utils/auth';

async function inventoryRoutes(fastify) {
  fastify.get(
    '/inventory',
    { schema: getInventoryListSchema },
    inventoryController.getList
  );
  fastify.get(
    '/inventory/export',
    { schema: exportInventorySchema },
    inventoryController.exportItems
  );
  fastify.post(
    '/inventory/import',
    { onRequest: requireSession, schema: importInventorySchema },
    inventoryController.importItems
  );
  fastify.post(
    '/inventory',
    { onRequest: requireSession, schema: createInventorySchema },
    inventoryController.addItem
  );
  fastify.get(
    '/inventory/:id/details',
    { schema: getInventoryDetailsSchema },
    inventoryController.getItemDetails
  );
  fastify.get(
    '/items/:id/details',
    {
      schema: {
        ...getInventoryDetailsSchema,
        hide: true,
      },
    },
    inventoryController.getItemDetails
  );
  fastify.patch(
    '/inventory/:id',
    { onRequest: requireSession, schema: updateInventorySchema },
    inventoryController.updateItem
  );
  fastify.delete(
    '/inventory/:id',
    { onRequest: requireSession, schema: deleteInventorySchema },
    inventoryController.removeItem
  );
  fastify.post(
    '/inventory/:id/image',
    {
      onRequest: requireSession,
      schema: uploadInventoryImageSchema,
    },
    inventoryController.uploadImage
  );
}

export default inventoryRoutes;

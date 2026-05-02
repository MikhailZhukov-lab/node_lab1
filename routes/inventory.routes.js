import inventoryController from '#controllers/inventory.controller';
import {
  createInventorySchema,
  deleteInventorySchema,
  exportInventorySchema,
  getInventoryDetailsSchema,
  getInventoryListSchema,
  getInventoryStreamSchema,
  importInventorySchema,
  uploadInventoryImageSchema,
  updateInventorySchema,
} from '#schemas/inventory.schema';

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
  fastify.get(
    '/items/export',
    {
      schema: {
        ...exportInventorySchema,
        hide: true,
      },
    },
    inventoryController.exportItems
  );
  fastify.get(
    '/inventory/stream',
    { schema: getInventoryStreamSchema },
    inventoryController.streamItems
  );
  fastify.get(
    '/items/stream',
    {
      schema: {
        ...getInventoryStreamSchema,
        hide: true,
      },
    },
    inventoryController.streamItems
  );
  fastify.post(
    '/inventory/import',
    { schema: importInventorySchema },
    inventoryController.importItems
  );
  fastify.post(
    '/inventory',
    { schema: createInventorySchema },
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
    { schema: updateInventorySchema },
    inventoryController.updateItem
  );
  fastify.delete(
    '/inventory/:id',
    { schema: deleteInventorySchema },
    inventoryController.removeItem
  );
  fastify.post(
    '/inventory/:id/image',
    {
      schema: uploadInventoryImageSchema,
    },
    inventoryController.uploadImage
  );
}

export default inventoryRoutes;

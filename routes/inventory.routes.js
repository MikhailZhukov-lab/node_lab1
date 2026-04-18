import inventoryController from '#controllers/inventory.controller';
import {
  createInventorySchema,
  deleteInventorySchema,
  exportInventorySchema,
  getInventoryListSchema,
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

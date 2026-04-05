import inventoryController from '#controllers/inventory.controller';
import {
  createInventorySchema,
  deleteInventorySchema,
  getInventoryListSchema,
  inventoryParamsSchema,
  updateInventorySchema,
} from '#schemas/inventory.schema';

async function inventoryRoutes(fastify) {
  fastify.get(
    '/inventory',
    { schema: getInventoryListSchema },
    inventoryController.getList
  );
  fastify.get(
    '/items',
    { schema: getInventoryListSchema },
    inventoryController.getList
  );
  fastify.get('/items/export', inventoryController.exportItems);
  fastify.post('/items/import', inventoryController.importItems);
  fastify.post(
    '/inventory',
    { schema: createInventorySchema },
    inventoryController.addItem
  );
  fastify.post(
    '/items',
    { schema: createInventorySchema },
    inventoryController.addItem
  );
  fastify.patch(
    '/inventory/:id',
    { schema: updateInventorySchema },
    inventoryController.updateItem
  );
  fastify.patch(
    '/items/:id',
    { schema: updateInventorySchema },
    inventoryController.updateItem
  );
  fastify.delete(
    '/inventory/:id',
    { schema: deleteInventorySchema },
    inventoryController.removeItem
  );
  fastify.delete(
    '/items/:id',
    { schema: deleteInventorySchema },
    inventoryController.removeItem
  );
  fastify.post(
    '/items/:id/image',
    {
      schema: {
        params: inventoryParamsSchema,
      },
    },
    inventoryController.uploadImage
  );
}

export default inventoryRoutes;

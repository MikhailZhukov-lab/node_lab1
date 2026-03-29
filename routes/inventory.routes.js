import inventoryController from '#controllers/inventory.controller';
import {
  createInventorySchema,
  deleteInventorySchema,
  getInventoryListSchema,
  updateInventorySchema,
} from '#schemas/inventory.schema';

async function inventoryRoutes(fastify) {
  fastify.get(
    '/inventory',
    { schema: getInventoryListSchema },
    inventoryController.getList
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
}

export default inventoryRoutes;

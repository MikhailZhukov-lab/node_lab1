import inventoryController from '#controllers/inventory.controller';
import { getInventoryPaginatedListSchema } from '#schemas/inventory.schema';

async function inventoryV2Routes(fastify) {
  fastify.get(
    '/inventory',
    { schema: getInventoryPaginatedListSchema },
    inventoryController.getPaginatedList
  );
}

export default inventoryV2Routes;

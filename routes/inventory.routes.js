import inventoryController from '#controllers/inventory.controller';

async function inventoryRoutes(fastify) {
  fastify.get('/inventory', inventoryController.getList);
  fastify.post('/inventory', inventoryController.addItem);
}

export default inventoryRoutes;

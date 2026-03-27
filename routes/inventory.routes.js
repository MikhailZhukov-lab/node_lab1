import inventoryController from '#controllers/inventory.controller';

async function inventoryRoutes(fastify) {
  fastify.get('/inventory', inventoryController.getList);
  fastify.post('/inventory', inventoryController.addItem);
  fastify.patch('/inventory/:id', inventoryController.updateItem);
  fastify.delete('/inventory/:id', inventoryController.removeItem);
}

export default inventoryRoutes;
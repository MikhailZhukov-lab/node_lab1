const inventoryController = require('#controllers/inventory.controller');

async function inventoryRoutes(fastify, options) {
  // Коли приходить GET запит на /inventory -> викликаємо getItems
  fastify.get('/inventory', inventoryController.getItems);

  // Коли приходить POST запит на /inventory -> викликаємо addItem
  fastify.post('/inventory', inventoryController.addItem);
}

module.exports = inventoryRoutes;

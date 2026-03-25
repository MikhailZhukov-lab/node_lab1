const fastify = require('fastify')({ logger: true });
const inventoryRoutes = require('#routes/inventory.routes');

// Підключаємо наші маршрути
fastify.register(inventoryRoutes);

// Простий роут для перевірки, чи живий сервер
fastify.get('/health', async () => {
  return { status: 'OK', message: 'Сервер працює!' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log('Сервер запущено на http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

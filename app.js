import Fastify from 'fastify';
import inventoryRoutes from '#routes/inventory.routes';

const fastify = Fastify({ logger: true });

fastify.register(inventoryRoutes);

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log('Сервер запущено на ESM: http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();

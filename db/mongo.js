import fp from 'fastify-plugin';
import mongoose from 'mongoose';

async function mongoPlugin(fastify) {
  try {
    await mongoose.connect(fastify.config.MONGO_URL, {
      dbName: fastify.config.MONGO_DB_NAME,
    });
  } catch (error) {
    fastify.log.error({ err: error }, 'Failed to connect to MongoDB');
    process.exit(1);
  }

  fastify.decorate('db', mongoose.connection);

  fastify.addHook('onClose', async () => {
    await mongoose.connection.close();
  });
}

export default fp(mongoPlugin, {
  name: 'mongo',
});

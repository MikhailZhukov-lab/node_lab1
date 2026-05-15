import fastifyRedis from '@fastify/redis';
import fp from 'fastify-plugin';

async function redisPlugin(fastify) {
  await fastify.register(fastifyRedis, {
    host: fastify.config.REDIS_HOST,
    port: fastify.config.REDIS_PORT,
  });
}

export default fp(redisPlugin, {
  name: 'redis-plugin',
});

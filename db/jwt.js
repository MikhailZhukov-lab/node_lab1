import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import fp from 'fastify-plugin';
import { REDIS_KEYS } from '#constants/redis';

async function jwtPlugin(fastify) {
  await fastify.register(fastifyCookie);
  await fastify.register(fastifyJwt, {
    secret: fastify.config.JWT_SECRET,
    trusted: async (_request, decodedToken) => {
      if (!decodedToken?.jti) {
        return decodedToken;
      }

      const isBlacklisted = await fastify.redis.get(
        `${REDIS_KEYS.jwtBlacklistPrefix}${decodedToken.jti}`
      );

      if (isBlacklisted) {
        return false;
      }

      return decodedToken;
    },
  });
}

export default fp(jwtPlugin, {
  name: 'jwt-plugin',
  dependencies: ['redis-plugin'],
});

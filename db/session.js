import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fp from 'fastify-plugin';
import RedisStore from 'fastify-session-redis-store';

async function sessionPlugin(fastify) {
  await fastify.register(fastifyCookie);
  await fastify.register(fastifySession, {
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
      sameSite: 'lax',
      secure: false,
    },
    rolling: true,
    saveUninitialized: false,
    secret: fastify.config.SESSION_SECRET,
    store: new RedisStore({
      client: fastify.redis,
      prefix: 'sess:',
      ttl: 24 * 60 * 60,
    }),
  });
}

export default fp(sessionPlugin, {
  name: 'session-plugin',
  dependencies: ['redis-plugin'],
});

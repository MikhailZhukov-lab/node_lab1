import { drizzle } from 'drizzle-orm/mysql2';
import fp from 'fastify-plugin';
import * as schema from '#db/schema';

async function drizzlePlugin(fastify) {
  const db = drizzle({
    client: fastify.mysql,
    schema,
  });

  fastify.decorate('db', db);
}

export default fp(drizzlePlugin, {
  name: 'drizzle-plugin',
  dependencies: ['mysql-plugin'],
});

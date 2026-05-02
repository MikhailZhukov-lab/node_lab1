import mysql from 'mysql2/promise';
import fp from 'fastify-plugin';

async function mysqlPlugin(fastify) {
  const pool = mysql.createPool({
    host: fastify.config.MYSQL_HOST,
    port: fastify.config.MYSQL_PORT,
    user: fastify.config.MYSQL_USER,
    password: fastify.config.MYSQL_PASSWORD,
    database: fastify.config.MYSQL_DB,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true,
    decimalNumbers: true,
  });

  try {
    await pool.query('SELECT 1');
  } catch (error) {
    fastify.log.error({ err: error }, 'Failed to connect to MySQL');
    await pool.end().catch(() => {});
    process.exit(1);
  }

  fastify.decorate('db', pool);

  fastify.addHook('onClose', async () => {
    await pool.end();
  });
}

export default fp(mysqlPlugin, {
  name: 'mysql-plugin',
});

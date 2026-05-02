import { readFileSync } from 'node:fs';
import { env as runtimeEnv } from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseEnv } from 'node:util';
import fastifyMultipart from '@fastify/multipart';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyCors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import fastifyHelmet from '@fastify/helmet';
import fastifySensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import fastifySwagger from '@fastify/swagger';
import Fastify from 'fastify';
import { ERROR_MESSAGES } from '#constants/error-messages';
import drizzlePlugin from '#db/drizzle';
import mysqlPlugin from './db/mysql.js';
import githubRoutes from '#routes/github.routes';
import githubV2Routes from '#routes/github-v2.routes';
import { createInventoryRepository } from '#repositories/inventory.repository';
import inventoryRoutes from '#routes/inventory.routes';
import inventoryV2Routes from '#routes/inventory-v2.routes';
import envSchema from '#schemas/env.schema';
import {
  healthDetailsSchema,
  healthPublicSchema,
} from '#schemas/health.schema';
import inventoryService, {
  configureInventoryService,
} from '#services/inventory.service';

function resolveNodeEnv() {
  try {
    const envFile = readFileSync(new URL('./.env', import.meta.url), 'utf8');
    const parsedEnv = parseEnv(envFile);

    return runtimeEnv.NODE_ENV ?? parsedEnv.NODE_ENV ?? 'development';
  } catch {
    return runtimeEnv.NODE_ENV ?? 'development';
  }
}

function buildLoggerOptions() {
  const nodeEnv = resolveNodeEnv();

  if (nodeEnv === 'production') {
    return {
      level: 'error',
    };
  }

  if (nodeEnv === 'development') {
    return {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    };
  }

  return {
    level: 'error',
  };
}

function buildCorsOptions(config) {
  if (config.NODE_ENV === 'development') {
    return {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    };
  }

  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, origin === config.CORS_ORIGIN);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  };
}

function logRequestError(request, error, statusCode) {
  const logPayload = {
    err: error,
    statusCode,
    method: request.method,
    url: request.url,
    params: request.params,
    query: request.query,
  };

  if (statusCode >= 500) {
    request.log.error(logPayload, 'Request failed');
    return;
  }

  request.log.warn(logPayload, 'Request failed');
}

function sendErrorResponse(reply, error, statusCode) {
  if (error.validation) {
    return reply.badRequest(error.message);
  }

  if (statusCode === 401) {
    return reply.unauthorized(error.message || ERROR_MESSAGES.UNAUTHORIZED);
  }

  if (statusCode === 404) {
    return reply.notFound(error.message || ERROR_MESSAGES.NOT_FOUND);
  }

  if (statusCode === 429) {
    return reply.status(429).send({
      statusCode: 429,
      error: 'Too Many Requests',
      message: error.message || 'Too Many Requests',
    });
  }

  if (statusCode >= 500) {
    return reply.status(statusCode).send({
      statusCode,
      error: error.name || ERROR_MESSAGES.ERROR,
      message: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }

  return reply.status(statusCode).send({
    statusCode,
    error: error.name || ERROR_MESSAGES.ERROR,
    message: error.message || ERROR_MESSAGES.REQUEST_FAILED,
  });
}

function buildHealthDetails() {
  return {
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  };
}

async function apiRoutes(fastify) {
  await fastify.register(inventoryRoutes);
  await fastify.register(githubRoutes);

  fastify.get(
    '/health',
    {
      schema: {
        ...healthPublicSchema,
        summary: 'Public health check',
        tags: ['Health'],
      },
    },
    async () => ({
      status: 'ok',
    })
  );

  fastify.get(
    '/health/details',
    {
      schema: {
        ...healthDetailsSchema,
        summary: 'Detailed health check',
        tags: ['Health'],
      },
      onRequest: async (request, reply) => {
        const apiKey = request.headers['x-api-key'];

        if (apiKey !== fastify.config.ADMIN_API_KEY) {
          return reply.unauthorized(ERROR_MESSAGES.UNAUTHORIZED);
        }
      },
    },
    async () => buildHealthDetails()
  );
}

async function apiV2Routes(fastify) {
  await fastify.register(inventoryV2Routes);
  await fastify.register(githubV2Routes);
}

function buildApp() {
  const fastify = Fastify({
    logger: buildLoggerOptions(),
  });

  fastify.register(fastifyEnv, {
    confKey: 'config',
    schema: envSchema,
    dotenv: true,
  });
  fastify.register(mysqlPlugin);
  fastify.register(drizzlePlugin);
  fastify.register(async function inventoryDependenciesPlugin(instance) {
    configureInventoryService({
      inventoryRepository: createInventoryRepository(instance.db),
    });
  });

  fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Inventory API',
        description: 'API documentation for the laboratory project',
        version: '1.0.0',
      },
      tags: [
        { name: 'Inventory v1', description: 'Version 1 inventory endpoints' },
        { name: 'Inventory v2', description: 'Version 2 inventory endpoints' },
        {
          name: 'GitHub v1',
          description: 'Version 1 GitHub analytics endpoints',
        },
        {
          name: 'GitHub v2',
          description: 'Version 2 GitHub analytics endpoints',
        },
        { name: 'Health', description: 'Health check endpoints' },
      ],
    },
  });

  fastify.register(fastifyRateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder(_request, context) {
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Retry in ${context.after}.`,
      };
    },
  });

  fastify.register(fastifyMultipart);

  fastify.register(fastifyStatic, {
    root: fileURLToPath(new URL('./uploads/', import.meta.url)),
    serve: false,
  });

  fastify.register(fastifyStatic, {
    root: fileURLToPath(
      new URL('./node_modules/@fastify/swagger-ui/static/', import.meta.url)
    ),
    prefix: '/docs/static/',
    decorateReply: false,
  });

  fastify.get('/:itemId/:fileName', async (request, reply) => {
    const { itemId, fileName } = request.params;

    return reply.sendFile(`${itemId}/${fileName}`);
  });

  fastify.get('/docs', async (_request, reply) => {
    return reply.type('text/html; charset=utf-8').send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Swagger UI</title>
    <link rel="stylesheet" type="text/css" href="/docs/static/swagger-ui.css" />
    <link rel="stylesheet" type="text/css" href="/docs/static/index.css" />
    <link rel="icon" type="image/png" href="/docs/static/favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="/docs/static/favicon-16x16.png" sizes="16x16" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/docs/static/swagger-ui-bundle.js" charset="UTF-8"></script>
    <script src="/docs/static/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
    <script src="/docs/static/swagger-initializer.js" charset="UTF-8"></script>
  </body>
</html>`);
  });

  fastify.get('/docs/json', async () => fastify.swagger());

  fastify.get(
    '/docs/static/swagger-initializer.js',
    async (_request, reply) => {
      return reply.type('application/javascript; charset=utf-8')
        .send(`window.onload = function () {
  window.ui = SwaggerUIBundle({
    url: '/docs/json',
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: 'StandaloneLayout'
  });
};`);
    }
  );

  fastify.register(fastifyCors, (instance) =>
    buildCorsOptions(instance.config)
  );
  fastify.register(fastifyHelmet, { global: true });
  fastify.register(fastifySensible);
  fastify.register(apiRoutes, { prefix: '/api/v1' });
  fastify.register(apiV2Routes, { prefix: '/api/v2' });

  fastify.setErrorHandler((error, request, reply) => {
    const statusCode =
      Number.isInteger(error.statusCode) && error.statusCode >= 400
        ? error.statusCode
        : 500;

    logRequestError(request, error, statusCode);
    return sendErrorResponse(reply, error, statusCode);
  });

  fastify.addHook('onClose', async (instance) => {
    instance.log.info('Fastify server has been closed');
  });

  return fastify;
}

const fastify = buildApp();
let isShuttingDown = false;

function normalizeError(reason) {
  if (reason instanceof Error) {
    return reason;
  }

  if (typeof reason === 'string') {
    return new Error(reason);
  }

  return new Error(`Unhandled rejection: ${JSON.stringify(reason)}`);
}

async function gracefulShutdown(reason, error) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  const exitCode = error ? 1 : 0;

  if (error) {
    fastify.log.error(
      { err: error },
      `Graceful shutdown triggered by ${reason}`
    );
  } else {
    fastify.log.info(`Graceful shutdown triggered by ${reason}`);
  }

  const forceShutdownTimer = setTimeout(() => {
    fastify.log.error('Fastify shutdown timed out. Exiting process.');
    process.exit(exitCode);
  }, 10_000);

  forceShutdownTimer.unref();

  try {
    await fastify.close();
    clearTimeout(forceShutdownTimer);
    process.exit(exitCode);
  } catch (closeError) {
    clearTimeout(forceShutdownTimer);
    fastify.log.error({ err: closeError }, 'Failed to close Fastify cleanly');
    process.exit(1);
  }
}

function registerProcessHandlers() {
  process.once('SIGINT', () => {
    void gracefulShutdown('SIGINT');
  });

  process.once('SIGTERM', () => {
    void gracefulShutdown('SIGTERM');
  });

  process.once('uncaughtException', (error) => {
    void gracefulShutdown('uncaughtException', error);
  });

  process.once('unhandledRejection', (reason) => {
    void gracefulShutdown('unhandledRejection', normalizeError(reason));
  });
}

async function start() {
  registerProcessHandlers();

  try {
    await fastify.ready();
    await inventoryService.initializeInventoryStorage();

    await fastify.listen({
      host: fastify.config.HOSTNAME,
      port: fastify.config.PORT,
    });

    fastify.log.info(
      `Server is running on http://${fastify.config.HOSTNAME}:${fastify.config.PORT}`
    );
    return fastify;
  } catch (error) {
    await gracefulShutdown('startup failure', error);
    throw error;
  }
}

const isDirectRun =
  typeof process.argv[1] === 'string' &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  void start();
}

export { buildApp, fastify, gracefulShutdown, start };

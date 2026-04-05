import { readFileSync } from 'node:fs';
import { env as runtimeEnv } from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseEnv } from 'node:util';
import fastifyMultipart from '@fastify/multipart';
import fastifyCors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import fastifyHelmet from '@fastify/helmet';
import fastifySensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { ERROR_MESSAGES } from '#constants/error-messages';
import inventoryRoutes from '#routes/inventory.routes';
import envSchema from '#schemas/env.schema';
import {
  healthDetailsSchema,
  healthPublicSchema,
} from '#schemas/health.schema';
import inventoryService from '#services/inventory.service';
import { createBackup } from '#utils/backup';
import { checkModelVersion } from '#utils/migrate';

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

  if (statusCode >= 500) {
    return reply.internalServerError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
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

function buildApp() {
  const fastify = Fastify({
    logger: buildLoggerOptions(),
  });

  fastify.register(fastifyEnv, {
    confKey: 'config',
    schema: envSchema,
    dotenv: true,
  });

  fastify.register(fastifyMultipart);

  fastify.register(fastifyStatic, {
    root: fileURLToPath(new URL('./uploads/', import.meta.url)),
  });

  fastify.register(fastifyCors, (instance) =>
    buildCorsOptions(instance.config)
  );
  fastify.register(fastifyHelmet, { global: true });
  fastify.register(fastifySensible);
  fastify.register(inventoryRoutes);

  fastify.get('/health', { schema: healthPublicSchema }, async () => ({
    status: 'ok',
  }));

  fastify.get(
    '/health/details',
    {
      schema: healthDetailsSchema,
      onRequest: async (request, reply) => {
        const apiKey = request.headers['x-api-key'];

        if (apiKey !== fastify.config.ADMIN_API_KEY) {
          return reply.unauthorized(ERROR_MESSAGES.UNAUTHORIZED);
        }
      },
    },
    async () => buildHealthDetails()
  );

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
    await inventoryService.initializeInventoryStorage();
    const backupPath = await createBackup();
    fastify.log.info({ backupPath }, 'Backup created on startup');

    const needsMigration = await checkModelVersion();
    if (needsMigration) {
      fastify.log.warn(
        'Data schema changed. Run "npm run migrate" to update existing files.'
      );
    }

    await fastify.ready();

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

import backupController from '#controllers/backup.controller';
import { downloadBackupSchema } from '#schemas/backup.schema';

async function backupRoutes(fastify) {
  fastify.get(
    '/backups/:timestamp',
    {
      schema: downloadBackupSchema,
      onRequest: async (request, reply) => {
        const apiKey = request.headers['x-api-key'];

        if (apiKey !== fastify.config.ADMIN_API_KEY) {
          return reply.unauthorized('Unauthorized');
        }
      },
    },
    backupController.downloadBackup
  );
}

export default backupRoutes;

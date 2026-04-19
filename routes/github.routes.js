import githubController from '#controllers/github.controller';
import { getSharedRepositoriesV1Schema } from '#schemas/github.schema';

async function githubRoutes(fastify) {
  fastify.get(
    '/github/shared-repos',
    { schema: getSharedRepositoriesV1Schema },
    githubController.getSharedRepositoriesV1
  );
}

export default githubRoutes;

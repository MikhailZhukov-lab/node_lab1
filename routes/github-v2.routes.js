import githubController from '#controllers/github.controller';
import { getSharedRepositoriesV2Schema } from '#schemas/github.schema';

async function githubV2Routes(fastify) {
  fastify.get(
    '/github/shared-repos',
    { schema: getSharedRepositoriesV2Schema },
    githubController.getSharedRepositoriesV2
  );
}

export default githubV2Routes;

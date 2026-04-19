import githubService from '#services/github.service';

const getSharedRepositoriesV1 = async (request, reply) => {
  const result = await githubService.getSharedRepositoriesSequential(
    request.query.repo,
    request.server.config.GITHUB_TOKEN
  );

  return reply.send(result);
};

const getSharedRepositoriesV2 = async (request, reply) => {
  const result = await githubService.getSharedRepositoriesParallel(
    request.query.repo,
    request.server.config.GITHUB_TOKEN
  );

  return reply.send(result);
};

export default {
  getSharedRepositoriesV1,
  getSharedRepositoriesV2,
};

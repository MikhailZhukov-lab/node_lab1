import {
  buildRepositorySummary,
  createAnalyticsResponse,
  getOwnerRepositories,
  getRepository,
  getRepositoryContributors,
  mapWithConcurrency,
  parseRepositoryPath,
  rankRepositories,
} from '#utils/github-api';

function excludeSourceRepository(repositories, sourceFullName) {
  return repositories.filter(
    (repository) =>
      repository.full_name &&
      repository.full_name.toLowerCase() !== sourceFullName.toLowerCase()
  );
}

function getSharedContributors(candidateContributors, sourceContributorSet) {
  return candidateContributors.filter((login) =>
    sourceContributorSet.has(login)
  );
}

async function loadSourceRepositoryData(repoPath, githubToken, dependencies) {
  const { getRepository, getRepositoryContributors, parseRepositoryPath } =
    dependencies;
  const sourceRepositoryPath = parseRepositoryPath(repoPath);
  const sourceRepository = await getRepository(
    sourceRepositoryPath.owner,
    sourceRepositoryPath.repo,
    githubToken
  );
  const sourceContributors = await getRepositoryContributors(
    sourceRepositoryPath.owner,
    sourceRepositoryPath.repo,
    githubToken
  );

  return {
    sourceRepository,
    sourceRepositoryPath,
    sourceContributorSet: new Set(sourceContributors),
  };
}

function createGithubService(
  dependencies = {
    buildRepositorySummary,
    createAnalyticsResponse,
    getOwnerRepositories,
    getRepository,
    getRepositoryContributors,
    mapWithConcurrency,
    parseRepositoryPath,
    rankRepositories,
  }
) {
  const getSharedRepositoriesSequential = async (repoPath, githubToken) => {
    const { sourceRepository, sourceRepositoryPath, sourceContributorSet } =
      await loadSourceRepositoryData(repoPath, githubToken, dependencies);
    const ownerRepositories = await dependencies.getOwnerRepositories(
      sourceRepository.owner.login,
      sourceRepository.owner.type,
      githubToken
    );
    const candidateRepositories = excludeSourceRepository(
      ownerRepositories,
      sourceRepository.full_name
    );
    const matches = [];

    for (const candidate of candidateRepositories) {
      const candidateContributors =
        await dependencies.getRepositoryContributors(
          candidate.owner.login,
          candidate.name,
          githubToken
        );
      const sharedContributors = getSharedContributors(
        candidateContributors,
        sourceContributorSet
      );

      matches.push(
        dependencies.buildRepositorySummary(candidate, sharedContributors)
      );
    }

    return dependencies.createAnalyticsResponse(
      sourceRepositoryPath.fullName,
      dependencies.rankRepositories(matches)
    );
  };

  const getSharedRepositoriesParallel = async (repoPath, githubToken) => {
    const { sourceRepository, sourceRepositoryPath, sourceContributorSet } =
      await loadSourceRepositoryData(repoPath, githubToken, dependencies);
    const ownerRepositories = await dependencies.getOwnerRepositories(
      sourceRepository.owner.login,
      sourceRepository.owner.type,
      githubToken
    );
    const candidateRepositories = excludeSourceRepository(
      ownerRepositories,
      sourceRepository.full_name
    );
    const matches = await dependencies.mapWithConcurrency(
      candidateRepositories,
      async (candidate) => {
        const candidateContributors =
          await dependencies.getRepositoryContributors(
            candidate.owner.login,
            candidate.name,
            githubToken
          );
        const sharedContributors = getSharedContributors(
          candidateContributors,
          sourceContributorSet
        );

        return dependencies.buildRepositorySummary(
          candidate,
          sharedContributors
        );
      }
    );

    return dependencies.createAnalyticsResponse(
      sourceRepositoryPath.fullName,
      dependencies.rankRepositories(matches)
    );
  };

  return {
    getSharedRepositoriesParallel,
    getSharedRepositoriesSequential,
  };
}

let githubServiceInstance = createGithubService();

function configureGithubService(dependencies) {
  githubServiceInstance = createGithubService(dependencies);
}

const githubService = {
  getSharedRepositoriesParallel(repoPath, githubToken) {
    return githubServiceInstance.getSharedRepositoriesParallel(
      repoPath,
      githubToken
    );
  },
  getSharedRepositoriesSequential(repoPath, githubToken) {
    return githubServiceInstance.getSharedRepositoriesSequential(
      repoPath,
      githubToken
    );
  },
};

export { configureGithubService, createGithubService };
export default githubService;

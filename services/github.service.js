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

async function loadSourceRepositoryData(repoPath, githubToken) {
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

async function getSharedRepositoriesSequential(repoPath, githubToken) {
  const { sourceRepository, sourceRepositoryPath, sourceContributorSet } =
    await loadSourceRepositoryData(repoPath, githubToken);
  const ownerRepositories = await getOwnerRepositories(
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
    const candidateContributors = await getRepositoryContributors(
      candidate.owner.login,
      candidate.name,
      githubToken
    );
    const sharedContributors = getSharedContributors(
      candidateContributors,
      sourceContributorSet
    );

    matches.push(buildRepositorySummary(candidate, sharedContributors));
  }

  return createAnalyticsResponse(
    sourceRepositoryPath.fullName,
    rankRepositories(matches)
  );
}

async function getSharedRepositoriesParallel(repoPath, githubToken) {
  const { sourceRepository, sourceRepositoryPath, sourceContributorSet } =
    await loadSourceRepositoryData(repoPath, githubToken);
  const ownerRepositories = await getOwnerRepositories(
    sourceRepository.owner.login,
    sourceRepository.owner.type,
    githubToken
  );
  const candidateRepositories = excludeSourceRepository(
    ownerRepositories,
    sourceRepository.full_name
  );
  const matches = await mapWithConcurrency(
    candidateRepositories,
    async (candidate) => {
      const candidateContributors = await getRepositoryContributors(
        candidate.owner.login,
        candidate.name,
        githubToken
      );
      const sharedContributors = getSharedContributors(
        candidateContributors,
        sourceContributorSet
      );

      return buildRepositorySummary(candidate, sharedContributors);
    }
  );

  return createAnalyticsResponse(
    sourceRepositoryPath.fullName,
    rankRepositories(matches)
  );
}

export default {
  getSharedRepositoriesParallel,
  getSharedRepositoriesSequential,
};

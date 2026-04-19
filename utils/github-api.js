const githubApiBaseUrl = 'https://api.github.com';
const githubApiVersion = '2022-11-28';
const pageSize = 100;
const parallelConcurrencyLimit = 5;

function createHttpError(statusCode, message, name = 'Error') {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.name = name;

  return error;
}

function buildGitHubHeaders(githubToken) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'inventory-lab-github-analytics',
    'X-GitHub-Api-Version': githubApiVersion,
  };

  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  return headers;
}

async function fetchGitHubJson(url, githubToken) {
  let response;

  try {
    response = await fetch(url, {
      headers: buildGitHubHeaders(githubToken),
    });
  } catch {
    throw createHttpError(
      502,
      'Failed to connect to GitHub API',
      'BadGatewayError'
    );
  }

  if (response.status === 404) {
    throw createHttpError(404, 'GitHub repository not found', 'NotFoundError');
  }

  if (response.status === 403 || response.status === 429) {
    throw createHttpError(
      502,
      'GitHub API rate limit exceeded. Try again later or configure GITHUB_TOKEN.',
      'BadGatewayError'
    );
  }

  if (!response.ok) {
    throw createHttpError(
      502,
      `GitHub API request failed with status ${response.status}`,
      'BadGatewayError'
    );
  }

  if (response.status === 204) {
    return [];
  }

  return response.json();
}

async function fetchGitHubPages(path, githubToken) {
  const items = [];

  for (let page = 1; ; page += 1) {
    const separator = path.includes('?') ? '&' : '?';
    const pageUrl = `${githubApiBaseUrl}${path}${separator}per_page=${pageSize}&page=${page}`;
    const pageItems = await fetchGitHubJson(pageUrl, githubToken);

    if (!Array.isArray(pageItems) || pageItems.length === 0) {
      break;
    }

    items.push(...pageItems);

    if (pageItems.length < pageSize) {
      break;
    }
  }

  return items;
}

function parseRepositoryPath(repoPath) {
  if (typeof repoPath !== 'string') {
    throw createHttpError(
      400,
      'Query parameter "repo" is required',
      'BadRequestError'
    );
  }

  const trimmedRepoPath = repoPath.trim();
  const [owner, repo, ...rest] = trimmedRepoPath.split('/');

  if (!owner || !repo || rest.length > 0) {
    throw createHttpError(
      400,
      'Query parameter "repo" must have format "owner/repository"',
      'BadRequestError'
    );
  }

  return {
    owner,
    repo,
    fullName: `${owner}/${repo}`,
  };
}

async function getRepository(owner, repo, githubToken) {
  return fetchGitHubJson(
    `${githubApiBaseUrl}/repos/${owner}/${repo}`,
    githubToken
  );
}

async function getRepositoryContributors(owner, repo, githubToken) {
  const contributors = await fetchGitHubPages(
    `/repos/${owner}/${repo}/contributors`,
    githubToken
  );

  return contributors
    .filter((contributor) => typeof contributor.login === 'string')
    .map((contributor) => contributor.login);
}

async function getOwnerRepositories(owner, ownerType, githubToken) {
  const ownerPath =
    ownerType === 'Organization'
      ? `/orgs/${owner}/repos?type=public&sort=updated`
      : `/users/${owner}/repos?type=owner&sort=updated`;

  return fetchGitHubPages(ownerPath, githubToken);
}

function buildRepositorySummary(candidate, sharedContributors) {
  return {
    fullName: candidate.full_name,
    description: candidate.description ?? null,
    htmlUrl: candidate.html_url,
    sharedContributors,
    sharedContributorsCount: sharedContributors.length,
    stargazersCount: candidate.stargazers_count ?? 0,
  };
}

function rankRepositories(repositories) {
  return repositories
    .filter((repository) => repository.sharedContributorsCount > 0)
    .sort((left, right) => {
      if (right.sharedContributorsCount !== left.sharedContributorsCount) {
        return right.sharedContributorsCount - left.sharedContributorsCount;
      }

      if (right.stargazersCount !== left.stargazersCount) {
        return right.stargazersCount - left.stargazersCount;
      }

      return left.fullName.localeCompare(right.fullName);
    })
    .slice(0, 5);
}

function createAnalyticsResponse(sourceRepository, repositories) {
  return {
    repo: sourceRepository,
    repositories,
  };
}

async function mapWithConcurrency(
  items,
  mapper,
  concurrency = parallelConcurrencyLimit
) {
  const results = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex;
      currentIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );

  await Promise.all(workers);

  return results;
}

export {
  buildRepositorySummary,
  createAnalyticsResponse,
  createHttpError,
  getOwnerRepositories,
  getRepository,
  getRepositoryContributors,
  mapWithConcurrency,
  parseRepositoryPath,
  rankRepositories,
};

import { describe, expect, it, vi } from 'vitest';
import { createGithubService } from '../../services/github.service.js';

describe('github service', () => {
  it('builds sequential analytics result from injected dependencies', async () => {
    const service = createGithubService({
      buildRepositorySummary: vi.fn((candidate, sharedContributors) => ({
        fullName: candidate.full_name,
        sharedContributors,
        sharedContributorsCount: sharedContributors.length,
        stargazersCount: candidate.stargazers_count,
      })),
      createAnalyticsResponse: vi.fn((repo, repositories) => ({
        repo,
        repositories,
      })),
      getOwnerRepositories: vi.fn(async () => [
        {
          full_name: 'owner/source',
          name: 'source',
          owner: { login: 'owner' },
          stargazers_count: 10,
        },
        {
          full_name: 'owner/related',
          name: 'related',
          owner: { login: 'owner' },
          stargazers_count: 5,
        },
      ]),
      getRepository: vi.fn(async () => ({
        full_name: 'owner/source',
        owner: { login: 'owner', type: 'User' },
      })),
      getRepositoryContributors: vi
        .fn()
        .mockResolvedValueOnce(['alice', 'bob'])
        .mockResolvedValueOnce(['alice', 'zoe']),
      mapWithConcurrency: vi.fn(),
      parseRepositoryPath: vi.fn(() => ({
        fullName: 'owner/source',
        owner: 'owner',
        repo: 'source',
      })),
      rankRepositories: vi.fn((repositories) => repositories),
    });

    const result =
      await service.getSharedRepositoriesSequential('owner/source');

    expect(result).toEqual({
      repo: 'owner/source',
      repositories: [
        {
          fullName: 'owner/related',
          sharedContributors: ['alice'],
          sharedContributorsCount: 1,
          stargazersCount: 5,
        },
      ],
    });
  });

  it('builds parallel analytics result from injected dependencies', async () => {
    const service = createGithubService({
      buildRepositorySummary: vi.fn((candidate, sharedContributors) => ({
        fullName: candidate.full_name,
        sharedContributors,
      })),
      createAnalyticsResponse: vi.fn((repo, repositories) => ({
        repo,
        repositories,
      })),
      getOwnerRepositories: vi.fn(async () => [
        {
          full_name: 'owner/source',
          name: 'source',
          owner: { login: 'owner' },
        },
        {
          full_name: 'owner/related',
          name: 'related',
          owner: { login: 'owner' },
        },
      ]),
      getRepository: vi.fn(async () => ({
        full_name: 'owner/source',
        owner: { login: 'owner', type: 'User' },
      })),
      getRepositoryContributors: vi
        .fn()
        .mockResolvedValueOnce(['alice'])
        .mockResolvedValueOnce(['alice', 'bob']),
      mapWithConcurrency: vi.fn(async (items, mapper) =>
        Promise.all(items.map(mapper))
      ),
      parseRepositoryPath: vi.fn(() => ({
        fullName: 'owner/source',
        owner: 'owner',
        repo: 'source',
      })),
      rankRepositories: vi.fn((repositories) => repositories),
    });

    const result = await service.getSharedRepositoriesParallel('owner/source');

    expect(result).toEqual({
      repo: 'owner/source',
      repositories: [
        {
          fullName: 'owner/related',
          sharedContributors: ['alice'],
        },
      ],
    });
  });
});

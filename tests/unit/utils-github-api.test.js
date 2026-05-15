import { describe, expect, it, vi } from 'vitest';
import {
  createAnalyticsResponse,
  getOwnerRepositories,
  getRepositoryContributors,
  getRepository,
  mapWithConcurrency,
  parseRepositoryPath,
  rankRepositories,
} from '../../utils/github-api.js';

describe('github api helpers', () => {
  it('parses repository path and rejects invalid values', () => {
    expect(parseRepositoryPath('fastify/fastify')).toEqual({
      owner: 'fastify',
      repo: 'fastify',
      fullName: 'fastify/fastify',
    });

    expect(() => parseRepositoryPath('fastify')).toThrow(
      'Query parameter "repo" must have format "owner/repository"'
    );
  });

  it('ranks repositories by shared contributors and stars', () => {
    const result = rankRepositories([
      {
        fullName: 'owner/b',
        sharedContributorsCount: 1,
        stargazersCount: 1,
      },
      {
        fullName: 'owner/a',
        sharedContributorsCount: 2,
        stargazersCount: 3,
      },
      {
        fullName: 'owner/c',
        sharedContributorsCount: 2,
        stargazersCount: 1,
      },
    ]);

    expect(result.map((item) => item.fullName)).toEqual([
      'owner/a',
      'owner/c',
      'owner/b',
    ]);
  });

  it('maps items with concurrency and preserves order', async () => {
    const result = await mapWithConcurrency(
      [1, 2, 3],
      async (value) => value * 2,
      2
    );

    expect(result).toEqual([2, 4, 6]);
  });

  it('loads repository contributors and owner repositories via paginated fetches', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input) => {
        const url = new URL(String(input));

        if (url.pathname === '/repos/fastify/fastify/contributors') {
          return new Response(
            JSON.stringify(
              url.searchParams.get('page') === '1'
                ? [{ login: 'alice' }, { login: 'bob' }]
                : []
            ),
            { status: 200 }
          );
        }

        if (url.pathname === '/users/fastify/repos') {
          return new Response(
            JSON.stringify(
              url.searchParams.get('page') === '1'
                ? [{ full_name: 'fastify/fastify' }]
                : []
            ),
            { status: 200 }
          );
        }

        return new Response(JSON.stringify({ message: 'not found' }), {
          status: 404,
        });
      })
    );

    await expect(
      getRepositoryContributors('fastify', 'fastify')
    ).resolves.toEqual(['alice', 'bob']);
    await expect(getOwnerRepositories('fastify', 'User')).resolves.toEqual([
      { full_name: 'fastify/fastify' },
    ]);
    expect(createAnalyticsResponse('fastify/fastify', [])).toEqual({
      repo: 'fastify/fastify',
      repositories: [],
    });
  });

  it('maps github http errors for network, rate limit and not found cases', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input) => {
        const url = new URL(String(input));

        if (url.pathname === '/repos/fastify/missing') {
          return new Response(JSON.stringify({ message: 'not found' }), {
            status: 404,
          });
        }

        if (url.pathname === '/users/fastify/repos') {
          return new Response(JSON.stringify({ message: 'rate limited' }), {
            status: 403,
          });
        }

        throw new Error('network failure');
      })
    );

    await expect(getRepository('fastify', 'missing')).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(getOwnerRepositories('fastify', 'User')).rejects.toMatchObject(
      {
        statusCode: 502,
      }
    );
    await expect(
      getRepositoryContributors('fastify', 'fastify')
    ).rejects.toMatchObject({
      statusCode: 502,
    });
  });
});

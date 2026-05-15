import { vi } from 'vitest';

const defaultCategories = [
  { id: 1, name: 'Electronics', tax: 20 },
  { id: 2, name: 'Books', tax: 7 },
  { id: 3, name: 'Home', tax: 15 },
];

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function createExternalFetchMock(overrides = {}) {
  const {
    categories = defaultCategories,
    missingRepository = 'missing/repo',
    sourceRepositoryPath = 'owner/source',
  } = overrides;

  const [sourceOwner, sourceRepo] = sourceRepositoryPath.split('/');

  return vi.fn(async (input) => {
    const url = new URL(String(input));

    if (url.hostname === '127.0.0.1' && url.port === '3001') {
      return jsonResponse(categories);
    }

    if (url.hostname !== 'api.github.com') {
      return jsonResponse({ message: 'not found' }, 404);
    }

    if (url.pathname === `/repos/${missingRepository}`) {
      return jsonResponse({ message: 'not found' }, 404);
    }

    if (url.pathname === `/repos/${sourceOwner}/${sourceRepo}`) {
      return jsonResponse({
        full_name: `${sourceOwner}/${sourceRepo}`,
        owner: {
          login: sourceOwner,
          type: 'User',
        },
      });
    }

    if (url.pathname === `/repos/${sourceOwner}/${sourceRepo}/contributors`) {
      return jsonResponse(
        url.searchParams.get('page') === '1'
          ? [{ login: 'alice' }, { login: 'bob' }]
          : []
      );
    }

    if (url.pathname === `/users/${sourceOwner}/repos`) {
      return jsonResponse(
        url.searchParams.get('page') === '1'
          ? [
              {
                full_name: `${sourceOwner}/${sourceRepo}`,
                name: sourceRepo,
                description: 'Source repo',
                html_url: `https://github.com/${sourceOwner}/${sourceRepo}`,
                stargazers_count: 50,
                owner: {
                  login: sourceOwner,
                },
              },
              {
                full_name: `${sourceOwner}/related-a`,
                name: 'related-a',
                description: 'Related A',
                html_url: `https://github.com/${sourceOwner}/related-a`,
                stargazers_count: 12,
                owner: {
                  login: sourceOwner,
                },
              },
              {
                full_name: `${sourceOwner}/related-b`,
                name: 'related-b',
                description: 'Related B',
                html_url: `https://github.com/${sourceOwner}/related-b`,
                stargazers_count: 6,
                owner: {
                  login: sourceOwner,
                },
              },
            ]
          : []
      );
    }

    if (url.pathname === `/repos/${sourceOwner}/related-a/contributors`) {
      return jsonResponse(
        url.searchParams.get('page') === '1'
          ? [{ login: 'alice' }, { login: 'zara' }]
          : []
      );
    }

    if (url.pathname === `/repos/${sourceOwner}/related-b/contributors`) {
      return jsonResponse(
        url.searchParams.get('page') === '1'
          ? [{ login: 'bob' }, { login: 'max' }]
          : []
      );
    }

    return jsonResponse({ message: 'unexpected request' }, 404);
  });
}

export { createExternalFetchMock, defaultCategories };

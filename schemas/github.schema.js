const githubQuerySchema = {
  type: 'object',
  properties: {
    repo: {
      type: 'string',
      pattern: '^[^/]+/[^/]+$',
      examples: ['fastify/fastify'],
    },
  },
  required: ['repo'],
  additionalProperties: false,
};

const githubSharedRepositorySchema = {
  type: 'object',
  properties: {
    fullName: { type: 'string' },
    description: { type: ['string', 'null'] },
    htmlUrl: { type: 'string' },
    sharedContributors: {
      type: 'array',
      items: { type: 'string' },
    },
    sharedContributorsCount: { type: 'integer', minimum: 0 },
    stargazersCount: { type: 'integer', minimum: 0 },
  },
  required: [
    'fullName',
    'description',
    'htmlUrl',
    'sharedContributors',
    'sharedContributorsCount',
    'stargazersCount',
  ],
  additionalProperties: false,
};

const githubSharedRepositoriesResponseSchema = {
  type: 'object',
  properties: {
    repo: { type: 'string' },
    repositories: {
      type: 'array',
      items: githubSharedRepositorySchema,
      maxItems: 5,
    },
  },
  required: ['repo', 'repositories'],
  additionalProperties: false,
};

const githubErrorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    error: { type: 'string' },
    message: { type: 'string' },
  },
  required: ['statusCode', 'error', 'message'],
  additionalProperties: false,
};

const getSharedRepositoriesV1Schema = {
  summary:
    'Find repositories with the most shared contributors using sequential GitHub REST requests',
  tags: ['GitHub v1'],
  querystring: githubQuerySchema,
  response: {
    200: githubSharedRepositoriesResponseSchema,
    400: githubErrorSchema,
    404: githubErrorSchema,
    502: githubErrorSchema,
  },
};

const getSharedRepositoriesV2Schema = {
  summary:
    'Find repositories with the most shared contributors using parallel GitHub REST requests',
  tags: ['GitHub v2'],
  querystring: githubQuerySchema,
  response: {
    200: githubSharedRepositoriesResponseSchema,
    400: githubErrorSchema,
    404: githubErrorSchema,
    502: githubErrorSchema,
  },
};

export { getSharedRepositoriesV1Schema, getSharedRepositoriesV2Schema };

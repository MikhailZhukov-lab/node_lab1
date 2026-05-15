import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildMultipartBody } from '../helpers/multipart.js';
import { createExternalFetchMock } from '../helpers/fetch-stubs.js';
import {
  closeTestApp,
  createTestApp,
  resetTestState,
} from '../helpers/test-app.js';

async function loginAndGetAccess(app) {
  await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: {
      email: 'inventory@example.com',
      password: 'secret123',
    },
  });

  const loginResponse = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: 'inventory@example.com',
      password: 'secret123',
    },
  });

  return {
    accessToken: loginResponse.json().accessToken,
    refreshToken: loginResponse.cookies[0]?.value,
  };
}

describe('inventory integration', () => {
  let app;

  beforeEach(async () => {
    app = await createTestApp();
    vi.stubGlobal('fetch', createExternalFetchMock());
    await resetTestState(app);
  });

  it('handles inventory CRUD, export, details and paginated endpoints', async () => {
    const { accessToken } = await loginAndGetAccess(app);

    const createFirst = await app.inject({
      method: 'POST',
      url: '/api/v1/inventory',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        name: 'Laptop',
        quantity: 2,
        price: 1400,
        category: 'Electronics',
      },
    });

    expect(createFirst.statusCode).toBe(201);
    const firstItem = createFirst.json();

    const createSecond = await app.inject({
      method: 'POST',
      url: '/api/v1/inventory',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        name: 'Book',
        quantity: 4,
        price: 25,
        category: 'Books',
      },
    });

    expect(createSecond.statusCode).toBe(201);
    const secondItem = createSecond.json();

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/inventory',
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toHaveLength(2);

    const filteredResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/inventory?category=Books',
    });
    expect(filteredResponse.json()).toHaveLength(1);

    const detailsResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/inventory/${firstItem.id}/details`,
    });
    expect(detailsResponse.statusCode).toBe(200);
    expect(detailsResponse.json()).toMatchObject({
      externalCategoryName: 'Electronics',
      id: firstItem.id,
    });

    const aliasDetailsResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/items/${secondItem.id}/details`,
    });
    expect(aliasDetailsResponse.statusCode).toBe(200);

    const paginatedResponse = await app.inject({
      method: 'GET',
      url: '/api/v2/inventory?page=1&limit=1',
    });
    expect(paginatedResponse.statusCode).toBe(200);
    expect(paginatedResponse.json()).toMatchObject({
      limit: 1,
      page: 1,
      total: 2,
      totalPages: 2,
    });

    const exportResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/inventory/export',
    });
    expect(exportResponse.statusCode).toBe(200);
    expect(exportResponse.headers['content-type']).toContain('text/csv');

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/api/v1/inventory/${firstItem.id}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        quantity: 3,
      },
    });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().quantity).toBe(3);

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/api/v1/inventory/${secondItem.id}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    expect(deleteResponse.statusCode).toBe(200);

    const notFoundResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/inventory/99999/details',
    });
    expect(notFoundResponse.statusCode).toBe(404);
  });

  it('imports items, uploads image and rejects invalid requests', async () => {
    const { accessToken } = await loginAndGetAccess(app);

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/inventory',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        name: 'Camera',
        quantity: 1,
        price: 500,
        category: 'Electronics',
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const createdItem = createResponse.json();

    const importBody = buildMultipartBody([
      {
        name: 'file',
        filename: 'items.json',
        contentType: 'application/json',
        value: JSON.stringify([
          {
            name: 'Desk',
            quantity: 1,
            price: 150,
            category: 'Home',
          },
          {
            name: 'X',
            quantity: 1,
            price: 10,
            category: 'Home',
          },
        ]),
      },
    ]);

    const importResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/inventory/import',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': `multipart/form-data; boundary=${importBody.boundary}`,
      },
      payload: importBody.body,
    });

    expect(importResponse.statusCode).toBe(200);
    expect(importResponse.json()).toMatchObject({
      imported: 1,
      rejected: 1,
    });

    const imageBody = buildMultipartBody([
      {
        name: 'file',
        filename: 'image.png',
        contentType: 'image/png',
        value: Buffer.from('fake-png-content'),
      },
    ]);

    const uploadResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/inventory/${createdItem.id}/image`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': `multipart/form-data; boundary=${imageBody.boundary}`,
      },
      payload: imageBody.body,
    });

    expect(uploadResponse.statusCode).toBe(200);
    expect(uploadResponse.json().image).toContain(
      `/${createdItem.id}/image.png`
    );

    const imageResponse = await app.inject({
      method: 'GET',
      url: `/${createdItem.id}/image.png`,
    });

    expect(imageResponse.statusCode).toBe(200);

    const invalidUploadBody = buildMultipartBody([
      {
        name: 'file',
        filename: 'image.txt',
        contentType: 'text/plain',
        value: 'not-an-image',
      },
    ]);

    const invalidUploadResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/inventory/${createdItem.id}/image`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': `multipart/form-data; boundary=${invalidUploadBody.boundary}`,
      },
      payload: invalidUploadBody.body,
    });

    expect(invalidUploadResponse.statusCode).toBe(400);

    const unauthorizedCreateResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/inventory',
      payload: {
        name: 'No auth item',
        quantity: 1,
        price: 10,
        category: 'Books',
      },
    });

    expect(unauthorizedCreateResponse.statusCode).toBe(401);
  });

  afterEach(async () => {
    await closeTestApp(app);
  });
});

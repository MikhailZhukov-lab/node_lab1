import http from 'node:http';

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function test() {
  console.log('\n=== GET /api/v1/inventory ===');
  const getAll = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/inventory',
    method: 'GET',
  });
  console.log('Status:', getAll.status);
  console.log('Data:', JSON.stringify(getAll.data, null, 2));

  console.log('\n=== GET /api/v1/inventory?category=electronics ===');
  const getFiltered = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/inventory?category=electronics',
    method: 'GET',
  });
  console.log('Status:', getFiltered.status);
  console.log('Data:', JSON.stringify(getFiltered.data, null, 2));

  console.log('\n=== POST /api/v1/inventory ===');
  const postBody = JSON.stringify({
    name: 'Keyboard',
    quantity: 10,
    price: 50,
    category: 'electronics',
  });
  const postItem = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/v1/inventory',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postBody),
      },
    },
    postBody
  );
  console.log('Status:', postItem.status);
  console.log('Data:', JSON.stringify(postItem.data, null, 2));

  console.log('\n=== PATCH /api/v1/inventory/1 ===');
  const patchBody = JSON.stringify({ price: 1300 });
  const patchItem = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/v1/inventory/1',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(patchBody),
      },
    },
    patchBody
  );
  console.log('Status:', patchItem.status);
  console.log('Data:', JSON.stringify(patchItem.data, null, 2));

  console.log('\n=== GET /api/v1/inventory/export ===');
  const exportItems = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/inventory/export',
    method: 'GET',
  });
  console.log('Status:', exportItems.status);
  console.log('Data (CSV):', exportItems.data.substring(0, 200) + '...');

  console.log('\n=== Test Complete ===');
}

test().catch(console.error);

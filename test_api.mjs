import http from 'node:http';

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const body = JSON.stringify(data);

    const req = http.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const req = http.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(JSON.parse(data)));
      }
    );

    req.on('error', reject);
    req.end();
  });
}

async function test() {
  console.log('=== GET /api/v1/inventory ===');
  console.log(await getJson('http://127.0.0.1:3000/api/v1/inventory'));

  console.log('\n=== POST /api/v1/inventory ===');
  console.log(
    await postJson('http://127.0.0.1:3000/api/v1/inventory', {
      name: 'Keyboard',
      quantity: 10,
      price: 50,
      category: 'electronics',
    })
  );

  console.log('\n=== GET /api/v1/inventory (after POST) ===');
  console.log(await getJson('http://127.0.0.1:3000/api/v1/inventory'));

  console.log('\n=== GET /api/v1/inventory with category=electronics filter ===');
  console.log(
    await getJson('http://127.0.0.1:3000/api/v1/inventory?category=electronics')
  );
}

test();

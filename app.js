const http = require('http');

// Читаємо змінні оточення, якщо їх немає - використовуємо дефолтні
const HOSTNAME = process.env.HOSTNAME || '127.0.0.1';
const PORT = process.env.PORT || 3000;

// Наша "база даних" в пам'яті
let inventory = [
    { "id": 1, "name": "Monitor", "price": 500, "qty": 10 },
    { "id": 2, "name": "Keyboard", "price": 75, "qty": 25 },
    { "id": 3, "name": "Mouse", "price": 40, "qty": 30 }
];

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const method = req.method;
    const pathname = url.pathname;

    res.setHeader('Content-Type', 'application/json');

    // GET /inventory - отримати всі товари з фільтрацією
    if (method === 'GET' && pathname === '/inventory') {
        const minPrice = url.searchParams.get('minPrice');
        let results = [...inventory];

        if (minPrice) {
            results = results.filter(item => item.price >= parseInt(minPrice, 10));
        }

        res.statusCode = 200;
        res.end(JSON.stringify(results));
        return;
    }

    // POST /inventory - додати новий товар
    if (method === 'POST' && pathname === '/inventory') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const newItemData = JSON.parse(body);
                if (!newItemData.name || !newItemData.price || !newItemData.qty) {
                    res.statusCode = 400;
                    return res.end(JSON.stringify({ error: 'Name, price, and qty are required' }));
                }

                const newId = inventory.length > 0 ? Math.max(...inventory.map(i => i.id)) + 1 : 1;
                const newItem = { id: newId, ...newItemData };
                inventory.push(newItem);

                res.statusCode = 201;
                res.end(JSON.stringify(newItem));
            } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // PATCH /inventory/:id - оновити товар
    if (method === 'PATCH' && pathname.startsWith('/inventory/')) {
        const id = parseInt(pathname.split('/')[2]);
        const itemIndex = inventory.findIndex(item => item.id === id);

        if (itemIndex === -1) {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: 'Item not found' }));
        }

        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const updates = JSON.parse(body);
                // Оновлюємо тільки передані поля, id не чіпаємо
                inventory[itemIndex] = { ...inventory[itemIndex], ...updates, id };
                res.statusCode = 200;
                res.end(JSON.stringify(inventory[itemIndex]));
            } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // DELETE /inventory/:id - видалити товар
    if (method === 'DELETE' && pathname.startsWith('/inventory/')) {
        const id = parseInt(pathname.split('/')[2]);
        const initialLength = inventory.length;
        inventory = inventory.filter(item => item.id !== id);

        if (inventory.length < initialLength) {
            res.statusCode = 200;
            res.end(JSON.stringify({ message: 'Item deleted successfully' }));
        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Item not found' }));
        }
        return;
    }

    // Якщо жоден маршрут не підійшов
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Route not found' }));
});

server.listen(PORT, HOSTNAME, () => {
    console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
});

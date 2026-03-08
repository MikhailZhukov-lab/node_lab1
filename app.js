const http = require('http');
const config = require('./config'); // Імпортуємо валідований конфіг

// Наша "база даних" в пам'яті
let inventory = [
    { "id": 1, "name": "Monitor", "price": 500, "qty": 10 },
    { "id": 2, "name": "Keyboard", "price": 75, "qty": 25 },
    { "id": 3, "name": "Mouse", "price": 40, "qty": 30 }
];

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const method = req.method;
    const pathname = url.pathname; // Виправлено: прибрано випадковий текст

    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // --- ПУНКТ 4: ЛОГУВАННЯ (Варіант 1 - формат JSON) ---
    const log = (status, level = "INFO") => {
        const isError = status >= 400;
        const shouldLog = config.NODE_ENV === 'development' || isError;

        if (shouldLog) {
            const logData = {
                timestamp: new Date().toISOString(),
                level: isError ? "ERROR" : level,
                method: method,
                url: pathname,
                status: status
            };
            console.log(JSON.stringify(logData)); // Виводить лог як валідний рядок JSON
        }
    };

    // --- ПУНКТ 8: HEALTH CHECK (/health) ---
    if (method === 'GET' && pathname === '/health') {
        res.statusCode = 200;
        log(200);
        return res.end(JSON.stringify({
            pid: process.pid,
            nodeVersion: process.version,
            platform: process.platform,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        }));
    }

    // --- GET /inventory - отримати всі товари з фільтрацією ---
    if (method === 'GET' && pathname === '/inventory') {
        const minPrice = url.searchParams.get('minPrice');
        let results = [...inventory];

        if (minPrice) {
            results = results.filter(item => item.price >= parseInt(minPrice, 10));
        }

        res.statusCode = 200;
        log(200);
        return res.end(JSON.stringify(results));
    }

    // --- POST /inventory - додати новий товар ---
    if (method === 'POST' && pathname === '/inventory') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const newItemData = JSON.parse(body);
                if (!newItemData.name || typeof newItemData.price !== 'number' || typeof newItemData.qty !== 'number') {
                    res.statusCode = 400;
                    log(400);
                    return res.end(JSON.stringify({ error: 'Name, price (number), and qty (number) are required' }));
                }

                const newId = inventory.length > 0 ? Math.max(...inventory.map(i => i.id)) + 1 : 1;
                const newItem = { id: newId, ...newItemData };
                inventory.push(newItem);

                res.statusCode = 201;
                log(201);
                res.end(JSON.stringify(newItem));
            } catch (error) {
                res.statusCode = 400;
                log(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // --- PATCH /inventory/:id - оновити товар ---
    if (method === 'PATCH' && pathname.startsWith('/inventory/')) {
        const id = parseInt(pathname.split('/')[2]);
        const itemIndex = inventory.findIndex(item => item.id === id);

        if (itemIndex === -1) {
            res.statusCode = 404;
            log(404);
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
                log(200);
                res.end(JSON.stringify(inventory[itemIndex]));
            } catch (error) {
                res.statusCode = 400;
                log(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // --- DELETE /inventory/:id - видалити товар ---
    if (method === 'DELETE' && pathname.startsWith('/inventory/')) {
        const id = parseInt(pathname.split('/')[2]);
        const initialLength = inventory.length;
        inventory = inventory.filter(item => item.id !== id);

        if (inventory.length < initialLength) {
            res.statusCode = 200;
            log(200);
            res.end(JSON.stringify({ message: 'Item deleted successfully' }));
        } else {
            res.statusCode = 404;
            log(404);
            res.end(JSON.stringify({ error: 'Item not found' }));
        }
        return;
    }

    // --- 404 Route not found ---
    res.statusCode = 404;
    log(404);
    res.end(JSON.stringify({ error: 'Route not found' }));
});

// --- ПУНКТ 5: GRACEFUL SHUTDOWN (Коректне завершення) ---
function gracefulShutdown(signal) {
    console.log(`\nReceived ${signal}. Closing HTTP server...`);

    const forceExit = setTimeout(() => {
        console.error('Force shutdown after 10s');
        process.exit(1);
    }, 10000);

    server.close((err) => {
        clearTimeout(forceExit);
        if (err) {
            console.error('Error closing server:', err);
            process.exit(1);
        }
        console.log('HTTP server closed.');
        process.exit(0);
    });
}

// ПУНКТ 6 та 7: Перехоплення системних сигналів та помилок
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection at:', reason);
    gracefulShutdown('unhandledRejection');
});

// Запуск сервера
server.listen(config.PORT, config.HOSTNAME, () => {
    console.log(`Server running in ${config.NODE_ENV} mode at http://${config.HOSTNAME}:${config.PORT}/`);
});
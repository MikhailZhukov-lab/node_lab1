// Перевіряємо наявність та коректність змінних середовища
const PORT = parseInt(process.env.PORT, 10);
const HOSTNAME = process.env.HOSTNAME;
const NODE_ENV = process.env.NODE_ENV;

// Валідація: якщо порту немає або він некоректний
if (
  isNaN(PORT) ||
  !HOSTNAME ||
  !['development', 'production'].includes(NODE_ENV)
) {
  console.error(
    'Error: Invalid or missing environment variables (PORT, HOSTNAME, NODE_ENV)'
  );
  process.exit(1); // Завершуємо процес із кодом помилки
}

module.exports = { PORT, HOSTNAME, NODE_ENV };

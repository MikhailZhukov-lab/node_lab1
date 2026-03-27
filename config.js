const PORT = parseInt(process.env.PORT, 10);
const HOSTNAME = process.env.HOSTNAME;
const NODE_ENV = process.env.NODE_ENV;

if (
  isNaN(PORT) ||
  !HOSTNAME ||
  !['development', 'production'].includes(NODE_ENV)
) {
  console.error(
    'Error: Invalid or missing environment variables (PORT, HOSTNAME, NODE_ENV)'
  );
  process.exit(1);
}

module.exports = { PORT, HOSTNAME, NODE_ENV };

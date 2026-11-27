require('dotenv').config();
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

function validateProductionEnvironment() {
  if (process.env.NODE_ENV !== 'production') return;

  const required = ['MONGO_URI', 'JWT_SECRET'];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
}

async function startServer() {
  try {
    validateProductionEnvironment();
    const databaseConnected = await connectDB();

    if (!databaseConnected && process.env.NODE_ENV === 'production') {
      throw new Error('MongoDB is required before starting in production.');
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`AMADE backend listening on port ${PORT}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other process or configure a different PORT.`);
      } else {
        console.error('AMADE backend failed to listen:', error.message);
      }
      process.exitCode = 1;
    });

    let shuttingDown = false;
    const shutdown = async (signal) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`Received ${signal}. Shutting down the AMADE backend.`);

      try {
        await new Promise((resolve) => server.close(resolve));
      } catch (error) {
        console.error('HTTP server shutdown failed:', error.message);
      }

      try {
        await disconnectDB();
      } catch (error) {
        console.error('Database shutdown failed:', error.message);
      }

      process.exitCode = 0;
      setImmediate(() => process.exit());
    };

    process.once('SIGTERM', () => shutdown('SIGTERM'));
    process.once('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start AMADE backend:', error.message);
    process.exitCode = 1;
  }
}

startServer();

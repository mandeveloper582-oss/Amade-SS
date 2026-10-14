require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const databaseConnected = await connectDB();

    if (!databaseConnected && process.env.NODE_ENV === 'production') {
      throw new Error('MongoDB is required before starting in production.');
    }

    const server = app.listen(PORT, () => {
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
  } catch (error) {
    console.error('Failed to start AMADE backend:', error.message);
    process.exitCode = 1;
  }
}

startServer();

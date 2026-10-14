const mongoose = require('mongoose');
const dns = require('node:dns');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');

let memoryMongoServer = null;

async function seedDefaultAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return;
  }

  const existing = await User.findOne({ email: adminEmail.toLowerCase() });
  if (existing) {
    return;
  }

  await User.create({
    name: process.env.ADMIN_NAME || 'AMADE Admin',
    email: adminEmail.toLowerCase(),
    password: adminPassword,
    role: 'super_admin',
    isActive: true,
  });

  console.log('Default admin user created.');
}

async function connectDB() {
  const configuredMongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/amade';
  const isProduction = process.env.NODE_ENV === 'production';
  const useMemoryServer = !isProduction && process.env.MONGO_MEMORY_SERVER === 'true';
  const configuredDnsServers = (process.env.MONGO_DNS_SERVERS || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);
  const connectionOptions = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 5000,
  };

  const tryMongoMemoryServer = async () => {
    if (memoryMongoServer) {
      return;
    }

    memoryMongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.24',
      },
    });

    const memoryUri = memoryMongoServer.getUri();
    await mongoose.connect(memoryUri, connectionOptions);
    console.log('MongoDB connected via in-memory server in development mode.');
  };

  try {
    if (configuredDnsServers.length > 0) {
      dns.setServers(configuredDnsServers);
    }

    await mongoose.connect(configuredMongoUri, connectionOptions);
    console.log('MongoDB connected.');
    await seedDefaultAdmin();
    return true;
  } catch (error) {
    if (isProduction) {
      console.error('MongoDB connection error:', error.message);
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const safeErrorMessage = errorMessage.replace(
      /(mongodb(?:\+srv)?:\/\/)[^@\s]+@/gi,
      '$1[REDACTED]@',
    );

    if (useMemoryServer) {
      try {
        await tryMongoMemoryServer();
        await seedDefaultAdmin();
        console.warn(`MongoDB unavailable; using an in-memory MongoDB instance instead (${safeErrorMessage}).`);
        return true;
      } catch (memoryError) {
        console.warn(
          `The optional in-memory MongoDB server could not start: ${memoryError instanceof Error ? memoryError.message : String(memoryError)}`,
        );
      }
    }

    console.warn(
      `MongoDB unavailable in development mode (${safeErrorMessage}). The API will start without a live database connection. Set MONGO_URI to a reachable MongoDB instance to enable full functionality.`,
    );
    if (useMemoryServer) {
      console.warn('MONGO_MEMORY_SERVER was enabled, but its fallback did not start.');
    } else {
      console.warn('Set MONGO_MEMORY_SERVER=true to opt in to the temporary in-memory database fallback.');
    }
    return false;
  }
}

async function disconnectDB() {
  if (memoryMongoServer) {
    await mongoose.disconnect();
    await memoryMongoServer.stop();
    memoryMongoServer = null;
    return;
  }

  await mongoose.disconnect();
}

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

module.exports = { connectDB, disconnectDB, seedDefaultAdmin, isDatabaseConnected };

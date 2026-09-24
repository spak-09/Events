const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const fs = require('fs');

let mongoServer;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_ACCESS_SECRET = 'test_access_secret_1234567890_eventforge';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_0987654321_eventforge';
  process.env.COOKIE_SECRET = 'test_cookie_secret_xyz_eventforge';

  const systemBinary = 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';
  if (fs.existsSync(systemBinary)) {
    process.env.MONGOMS_SYSTEM_BINARY = systemBinary;
  }

  try {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        storageEngine: 'wiredTiger',
      },
    });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  } catch (err) {
    // Fallback to local running MongoDB if in-memory fails
    // eslint-disable-next-line no-console
    console.warn('Falling back to local MongoDB for tests:', err.message);
    await mongoose.connect('mongodb://localhost:27017/eventforge_test');
  }
}, 60000);

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

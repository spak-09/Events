const mongoose = require('mongoose');
const env = require('./env');

let isConnected = false;

const connectDB = async (uri = env.MONGODB_URI) => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
    });
    isConnected = true;
    if (env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    }
    return conn.connection;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};

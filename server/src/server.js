const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');

let server;

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(env.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`🚀 EventForge Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      // eslint-disable-next-line no-console
      console.log(`📖 Swagger API Documentation available at http://localhost:${env.PORT}/api/docs`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Fatal Server Boot Error:', error.message);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  // eslint-disable-next-line no-console
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      // eslint-disable-next-line no-console
      console.log('HTTP server closed.');
      await disconnectDB();
      // eslint-disable-next-line no-console
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();

const pino = require('pino');
const env = require('../config/env');

let logger;

try {
  if (env.NODE_ENV === 'production') {
    logger = pino({ level: 'info' });
  } else if (env.NODE_ENV === 'test') {
    logger = pino({ level: 'silent' });
  } else {
    logger = pino({
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });
  }
} catch {
  logger = {
    info: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };
}

module.exports = logger;

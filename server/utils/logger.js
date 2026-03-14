const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
      const metaString = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : '';
      return `${timestamp} [${level.toUpperCase()}]: ${stack || message}${metaString}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Add colorized console transport in development only
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
          const metaString = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : '';
          return `${timestamp} ${level}: ${stack || message}${metaString}`;
        })
      )
    })
  );
}

module.exports = logger;

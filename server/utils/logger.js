const fs = require('fs');
const path = require('path');
const winston = require('winston');

// Always the server's own logs/ folder — never relative to whatever directory the process was started from.
const LOG_DIR = path.join(__dirname, '..', 'logs');
fs.mkdirSync(LOG_DIR, { recursive: true });

const isTest = process.env.NODE_ENV === 'test';
const line = ({ timestamp, level, message, stack, ...metadata }) => {
  const meta = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : '';
  return `${timestamp} ${level}: ${stack || message}${meta}`;
};

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  silent: isTest,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(line)
  ),
  transports: [
    new winston.transports.File({ filename: path.join(LOG_DIR, 'error.log'), level: 'error', maxsize: 5 * 1024 * 1024, maxFiles: 3 }),
    new winston.transports.File({ filename: path.join(LOG_DIR, 'combined.log'), maxsize: 5 * 1024 * 1024, maxFiles: 3 }),
    // the console is where a container or process manager collects logs; colour only helps a human at a terminal
    new winston.transports.Console({
      format: winston.format.combine(
        ...(process.env.NODE_ENV === 'production' ? [] : [winston.format.colorize()]),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(line)
      )
    })
  ]
});

module.exports = logger;

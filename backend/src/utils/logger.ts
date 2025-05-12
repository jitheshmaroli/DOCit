import winston from 'winston';
import path from 'path';
import fs from 'fs';

const { combine, timestamp, printf, colorize, errors } = winston.format;
const logsDir = path.join('logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Define custom log format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const metadataString = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : '';
  return `${timestamp} [${level}]: ${message} ${metadataString}`;
});

// Create logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({
          all: true,
          colors: {
            info: 'green',
            error: 'red',
            warn: 'yellow',
            debug: 'blue',
          },
        }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join('logs', 'app.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
    // File transport for error logs
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

export default logger;

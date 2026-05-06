const { v4: uuidv4 } = require('uuid');

const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      ...meta
    }));
  },
  error: (message, meta = {}) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      ...meta
    }));
  },
  Log: (stack, level, pkg, message) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: level || 'INFO',
      package: pkg,
      message,
      stack: stack || null
    }));
  }
};

const requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = uuidv4();

  req.requestId = requestId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: duration
    });
  });

  next();
};

module.exports = { logger, requestLogger };

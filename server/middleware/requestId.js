const crypto = require('crypto');

/** Tags every request with an id (honouring an incoming `X-Request-Id`) so a log line and a user's error report can be matched. */
const requestId = (req, res, next) => {
  const incoming = req.headers['x-request-id'];
  req.id = typeof incoming === 'string' && /^[\w-]{8,64}$/.test(incoming) ? incoming : crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
};

module.exports = requestId;

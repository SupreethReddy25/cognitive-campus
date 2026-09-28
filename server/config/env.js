/**
 * Environment configuration.
 *
 * One place that reads `process.env`, checks it, and hands the rest of the app typed, defaulted values. The server calls
 * `loadConfig()` before it opens a port, so a missing secret stops the boot with a clear message rather than surfacing later
 * as a confusing runtime error.
 *
 * @module config/env
 */

const REQUIRED = ['MONGO_URI', 'JWT_SECRET'];
const MIN_SECRET_LENGTH = 32;

const toBool = (value, fallback = false) => (value === undefined || value === '' ? fallback : String(value).toLowerCase() === 'true');
const toInt = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Validates the environment and returns the resolved configuration.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env] - The environment to read (injectable for tests)
 * @returns {Readonly<object>} Frozen config
 * @throws {Error} Listing every problem found, when required values are missing or unsafe
 */
function loadConfig(env = process.env) {
  const problems = [];
  REQUIRED.forEach((key) => { if (!env[key]) problems.push(`${key} is required`); });

  const nodeEnv = env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';

  if (env.JWT_SECRET && env.JWT_SECRET.length < MIN_SECRET_LENGTH) {
    const msg = `JWT_SECRET should be at least ${MIN_SECRET_LENGTH} characters`;
    if (isProd) problems.push(msg);
  }
  if (isProd && !env.CLIENT_URL) problems.push('CLIENT_URL is required in production (it is the only allowed CORS origin)');

  if (problems.length) {
    throw new Error(`Invalid environment configuration:\n  - ${problems.join('\n  - ')}`);
  }

  return Object.freeze({
    nodeEnv,
    isProd,
    port: toInt(env.PORT, 5000),
    mongoUri: env.MONGO_URI,
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN || '24h',
    /** `true` (reflect any origin) in development, the configured client URL in production. */
    corsOrigin: isProd ? env.CLIENT_URL : true,
    /** Dev convenience behind the Profile "Become admin" button. Off unless explicitly enabled outside production. */
    allowAdminBootstrap: !isProd && toBool(env.ALLOW_ADMIN_BOOTSTRAP, false)
  });
}

module.exports = { loadConfig };

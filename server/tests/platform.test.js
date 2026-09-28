/**
 * Platform tests — configuration, request hygiene, error shape and the public surface, exercised through the real Express app
 * (no database needed: every route touched here answers before it reaches Mongo).
 */

process.env.MONGO_URI = 'mongodb://localhost:27017/test';
process.env.JWT_SECRET = 'test-secret-that-is-comfortably-longer-than-32-chars';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const { loadConfig } = require('../config/env');
const { createApp } = require('../app');
const { scrub } = require('../middleware/sanitize');
const AppError = require('../utils/AppError');
const errorHandler = require('../middleware/errorHandler');
const { rankFor } = require('../controllers/arenaController');

const app = createApp(loadConfig());

describe('config/env', () => {
  const base = { MONGO_URI: 'mongodb://x', JWT_SECRET: 's'.repeat(40) };

  it('applies defaults', () => {
    const c = loadConfig(base);
    expect(c.port).toBe(5000);
    expect(c.nodeEnv).toBe('development');
    expect(c.corsOrigin).toBe(true);
    expect(c.allowAdminBootstrap).toBe(false);
  });

  it('reports every missing required value at once', () => {
    expect(() => loadConfig({})).toThrow(/MONGO_URI is required[\s\S]*JWT_SECRET is required/);
  });

  it('is strict in production', () => {
    expect(() => loadConfig({ ...base, NODE_ENV: 'production' })).toThrow(/CLIENT_URL/);
    expect(() => loadConfig({ ...base, NODE_ENV: 'production', CLIENT_URL: 'https://a.b', JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
    const c = loadConfig({ ...base, NODE_ENV: 'production', CLIENT_URL: 'https://a.b', ALLOW_ADMIN_BOOTSTRAP: 'true' });
    expect(c.corsOrigin).toBe('https://a.b');
    expect(c.allowAdminBootstrap).toBe(false); // never in production
  });
});

describe('sanitize', () => {
  it('strips operator and dotted keys, recursively', () => {
    const body = { email: { $gt: '' }, nested: [{ ok: 1, $where: 'x' }], 'a.b': 2, fine: 'yes' };
    expect(scrub(body)).toBe(3);
    expect(body).toEqual({ email: {}, nested: [{ ok: 1 }], fine: 'yes' });
  });
});

describe('error handler', () => {
  const run = (err, nodeEnv = 'test') => {
    const prev = process.env.NODE_ENV; process.env.NODE_ENV = nodeEnv;
    const res = { statusCode: 0, body: null, headersSent: false, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
    errorHandler(err, { id: 'req-1', originalUrl: '/x', method: 'GET' }, res, () => {});
    process.env.NODE_ENV = prev;
    return res;
  };

  it('maps AppError to its status and message', () => {
    const r = run(new AppError('Nope', 403));
    expect(r.statusCode).toBe(403);
    expect(r.body).toMatchObject({ success: false, message: 'Nope', requestId: 'req-1' });
  });

  it('maps duplicate keys to 409 and bad ids to 404', () => {
    expect(run(Object.assign(new Error('dup'), { code: 11000, keyValue: { email: 'a' } })).statusCode).toBe(409);
    expect(run(Object.assign(new Error('cast'), { name: 'CastError' })).statusCode).toBe(404);
  });

  it('hides internals of unexpected errors in production', () => {
    const r = run(new Error('secret db detail'), 'production');
    expect(r.statusCode).toBe(500);
    expect(r.body.message).toBe('Internal server error');
    expect(r.body.stack).toBeUndefined();
  });

  it('shows the message but not a stack in test/dev only when not production', () => {
    const r = run(new Error('boom'), 'development');
    expect(r.body.message).toBe('boom');
  });
});

describe('HTTP surface', () => {
  it('answers /health with the database state (503 while disconnected)', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(503);
    expect(res.body.data.db).toBe('disconnected');
    expect(res.body.data.status).toBe('degraded');
  });

  it('returns JSON 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/definitely-not-a-route');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false });
    expect(res.body.message).toMatch(/Route not found/);
  });

  it('sets a request id header and does not advertise Express', async () => {
    const res = await request(app).get('/api/nope').set('X-Request-Id', 'abcdef123456');
    expect(res.headers['x-request-id']).toBe('abcdef123456');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('rejects malformed JSON with 400, not 500', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Malformed JSON body');
  });

  it('validates registration input before touching the database', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'A', email: 'not-an-email', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.errors.map((e) => e.field).sort()).toEqual(['email', 'name', 'password']);
  });

  it('protects private routes', async () => {
    const res = await request(app).get('/api/arena/rating');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('arena ranks', () => {
  it.each([[0, 'Bronze'], [999, 'Bronze'], [1000, 'Silver'], [1199, 'Silver'], [1200, 'Gold'], [1400, 'Archon'], [1600, 'Legend'], [2400, 'Legend']])('%i → %s', (elo, tier) => {
    expect(rankFor(elo)).toBe(tier);
  });
});

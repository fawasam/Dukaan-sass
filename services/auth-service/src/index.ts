import { loadBaseConfig } from '@ecom/config';
import { createLogger } from '@ecom/logger';
import { connectDatabase, closeDatabase } from './models/database.js';
import { handleSignup, handleLogin, handleRefresh, handleLogout, handleMe } from './routes/auth.js';
import { cleanupExpiredTokens } from './models/refreshToken.js';

const config = loadBaseConfig('auth-service');
const logger = createLogger(config);

// Connect to database on startup
await connectDatabase(config);
logger.info('Connected to MongoDB');

// Cleanup expired tokens periodically (every hour)
setInterval(async () => {
  try {
    await cleanupExpiredTokens();
    logger.debug('Cleaned up expired refresh tokens');
  } catch (error) {
    logger.error('Error cleaning up expired tokens:', error);
  }
}, 60 * 60 * 1000);

const server = Bun.serve({
  port: config.port || 3001,
  async fetch(request: Request) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: config.serviceName }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Auth routes
    if (url.pathname === '/auth/signup' && request.method === 'POST') {
      return await handleSignup(request);
    }

    if (url.pathname === '/auth/login' && request.method === 'POST') {
      return await handleLogin(request);
    }

    if (url.pathname === '/auth/refresh' && request.method === 'POST') {
      return await handleRefresh(request);
    }

    if (url.pathname === '/auth/logout' && request.method === 'POST') {
      return await handleLogout(request);
    }

    if (url.pathname === '/auth/me' && request.method === 'GET') {
      return await handleMe(request);
    }

    return new Response('Not Found', { status: 404 });
  },
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down...');
  await closeDatabase();
  process.exit(0);
});

logger.info(`Auth Service running on http://localhost:${server.port}`);

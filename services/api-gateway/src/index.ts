import { loadBaseConfig } from '@ecom/config';
import { createLogger } from '@ecom/logger';

const config = loadBaseConfig('api-gateway');
const logger = createLogger(config);

const server = Bun.serve({
  port: config.port || 4000,
  fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: config.serviceName }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('API Gateway – Not Found', { status: 404 });
  },
});

logger.info(`API Gateway running on http://localhost:${server.port}`);

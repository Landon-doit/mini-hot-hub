import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { hot } from './routes/hot';

const app = new Hono();
const PORT = Number(process.env.PORT) || 3000;

// 每个请求打印路径到控制台
app.use('*', logger());

// CORS 白名单仅限认证类 API；公开热搜 API 放行 `*`
const AUTH_API_PREFIXES = ['/api/auth', '/api/user', '/api/recommend'] as const;
const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  ...(process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const isAuthApi = AUTH_API_PREFIXES.some((prefix) =>
        c.req.path.startsWith(prefix),
      );
      if (isAuthApi) {
        return ALLOWED_ORIGINS.has(origin) ? origin : undefined;
      }
      return '*';
    },
  }),
);

app.get('/api/health', (c) =>
  c.json({
    success: true,
    data: {
      overall: 'healthy',
      platforms: {},
      servedAt: new Date().toISOString(),
    },
    meta: {},
  }),
);

app.route('/api/hot', hot);

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
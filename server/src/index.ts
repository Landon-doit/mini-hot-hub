import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// --- 类型定义（对齐 TCD §3.1，与 client/src/types/hot.ts 保持同构） ---
type Platform = 'weibo' | 'zhihu' | 'bilibili' | 'douyin' | 'baidu' | 'toutiao';

interface HotValue {
  raw: number;
  display: string;
  normalized: number;
}

type HeatLevel = 'normal' | 'hot' | 'explosive';

interface HotItem {
  id: string;
  platform: Platform;
  rank: number;
  title: string;
  url: string;
  hotValue: HotValue;
  label: string | null;
  heatLevel: HeatLevel;
  categories: string[];
  primaryCategory: string | null;
  description?: string;
  imageUrl?: string;
  isMock: boolean;
  fetchedAt: string;
  updatedAt: string;
}

interface HotPlatform {
  platform: Platform;
  platformName: string;
  status: 'ok' | 'degraded';
  isMock: boolean;
  items: HotItem[];
  error: string | null;
}

// 统一 mock 源：读取前端共享的 hot.json，避免后端硬编码导致字段漂移。
// 相对本文件解析；dev（src/）与 build（dist/）下本文件均为 server 的下一级目录。
const MOCK_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../client/src/mock/hot.json',
);
const MOCK_PLATFORMS = JSON.parse(readFileSync(MOCK_PATH, 'utf8')) as HotPlatform[];

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

// 单平台热榜：对齐 TCD §5.2 的 /api/hot/{platform}，weibo 即 platform 值
app.get('/api/hot/weibo', (c) => {
  const weibo = MOCK_PLATFORMS.find((p) => p.platform === 'weibo');
  if (!weibo) {
    return c.json(
      {
        success: false,
        error: {
          code: 'HOT_UPSTREAM_FAILED',
          message: '微博热搜数据暂不可用',
          traceId: randomUUID(),
          retryable: true,
        },
      },
      502,
    );
  }
  return c.json({
    success: true,
    data: { weibo },
    meta: {
      source: 'mock',
      cacheHit: false,
      servedAt: new Date().toISOString(),
    },
  });
});

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import type { HotItem, HotPlatform, Platform, SearchResult } from '@shared/types';
import { ALL_PLATFORMS } from '@shared/constants';
import { fetchAllPlatforms } from './hot';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

type FetchAllPlatforms = (
  servedAt: string,
) => Promise<{ data: Record<Platform, HotPlatform>; anyLive: boolean }>;

function errorBody(code: string, message: string, retryable: boolean) {
  return {
    success: false,
    error: { code, message, traceId: randomUUID(), retryable },
  };
}

function parseLimit(raw: string | undefined): number | null {
  if (raw === undefined) return DEFAULT_LIMIT;
  const limit = Number(raw);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) return null;
  return limit;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function highlightTitle(title: string, query: string): string {
  const needle = query.toLowerCase();
  const lowerTitle = title.toLowerCase();
  let cursor = 0;
  let result = '';

  while (cursor < title.length) {
    const index = lowerTitle.indexOf(needle, cursor);
    if (index === -1) {
      result += escapeHtml(title.slice(cursor));
      break;
    }

    result += escapeHtml(title.slice(cursor, index));
    result += '<strong>' + escapeHtml(title.slice(index, index + query.length)) + '</strong>';
    cursor = index + query.length;
  }

  return result;
}

function itemCategory(item: HotItem): string | undefined {
  return item.primaryCategory ?? item.categories[0] ?? undefined;
}

function matchesCategory(item: HotItem, category: string): boolean {
  return item.primaryCategory === category || item.categories.includes(category);
}

function hasCategory(item: HotItem): boolean {
  return item.primaryCategory !== null || item.categories.length > 0;
}

export function createSearchRoute(fetchPlatforms: FetchAllPlatforms = fetchAllPlatforms) {
  const searchRoute = new Hono();

  searchRoute.get('/', async (c) => {
    const startedAt = performance.now();
    const servedAt = new Date().toISOString();
    const query = (c.req.query('q') ?? '').trim();
    const platform = c.req.query('platform')?.trim();
    const category = c.req.query('category')?.trim();
    const limit = parseLimit(c.req.query('limit'));

    if (query.length < 2 || query.length > 50) {
      return c.json(errorBody('INVALID_QUERY', 'q 必须为 2-50 个字符', false), 400);
    }
    if (limit === null) {
      return c.json(errorBody('INVALID_QUERY', 'limit 必须在 1-' + MAX_LIMIT + ' 之间', false), 400);
    }
    if (platform && !ALL_PLATFORMS.includes(platform as Platform)) {
      return c.json(errorBody('INVALID_QUERY', 'platform 参数无效', false), 400);
    }

    try {
      const { data } = await fetchPlatforms(servedAt);
      const normalizedQuery = query.toLowerCase();

      const matched = Object.values(data)
        .flatMap((hotPlatform) =>
          hotPlatform.items.map((item) => ({ hotPlatform, item })),
        )
        .filter(({ hotPlatform, item }) => {
          if (platform && hotPlatform.platform !== platform) return false;
          if (category && hasCategory(item) && !matchesCategory(item, category)) return false;
          return item.title.toLowerCase().includes(normalizedQuery);
        })
        .sort((a, b) => b.item.hotValue.raw - a.item.hotValue.raw);

      const items: SearchResult[] = matched.slice(0, limit).map(({ hotPlatform, item }) => ({
        id: item.id,
        title: highlightTitle(item.title, query),
        url: item.url,
        platform: hotPlatform.platform,
        platformName: hotPlatform.platformName,
        heat: item.hotValue.raw,
        category: itemCategory(item),
        isMock: item.isMock,
        score: item.hotValue.raw,
        updatedAt: item.updatedAt,
      }));

      return c.json({
        success: true,
        data: {
          items,
          total: matched.length,
        },
        meta: {
          source: 'server',
          searchTime: Math.round(performance.now() - startedAt),
          cacheHit: false,
          servedAt,
        },
      });
    } catch (err) {
      console.error('[search] 兜底搜索失败:', (err as Error).message);
      return c.json(
        errorBody('SYS_INTERNAL_ERROR', '搜索服务暂时不可用', true),
        500,
      );
    }
  });

  return searchRoute;
}

export const searchRoute = createSearchRoute();

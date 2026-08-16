import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import segmentit from 'segmentit';
import { MOCK_PLATFORMS } from '@shared/mock-data';
import type { ComprehensiveItem, HotItem, HotPlatform } from '@shared/types';
import { getCache, setCache } from '../utils/cache';
import { fetchWeiboHot, type WeiboRawItem } from '../services/weibo';

const { Segment, useDefault } = segmentit;
const segmenter = useDefault(new Segment());

const JACCARD_THRESHOLD = 0.85;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function errorBody(code: string, message: string, retryable: boolean) {
  return {
    success: false,
    error: { code, message, traceId: randomUUID(), retryable },
  };
}

// 分词 + 去标点 + 去停用词，返回词集合
function tokenize(title: string): Set<string> {
  const words = segmenter.doSegment(title, {
    simple: true,
    stripPunctuation: true,
    stripStopword: true,
  });
  return new Set(words.filter((w) => w.length > 0));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let intersection = 0;
  for (const w of a) {
    if (b.has(w)) intersection += 1;
  }
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

interface Cluster {
  items: HotItem[];
  tokens: Set<string>;
}

// 贪心聚类：与已有簇的并集词表 Jaccard ≥ 0.85 即合并
function cluster(items: HotItem[]): Cluster[] {
  const clusters: Cluster[] = [];
  for (const item of items) {
    const tokens = tokenize(item.title);
    const target = clusters.find(
      (c) => jaccard(c.tokens, tokens) >= JACCARD_THRESHOLD,
    );
    if (target) {
      target.items.push(item);
      for (const w of tokens) target.tokens.add(w);
    } else {
      clusters.push({ items: [item], tokens });
    }
  }
  return clusters;
}

function buildComprehensive(limit: number): ComprehensiveItem[] {
  const allItems = MOCK_PLATFORMS.flatMap((p) => p.items);
  const scored = cluster(allItems).map((c) => {
    const sorted = [...c.items].sort(
      (a, b) => b.hotValue.normalized - a.hotValue.normalized,
    );
    const top = sorted[0];
    const mergedFrom = [...new Set(c.items.map((i) => i.platform))];
    const platformCount = mergedFrom.length;
    const bonus = platformCount >= 3 ? 1.2 : platformCount >= 2 ? 1.1 : 1;

    const item: ComprehensiveItem = {
      id: `comp_${top.id}`,
      title: top.title,
      mergedFrom,
      platformCount,
      maxRank: Math.min(...c.items.map((i) => i.rank)),
      topHotValue: top.hotValue,
      label: platformCount >= 3 ? '爆' : platformCount >= 2 ? '热' : null,
      heatLevel:
        platformCount >= 3
          ? 'explosive'
          : platformCount >= 2
            ? 'hot'
            : 'normal',
      categories: [...new Set(c.items.flatMap((i) => i.categories))],
      primaryCategory: top.primaryCategory,
      url: top.url,
      isMock: top.isMock,
      updatedAt: top.updatedAt,
    };

    return { item, score: top.hotValue.normalized * bonus };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
}

// 热度格式化：>=1e4 → x.x万，否则原样字符串
function formatHeat(heat: number): string {
  return heat >= 1e4 ? (heat / 1e4).toFixed(1) + '万' : String(heat);
}

// 微博原始条目 → HotItem[]（归一化，maxHeat 归一化到 0-100）
function normalizeWeibo(raw: WeiboRawItem[], servedAt: string): HotItem[] {
  const maxHeat = Math.max(...raw.map((r) => r.heat)) || 1;
  return raw.map((r) => ({
    id: `wb_${r.rank}`,
    platform: 'weibo',
    rank: r.rank,
    title: r.title,
    url: r.url,
    hotValue: {
      raw: r.heat,
      display: formatHeat(r.heat),
      normalized: Math.round((r.heat / maxHeat) * 100),
    },
    label: r.rank <= 3 ? '爆' : r.rank <= 10 ? '热' : null,
    heatLevel: r.rank <= 3 ? 'explosive' : r.rank <= 10 ? 'hot' : 'normal',
    categories: [],
    primaryCategory: null,
    isMock: false,
    fetchedAt: servedAt,
    updatedAt: servedAt,
  }));
}

export const hot = new Hono();

// 聚合接口：一次返回六大平台（weibo 接真实数据，其余 mock）
hot.get('/aggregate', async (c) => {
  const refresh = c.req.query('refresh') === '1';
  const cacheKey = 'hot:aggregate';

  if (!refresh) {
    const cached = getCache<Record<string, HotPlatform>>(cacheKey);
    if (cached) {
      console.log('[cache hit]', cacheKey);
      return c.json({
        success: true,
        data: cached,
        meta: {
          source: 'mock',
          cacheHit: true,
          servedAt: new Date().toISOString(),
        },
      });
    }
  }

  const servedAt = new Date().toISOString();
  let weiboLive = false;

  const entries = await Promise.all(
    MOCK_PLATFORMS.map(async (p): Promise<[string, HotPlatform]> => {
      // 平台是 weibo：抓真实数据，失败回退 mock
      if (p.platform === 'weibo') {
        try {
          const raw = await fetchWeiboHot();
          const items = normalizeWeibo(raw, servedAt);
          weiboLive = true;
          return [
            'weibo',
            {
              platform: 'weibo',
              platformName: '微博',
              status: 'ok',
              isMock: false,
              items,
              error: null,
            },
          ];
        } catch (err) {
          console.error('[weibo] 聚合降级到 mock:', (err as Error).message);
          // 落到下方 mock 回退
        }
      }
      // 非 weibo，或 weibo 回退：用 mock 项并打戳
      return [
        p.platform,
        {
          ...p,
          items: p.items.map((item) => ({
            ...item,
            updatedAt: servedAt,
            fetchedAt: servedAt,
          })),
        },
      ];
    }),
  );

  const data = Object.fromEntries(entries);

  setCache(cacheKey, data);
  console.log('[cache miss]', cacheKey);
  return c.json({
    success: true,
    data,
    meta: {
      source: weiboLive ? 'mixed' : 'mock',
      cacheHit: false,
      servedAt,
    },
  });
});

// 跨平台综合热榜
hot.get('/comprehensive', (c) => {
  const limitParam = c.req.query('limit');
  let limit = DEFAULT_LIMIT;
  if (limitParam !== undefined) {
    const parsed = Number(limitParam);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
      return c.json(
        errorBody('INVALID_PARAM', `limit 必须在 1-${MAX_LIMIT} 之间`, false),
        400,
      );
    }
    limit = parsed;
  }

  const refresh = c.req.query('refresh') === '1';
  const cacheKey = `hot:comprehensive:${limit}`;

  if (!refresh) {
    const cached = getCache<ComprehensiveItem[]>(cacheKey);
    if (cached) {
      console.log('[cache hit]', cacheKey);
      return c.json({
        success: true,
        data: { items: cached },
        meta: {
          source: 'mock',
          cacheHit: true,
          servedAt: new Date().toISOString(),
        },
      });
    }
  }

  const servedAt = new Date().toISOString();
  const items = buildComprehensive(limit).map((it) => ({
    ...it,
    updatedAt: servedAt,
  }));
  setCache(cacheKey, items);
  console.log('[cache miss]', cacheKey);
  return c.json({
    success: true,
    data: { items },
    meta: {
      source: 'mock',
      cacheHit: false,
      servedAt,
    },
  });
});

// 微博真实热搜（替代 mock）
hot.get('/weibo', async (c) => {
  const refresh = c.req.query('refresh') === '1';
  const cacheKey = 'hot:weibo';
  if (!refresh) {
    const cached = getCache<HotPlatform>(cacheKey);
    if (cached) {
      console.log('[cache hit]', cacheKey);
      return c.json({
        success: true,
        data: { weibo: cached },
        meta: {
          source: 'live',
          cacheHit: true,
          servedAt: new Date().toISOString(),
        },
      });
    }
  }
  const servedAt = new Date().toISOString();
  try {
    const raw = await fetchWeiboHot();
    const items: HotItem[] = normalizeWeibo(raw, servedAt);
    const platform: HotPlatform = {
      platform: 'weibo',
      platformName: '微博',
      status: 'ok',
      isMock: false,
      items,
      error: null,
    };
    setCache(cacheKey, platform);
    console.log('[cache miss]', cacheKey);
    return c.json({
      success: true,
      data: { weibo: platform },
      meta: { source: 'live', cacheHit: false, servedAt },
    });
  } catch (err) {
    // 失败态：degraded + 空列表 + 友好文案；不写缓存，下次请求立即重试
    const msg = '微博热搜暂时获取失败，请稍后刷新';
    console.error('[weibo] 降级:', (err as Error).message);
    return c.json({
      success: true,
      data: {
        weibo: {
          platform: 'weibo',
          platformName: '微博',
          status: 'degraded',
          isMock: false,
          items: [],
          error: msg,
        },
      },
      meta: { source: 'live-fallback', cacheHit: false, servedAt },
    });
  }
});

// 单平台热榜
hot.get('/:platform', (c) => {
  const platform = c.req.param('platform');
  const refresh = c.req.query('refresh') === '1';
  const cacheKey = `hot:${platform}`;

  // 查缓存（refresh=1 强制跳过）
  if (!refresh) {
    const cached = getCache<HotPlatform>(cacheKey);
    if (cached) {
      console.log('[cache hit]', cacheKey);
      return c.json({
        success: true,
        data: { [platform]: cached },
        meta: {
          source: 'mock',
          cacheHit: true,
          servedAt: new Date().toISOString(),
        },
      });
    }
  }

  const match = MOCK_PLATFORMS.find((p) => p.platform === platform);
  if (!match) {
    return c.json(errorBody('NOT_FOUND', '平台不存在', false), 404);
  }

  // 命中 mock 后克隆并打戳、写缓存（refresh=1 也覆盖旧值，实现刷新）
  const servedAt = new Date().toISOString();
  const stamped: HotPlatform = {
    ...match,
    items: match.items.map((it) => ({
      ...it,
      updatedAt: servedAt,
      fetchedAt: servedAt,
    })),
  };
  setCache(cacheKey, stamped);
  console.log('[cache miss]', cacheKey);
  return c.json({
    success: true,
    data: { [match.platform]: stamped },
    meta: {
      source: 'mock',
      cacheHit: false,
      servedAt,
    },
  });
});
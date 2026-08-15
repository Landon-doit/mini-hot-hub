import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import segmentit from 'segmentit';
import { MOCK_PLATFORMS } from '@shared/mock-data';
import type { ComprehensiveItem, HotItem } from '@shared/types';

const { Segment, useDefault } = segmentit;
const segmenter = useDefault(new Segment());

const JACCARD_THRESHOLD = 0.85;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function mockMeta() {
  return {
    source: 'mock',
    cacheHit: false,
    servedAt: new Date().toISOString(),
  };
}

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

export const hot = new Hono();

// 聚合接口：一次返回六大平台
hot.get('/aggregate', (c) =>
  c.json({
    success: true,
    data: Object.fromEntries(MOCK_PLATFORMS.map((p) => [p.platform, p])),
    meta: mockMeta(),
  }),
);

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
  return c.json({
    success: true,
    data: { items: buildComprehensive(limit) },
    meta: mockMeta(),
  });
});

// 单平台热榜
hot.get('/:platform', (c) => {
  const platform = c.req.param('platform');
  const match = MOCK_PLATFORMS.find((p) => p.platform === platform);
  if (!match) {
    return c.json(errorBody('NOT_FOUND', '平台不存在', false), 404);
  }
  return c.json({
    success: true,
    data: { [match.platform]: match },
    meta: mockMeta(),
  });
});
import { strict as assert } from 'node:assert';
import { Hono } from 'hono';
import type { HotPlatform } from '@shared/types';
import { createSearchRoute } from './search';

const servedAt = '2026-08-21T00:00:00.000Z';
const platforms: Record<string, HotPlatform> = {
  weibo: {
    platform: 'weibo',
    platformName: '微博',
    status: 'ok',
    isMock: true,
    error: null,
    updatedAt: servedAt,
    items: [
      {
        id: 'wb-1',
        platform: 'weibo',
        rank: 1,
        title: '高考成绩查询通道开启',
        url: 'https://example.com/weibo',
        hotValue: { raw: 100, display: '100', normalized: 100 },
        label: null,
        heatLevel: 'explosive',
        categories: ['教育'],
        primaryCategory: '教育',
        isMock: true,
        fetchedAt: servedAt,
        updatedAt: servedAt,
      },
      {
        id: 'wb-2',
        platform: 'weibo',
        rank: 2,
        title: '高考志愿填报指南',
        url: 'https://example.com/weibo-2',
        hotValue: { raw: 90, display: '90', normalized: 90 },
        label: null,
        heatLevel: 'hot',
        categories: [],
        primaryCategory: null,
        isMock: true,
        fetchedAt: servedAt,
        updatedAt: servedAt,
      },
    ],
  },
};

const app = new Hono();
app.route('/api/search', createSearchRoute(async () => ({
  data: platforms as never,
  anyLive: false,
})));

const request = (path: string) => app.request(`http://localhost${path}`);

const validResponse = await request('/api/search?q=高考');
assert.equal(validResponse.status, 200);
const validBody = await validResponse.json() as any;
assert.equal(validBody.success, true);
assert.equal(validBody.data.total, 2);
assert.match(validBody.data.items[0].title, /<strong>高考<\/strong>/);
assert.equal(validBody.data.items[0].platform, 'weibo');

const categoryResponse = await request('/api/search?q=高考&category=tech');
assert.equal(categoryResponse.status, 200);
const categoryBody = await categoryResponse.json() as any;
assert.equal(categoryBody.data.total, 1);
assert.equal(categoryBody.data.items[0].id, 'wb-2');

const platformResponse = await request('/api/search?q=高考&platform=zhihu');
assert.equal(platformResponse.status, 200);
const platformBody = await platformResponse.json() as any;
assert.equal(platformBody.data.total, 0);

const invalidPlatformResponse = await request('/api/search?q=高考&platform=unknown');
assert.equal(invalidPlatformResponse.status, 400);
const invalidPlatformBody = await invalidPlatformResponse.json() as any;
assert.equal(invalidPlatformBody.error.code, 'INVALID_QUERY');

const invalidLimitResponse = await request('/api/search?q=高考&limit=51');
assert.equal(invalidLimitResponse.status, 400);
const invalidLimitBody = await invalidLimitResponse.json() as any;
assert.equal(invalidLimitBody.error.code, 'INVALID_QUERY');

const invalidResponse = await request('/api/search?q=a');
assert.equal(invalidResponse.status, 400);
const invalidBody = await invalidResponse.json() as any;
assert.equal(invalidBody.error.code, 'INVALID_QUERY');

const emptyResponse = await request('/api/search?q=不存在词');
assert.equal(emptyResponse.status, 200);
const emptyBody = await emptyResponse.json() as any;
assert.deepEqual(emptyBody.data.items, []);
assert.equal(emptyBody.data.total, 0);

console.log('search route tests passed');

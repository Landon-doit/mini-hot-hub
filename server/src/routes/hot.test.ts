import { strict as assert } from 'node:assert';
import type { Platform } from '@shared/types';
import { hot } from './hot';

const platforms: Platform[] = ['weibo', 'zhihu', 'baidu', 'toutiao', 'bilibili', 'douyin'];

function request(path: string) {
  return hot.request(`http://localhost${path}`);
}

delete process.env.MOCK_FAIL_ALL;
process.env.MOCK_FAIL_WEIBO = '1';

const singleAggregateResponse = await request('/aggregate?refresh=1');
assert.equal(singleAggregateResponse.status, 200);
const singleAggregateBody = await singleAggregateResponse.json() as any;
assert.equal(singleAggregateBody.success, true);
assert.equal(singleAggregateBody.data.weibo.status, 'error');
assert.equal(singleAggregateBody.data.weibo.isMock, false);
assert.deepEqual(singleAggregateBody.data.weibo.items, []);
assert.match(singleAggregateBody.data.weibo.error, /MOCK_FAIL_WEIBO=1/);
assert.notEqual(singleAggregateBody.data.zhihu.status, 'error');

const singlePlatformResponse = await request('/weibo');
assert.equal(singlePlatformResponse.status, 200);
const singlePlatformBody = await singlePlatformResponse.json() as any;
assert.equal(singlePlatformBody.success, true);
assert.equal(singlePlatformBody.data.weibo.status, 'error');
assert.equal(singlePlatformBody.meta.source, 'dev-failure');

delete process.env.MOCK_FAIL_WEIBO;
process.env.MOCK_FAIL_ALL = '1';

const allAggregateResponse = await request('/aggregate?refresh=1');
assert.equal(allAggregateResponse.status, 200);
const allAggregateBody = await allAggregateResponse.json() as any;
assert.equal(allAggregateBody.success, true);
for (const platform of platforms) {
  assert.equal(allAggregateBody.data[platform].status, 'error');
  assert.equal(allAggregateBody.data[platform].isMock, false);
  assert.deepEqual(allAggregateBody.data[platform].items, []);
}

delete process.env.MOCK_FAIL_ALL;

console.log('hot route failure simulation tests passed');

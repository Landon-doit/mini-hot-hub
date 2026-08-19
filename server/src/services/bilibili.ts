// B站热搜上游服务：用 Node 内置 fetch 抓取 JSON 接口，解析为原始条目。
// 本文件只做「抓取 + 解析 + 抛错」，不缓存（缓存在路由层）、不归一化成 HotItem（由路由层 normalizeBilibili 处理）。

export type BilibiliRawItem = {
  rank: number;
  title: string;
  heat: number;
  url: string;
};

const BILIBILI_HOT_URL =
  'https://api.bilibili.com/x/web-interface/search/square?limit=30';

// 两者缺一不可，否则返回风控 code:-412
const UA = 'Mozilla/5.0';

interface BilibiliUpstreamItem {
  keyword?: string; // 标题
  heat_score?: number; // 数字热度
  icon?: string; // 图标 url（可选）
  uri?: string; // 常空
}

export async function fetchBilibiliHot(): Promise<BilibiliRawItem[]> {
  let res: Response;
  let text = '';
  try {
    res = await fetch(BILIBILI_HOT_URL, {
      headers: {
        'User-Agent': UA,
        Referer: 'https://search.bilibili.com',
      },
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    // 网络 / 超时失败
    throw new Error('[bilibili] 请求热搜接口失败: ' + (e as Error).message);
  }

  // 响应非 2xx
  if (!res.ok) {
    throw new Error('[bilibili] 接口返回异常状态码: ' + res.status);
  }

  let body: unknown;
  try {
    text = await res.text();
    body = JSON.parse(text);
  } catch {
    // 非合法 JSON
    throw new Error('[bilibili] 响应解析 JSON 失败');
  }

  // 外层 code 校验（非 0 视为风控/业务失败）
  const code = (body as { code?: number })?.code;
  if (code !== 0) {
    throw new Error(
      '[bilibili] 接口返回业务错误码: ' +
        String(code) +
        '; sample=' +
        text.slice(0, 200),
    );
  }

  // 上游结构：data.trending.list[] 即热搜条目数组
  const list = (body as { data?: { trending?: { list?: unknown } } })?.data
    ?.trending?.list;
  if (!Array.isArray(list)) {
    const keys =
      body && typeof body === 'object'
        ? Object.keys(body as object).join(',')
        : 'none';
    throw new Error(
      '[bilibili] 接口结构异常: 未找到 data.trending.list 列表; keys=' +
        keys +
        '; sample=' +
        text.slice(0, 200),
    );
  }

  // 首条样本校验：缺 keyword 或 heat_score 视为结构异常
  if (list.length > 0) {
    const first = list[0] as BilibiliUpstreamItem;
    if (!first.keyword || first.heat_score === undefined) {
      throw new Error(
        '[bilibili] 接口结构异常: 首条缺 keyword/heat_score; sample=' +
          text.slice(0, 200),
      );
    }
  }

  const items: BilibiliRawItem[] = [];
  list.forEach((raw, index) => {
    const item = raw as BilibiliUpstreamItem;
    // title ← item.keyword；过滤缺失/空
    if (!item.keyword || String(item.keyword).trim() === '') return;
    const title = String(item.keyword);

    // rank ← 数组下标 + 1
    const rank = index + 1;
    // heat ← item.heat_score
    const heat = Number(item.heat_score);
    const safeHeat = Number.isFinite(heat) && heat > 0 ? heat : 0;
    // url ← 关键词构造搜索页（接口无直达链接）
    const url =
      'https://search.bilibili.com/all?keyword=' + encodeURIComponent(title);

    items.push({ rank, title, heat: safeHeat, url });
  });

  return items; // 解析后为空 → 返回 []（由路由层决定降级/空态处理）
}
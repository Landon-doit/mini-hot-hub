// 抖音热搜上游服务：用 Node 内置 fetch 抓取 JSON 接口，解析为原始条目。
// 本文件只做「抓取 + 解析 + 抛错」，不缓存（缓存在路由层）、不归一化成 HotItem（由路由层 normalizeDouyin 处理）。

export type DouyinRawItem = {
  rank: number;
  title: string;
  heat: number;
  url: string;
};

const DOUYIN_HOT_URL =
  'https://www.iesdouyin.com/web/api/v2/hotsearch/billboard/word/';

const UA = 'Mozilla/5.0';

interface DouyinUpstreamItem {
  word?: string; // 标题
  hot_value?: number; // 数字热度
  label?: number; // 数字标签（可忽略）
}

export async function fetchDouyinHot(): Promise<DouyinRawItem[]> {
  let res: Response;
  let text = '';
  try {
    res = await fetch(DOUYIN_HOT_URL, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    // 网络 / 超时失败
    throw new Error('[douyin] 请求热搜接口失败: ' + (e as Error).message);
  }

  // 响应非 2xx
  if (!res.ok) {
    throw new Error('[douyin] 接口返回异常状态码: ' + res.status);
  }

  let body: unknown;
  try {
    text = await res.text();
    body = JSON.parse(text);
  } catch {
    // 非合法 JSON
    throw new Error('[douyin] 响应解析 JSON 失败');
  }

  // status_code 校验（非 0 视为业务失败）
  const statusCode = (body as { status_code?: number })?.status_code;
  if (statusCode !== 0) {
    throw new Error(
      '[douyin] 接口返回业务错误码: ' +
        String(statusCode) +
        '; sample=' +
        text.slice(0, 200),
    );
  }

  // 上游结构：顶层 word_list[] 即热搜条目数组
  const list = (body as { word_list?: unknown })?.word_list;
  if (!Array.isArray(list)) {
    const keys =
      body && typeof body === 'object'
        ? Object.keys(body as object).join(',')
        : 'none';
    throw new Error(
      '[douyin] 接口结构异常: 未找到 word_list 数组; keys=' +
        keys +
        '; sample=' +
        text.slice(0, 200),
    );
  }

  // 首条样本校验：缺 word 或 hot_value 视为结构异常
  if (list.length > 0) {
    const first = list[0] as DouyinUpstreamItem;
    if (!first.word || first.hot_value === undefined) {
      throw new Error(
        '[douyin] 接口结构异常: 首条缺 word/hot_value; sample=' +
          text.slice(0, 200),
      );
    }
  }

  const items: DouyinRawItem[] = [];
  list.forEach((raw, index) => {
    const item = raw as DouyinUpstreamItem;
    // title ← item.word；过滤缺失/空
    if (!item.word || String(item.word).trim() === '') return;
    const title = String(item.word);

    // rank ← 数组下标 + 1
    const rank = index + 1;
    // heat ← item.hot_value
    const heat = Number(item.hot_value);
    const safeHeat = Number.isFinite(heat) && heat > 0 ? heat : 0;
    // url ← 关键词构造搜索页（接口无 url 字段）
    const url = 'https://www.douyin.com/search/' + encodeURIComponent(title);

    items.push({ rank, title, heat: safeHeat, url });
  });

  return items; // 解析后为空 → 返回 []（由路由层决定降级/空态处理）
}
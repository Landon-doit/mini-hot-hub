// 今日头条热榜上游服务：用 Node 内置 fetch 抓取 JSON 接口，解析为原始条目。
// 本文件只做「抓取 + 解析 + 抛错」，不缓存（缓存在路由层）、不归一化成 HotItem（由路由层 normalizeToutiao 处理）。

export type ToutiaoRawItem = {
  rank: number;
  title: string;
  heat: number;
  url: string;
};

const TOUTIAO_HOT_URL =
  'https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface ToutiaoUpstreamItem {
  Title?: string; // 标题
  HotValue?: string | number; // 热度（字符串数字，如 "53932830"）
  Url?: string; // 完整 https 链接
  ClusterId?: number | string; // 数字，作 id 源
}

export async function fetchToutiaoHot(): Promise<ToutiaoRawItem[]> {
  let res: Response;
  let text = '';
  try {
    res = await fetch(TOUTIAO_HOT_URL, {
      headers: {
        'User-Agent': UA,
        Referer: 'https://www.toutiao.com/',
      },
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    // 网络 / 超时失败
    throw new Error('[toutiao] 请求热搜接口失败: ' + (e as Error).message);
  }

  // 响应非 2xx
  if (!res.ok) {
    throw new Error('[toutiao] 接口返回异常状态码: ' + res.status);
  }

  let body: unknown;
  try {
    text = await res.text();
    body = JSON.parse(text);
  } catch {
    // 非合法 JSON
    throw new Error('[toutiao] 响应解析 JSON 失败');
  }

  // 上游结构：顶层 data[] 即热榜条目数组
  const list = (body as { data?: unknown })?.data;
  if (!Array.isArray(list)) {
    const keys =
      body && typeof body === 'object'
        ? Object.keys(body as object).join(',')
        : 'none';
    throw new Error(
      '[toutiao] 接口结构异常: 未找到 data 数组; status=' +
        res.status +
        '; keys=' +
        keys +
        '; sample=' +
        text.slice(0, 200),
    );
  }

  // 首条样本校验：缺 Title 或 HotValue 视为结构异常
  if (list.length > 0) {
    const first = list[0] as ToutiaoUpstreamItem;
    if (!first.Title || first.HotValue === undefined) {
      throw new Error(
        '[toutiao] 接口结构异常: 首条缺 Title/HotValue; sample=' +
          text.slice(0, 200),
      );
    }
  }

  const items: ToutiaoRawItem[] = [];
  list.forEach((raw, index) => {
    const item = raw as ToutiaoUpstreamItem;
    // title ← item.Title；过滤缺失/空
    if (!item.Title || String(item.Title).trim() === '') return;
    const title = String(item.Title);

    // rank ← 数组下标 + 1
    const rank = index + 1;
    // heat ← Number(item.HotValue)
    const heat = Number(item.HotValue);
    const safeHeat = Number.isFinite(heat) && heat > 0 ? heat : 0;
    // url ← item.Url（完整 https）；否则兜底头条搜索
    const url =
      typeof item.Url === 'string' && item.Url.trim() !== ''
        ? item.Url
        : 'https://so.toutiao.com/search?keyword=' + encodeURIComponent(title);

    items.push({ rank, title, heat: safeHeat, url });
  });

  return items; // 解析后为空 → 返回 []（由路由层决定降级/空态处理）
}
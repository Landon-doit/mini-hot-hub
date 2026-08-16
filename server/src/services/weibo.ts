// 微博热搜上游服务：用 Node 内置 fetch 抓取 JSON 接口，解析为原始条目。
// 本文件只做「抓取 + 解析 + 抛错」，不缓存（缓存在路由层）、不归一化成 HotItem（由路由层 normalizeWeibo 处理）。

export type WeiboRawItem = {
  rank: number;
  title: string;
  heat: number;
  url: string;
};

const WEIBO_HOT_URL = 'https://weibo.com/ajax/side/hotSearch';

// 移动端 UA（不带 UA 会被微博返回 418/空数据）
const UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';

interface WeiboUpstreamItem {
  word?: string;
  num?: number | string; // 热度：可能是数字，也可能是 "102万" 这类字符串
  is_ad?: boolean | number; // 广告标记：可能是 true 或 1
  url?: string; // 跳转链接：多为协议相对的 //s.weibo.com/...
}

// 热度解析：兼容数字与 "102万" / "1.2亿" 字符串
function parseHeat(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const m = raw.trim().match(/^([\d.]+)\s*(亿|万)?/);
    if (m) {
      const n = parseFloat(m[1]);
      if (m[2] === '亿') return Math.round(n * 1e8);
      if (m[2] === '万') return Math.round(n * 1e4);
      return Math.round(n);
    }
  }
  return 0;
}

// 链接归一：协议相对 //x → https://x；相对 /x → 补域名；否则拼搜索链接
function normalizeUrl(rawUrl: string | undefined, title: string): string {
  if (typeof rawUrl === 'string') {
    const u = rawUrl.trim();
    if (u.startsWith('http')) return u;
    if (u.startsWith('//')) return 'https:' + u;
    if (u.startsWith('/')) return 'https://s.weibo.com' + u;
  }
  return 'https://s.weibo.com/weibo?q=' + encodeURIComponent('#' + title);
}

export async function fetchWeiboHot(): Promise<WeiboRawItem[]> {
  let res: Response;
  let text = '';
  try {
    res = await fetch(WEIBO_HOT_URL, {
      headers: { 'User-Agent': UA, Referer: 'https://weibo.com/' },
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    // 网络 / 超时失败
    throw new Error('[weibo] 请求热搜接口失败: ' + (e as Error).message);
  }

  // 响应非 2xx
  if (!res.ok) {
    throw new Error('[weibo] 接口返回异常状态码: ' + res.status);
  }

  let body: unknown;
  try {
    text = await res.text();
    body = JSON.parse(text);
  } catch {
    // 非合法 JSON
    throw new Error('[weibo] 响应解析 JSON 失败');
  }

  // 上游结构：data.realtime[] 即普通热搜列表（注意：不是 data.data.realtime）
  const realtime = (body as { data?: { realtime?: unknown } })?.data?.realtime;
  if (!Array.isArray(realtime)) {
    // 结构异常时打印诊断信息，便于按 Step 3 定位
    const keys =
      body && typeof body === 'object'
        ? Object.keys(body as object).join(',')
        : 'none';
    throw new Error(
      '[weibo] 接口结构异常: 未找到 data.realtime 列表; status=' +
        res.status +
        '; keys=' +
        keys +
        '; sample=' +
        text.slice(0, 200),
    );
  }

  const items: WeiboRawItem[] = [];
  realtime.forEach((raw, index) => {
    const item = raw as WeiboUpstreamItem;
    // 过滤广告（is_ad 可能是 true 或 1）
    if (item.is_ad) return;
    // 过滤：word 缺失或为空
    if (!item.word || String(item.word).trim() === '') return;

    const title = String(item.word);
    const rank = index + 1; // rank ← 下标做稳定排名
    const heat = parseHeat(item.num); // heat ← item.num（兼容字符串）
    const url = normalizeUrl(item.url, title); // url ← item.url（归一）否则拼搜索链接

    items.push({ rank, title, heat, url });
  });

  return items; // 解析后为空 → 返回 []（由路由层决定降级/空态处理）
}

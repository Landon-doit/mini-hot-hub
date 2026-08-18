// 知乎热榜上游服务：用 Node 内置 fetch 抓取 JSON 接口，解析为原始条目。
// 本文件只做「抓取 + 解析 + 抛错」，不缓存（缓存在路由层）、不归一化成 HotItem（由路由层 normalizeZhihu 处理）。

export type ZhihuRawItem = {
  rank: number;
  title: string;
  heat: number;
  url: string;
};

const ZHIHU_HOT_URL =
  'https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=50&desktop=true';

// 知乎 Cookie（登录知乎后从浏览器 DevTools 拿整串；未设置则不加 Cookie，行为与原来一致）
const ZHIHU_COOKIE = process.env.ZHIHU_COOKIE ?? '';

// 桌面端 UA
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface ZhihuUpstreamItem {
  target?: {
    title?: string;
    url?: string;
  };
  detail_text?: string; // 形如 "1234 万热度" / "1.2 亿热度"
}

// 热度解析：数字直接返回；字符串用 /^([\d.]+)\s*(亿|万)?/ 提取，亿×1e8、万×1e4
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

// 链接归一：api.zhihu.com → www.zhihu.com；/questions/ → /question/；否则兜底
function normalizeUrl(rawUrl: string | undefined): string {
  if (typeof rawUrl === 'string' && rawUrl.trim() !== '') {
    let u = rawUrl.trim();
    if (u.includes('api.zhihu.com')) {
      u = u.replace('api.zhihu.com', 'www.zhihu.com');
    }
    if (u.includes('/questions/')) {
      u = u.replace('/questions/', '/question/');
    }
    if (u.startsWith('http')) return u;
    if (u.startsWith('//')) return 'https:' + u;
    if (u.startsWith('/')) return 'https://www.zhihu.com' + u;
  }
  return 'https://www.zhihu.com/hot';
}

export async function fetchZhihuHot(): Promise<ZhihuRawItem[]> {
  let res: Response;
  let text = '';
  try {
    res = await fetch(ZHIHU_HOT_URL, {
      headers: {
        'User-Agent': UA,
        Referer: 'https://www.zhihu.com/hot',
        Accept: 'application/json, text/plain, */*',
        ...(ZHIHU_COOKIE ? { Cookie: ZHIHU_COOKIE } : {}),
      },
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    // 网络 / 超时失败
    throw new Error('[zhihu] 请求热搜接口失败: ' + (e as Error).message);
  }

  // 响应非 2xx
  if (!res.ok) {
    throw new Error('[zhihu] 接口返回异常状态码: ' + res.status);
  }

  let body: unknown;
  try {
    text = await res.text();
    body = JSON.parse(text);
  } catch {
    // 非合法 JSON
    throw new Error('[zhihu] 响应解析 JSON 失败');
  }

  // 上游结构：顶层 data[] 即热榜条目数组（注意：不是 data.data）
  const list = (body as { data?: unknown })?.data;
  if (!Array.isArray(list)) {
    const keys =
      body && typeof body === 'object'
        ? Object.keys(body as object).join(',')
        : 'none';
    throw new Error(
      '[zhihu] 接口结构异常: 未找到 data 数组; status=' +
        res.status +
        '; keys=' +
        keys +
        '; sample=' +
        text.slice(0, 200),
    );
  }

  const items: ZhihuRawItem[] = [];
  list.forEach((raw, index) => {
    const item = raw as ZhihuUpstreamItem;
    // title ← target.title
    const title = item.target?.title;
    // 过滤：target.title 缺失或为空
    if (!title || String(title).trim() === '') return;

    const rank = index + 1; // rank ← 下标做稳定排名
    const heat = parseHeat(item.detail_text); // heat ← detail_text
    const url = normalizeUrl(item.target?.url); // url ← target.url（归一）

    items.push({ rank, title: String(title), heat, url });
  });

  return items; // 解析后为空 → 返回 []（由路由层决定降级/空态处理）
}
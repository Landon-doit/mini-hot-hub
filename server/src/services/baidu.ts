// 百度热搜上游服务：用 Node 内置 fetch 抓取 JSON 接口，解析为原始条目。
// 本文件只做「抓取 + 解析 + 抛错」，不缓存（缓存在路由层）、不归一化成 HotItem（由路由层 normalizeBaidu 处理）。

export type BaiduRawItem = {
  rank: number;
  title: string;
  heat: number;
  url: string;
};

const BAIDU_HOT_URL =
  'https://top.baidu.com/api/board?platform=wise&tab=realtime';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface BaiduUpstreamItem {
  word?: string; // 热搜词
  url?: string; // 跳转链接
  index?: number | string; // 排名
  hotScore?: number | string; // 热度数（数字或数字字符串）
  desc?: string; // 描述文本（备用）
}

export async function fetchBaiduHot(): Promise<BaiduRawItem[]> {
  let res: Response;
  let text = '';
  try {
    res = await fetch(BAIDU_HOT_URL, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    // 网络 / 超时失败
    throw new Error('[baidu] 请求热搜接口失败: ' + (e as Error).message);
  }

  // 响应非 2xx
  if (!res.ok) {
    throw new Error('[baidu] 接口返回异常状态码: ' + res.status);
  }

  let body: unknown;
  try {
    text = await res.text();
    body = JSON.parse(text);
  } catch {
    // 非合法 JSON
    throw new Error('[baidu] 响应解析 JSON 失败');
  }

  // 上游结构：data.cards[0].content[0].content[] 即热搜条目数组（嵌套两层 content）
  const cards = (body as { data?: { cards?: unknown } })?.data?.cards;
  const outerContent = Array.isArray(cards)
    ? (cards[0] as { content?: unknown })?.content
    : undefined;
  const list = Array.isArray(outerContent)
    ? (outerContent[0] as { content?: unknown })?.content
    : undefined;

  if (!Array.isArray(list)) {
    const keys =
      body && typeof body === 'object'
        ? Object.keys(body as object).join(',')
        : 'none';
    throw new Error(
      '[baidu] 接口结构异常: 未找到 data.cards[0].content[0].content 列表; status=' +
        res.status +
        '; keys=' +
        keys +
        '; sample=' +
        text.slice(0, 200),
    );
  }

  const items: BaiduRawItem[] = [];
  const total = list.length;

  list.forEach((raw, index) => {
    const item = raw as BaiduUpstreamItem;
    // title ← item.word（热搜词）；过滤缺失/空
    if (!item.word || String(item.word).trim() === '') return;
    const title = String(item.word);

    // rank ← item.index（若为正）；否则数组下标+1 做稳定排名
    const parsedIndex = Number(item.index);
    const rank =
      Number.isFinite(parsedIndex) && parsedIndex > 0 ? parsedIndex : index + 1;

    // heat ← item.hotScore（转 number）；缺失/NaN 按排名递减给相对值
    const hotScore = Number(item.hotScore);
    const heat =
      Number.isFinite(hotScore) && hotScore > 0
        ? hotScore
        : Math.max(1, total - index);

    // url ← item.url（归一）；否则兜底百度搜索
    let url = 'https://www.baidu.com/s?wd=' + encodeURIComponent(title);
    if (typeof item.url === 'string' && item.url.trim() !== '') {
      const u = item.url.trim();
      if (u.startsWith('http')) url = u;
      else if (u.startsWith('//')) url = 'https:' + u;
    }

    items.push({ rank, title, heat, url });
  });

  return items; // 解析后为空 → 返回 []（由路由层决定降级/空态处理）
}
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

// 将 ISO 时间格式化为「更新于 MM-DD HH:mm」（zh-CN）
export function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '更新于 --';
  }
  const parts = dateFormatter.formatToParts(date);
  const get = (type: 'month' | 'day' | 'hour' | 'minute') =>
    parts.find((p) => p.type === type)?.value ?? '--';
  return `更新于 ${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`;
}

// 取 items 中最新的 updatedAt（ISO），空数组或全部无效时返回空串
export function latestUpdatedAt(
  items: ReadonlyArray<{ updatedAt: string }>,
): string {
  let latest: number | null = null;
  for (const item of items) {
    const ms = Date.parse(item.updatedAt);
    if (!Number.isNaN(ms) && (latest === null || ms > latest)) {
      latest = ms;
    }
  }
  return latest === null ? '' : new Date(latest).toISOString();
}
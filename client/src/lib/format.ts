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

// 将 ISO 时间格式化为相对时间（刚刚 / x分钟前 / x小时前 / x天前），超过 30 天回退绝对时间
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return formatUpdatedAt(iso);
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
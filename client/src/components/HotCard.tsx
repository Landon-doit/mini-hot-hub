import type { HotPlatform } from '../types/hot';

interface HotCardProps {
  platform: HotPlatform;
}

function HotCard({ platform }: HotCardProps) {
  return (
    <article className="hot-card">
      <header className="hot-card__header">
        <h2>{platform.platformName}</h2>
        {platform.status === 'degraded' && (
          <span className="hot-card__badge">示例数据</span>
        )}
      </header>
      <ol className="hot-card__list">
        {platform.items.map((item) => (
          <li key={item.id} className="hot-card__item">
            <span
              className={
                item.rank <= 3
                  ? 'hot-card__rank hot-card__rank--top'
                  : 'hot-card__rank'
              }
            >
              {item.rank}
            </span>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="hot-card__title"
            >
              {item.title}
            </a>
            {item.label && <span className="hot-card__label">{item.label}</span>}
          </li>
        ))}
      </ol>
    </article>
  );
}

export default HotCard;
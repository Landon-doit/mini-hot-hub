import { QUOTES } from '../lib/quotes';

function DailyQuote() {
  const index = new Date().getDate() % QUOTES.length;
  // 越界容错：理论上 % length 不会越界，此处兜底取第 0 条
  const quote = QUOTES[index] ?? QUOTES[0];

  return (
    <p className="m-0 truncate px-6 py-3 text-center text-sm text-accent">
      {quote}
    </p>
  );
}

export default DailyQuote;
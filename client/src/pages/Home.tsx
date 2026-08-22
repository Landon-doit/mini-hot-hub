import { useState } from 'react';
import ParticleBg from '../components/ParticleBg';
import TopNav from '../components/TopNav';
import DailyQuote from '../components/DailyQuote';
import RecommendZone from '../components/RecommendZone';
import ComprehensiveBoard from '../components/ComprehensiveBoard';
import HotCard from '../components/HotCard';
import ErrorBoundary from '../components/ErrorBoundary';
import SiteFooter from '../components/SiteFooter';
import { fetchHotPlatform } from '../api/hot';
import { useHotAggregate } from '../hooks/useHotAggregate';
import type { HotPlatform, Platform } from '../types/hot';

const CARD_SHELL = 'snap-center shrink-0 w-[82%] md:w-auto md:shrink';

function Home() {
  const { data, cacheHit, loading, fetching, refetch } = useHotAggregate();
  const [overrides, setOverrides] = useState<Record<string, HotPlatform>>({});
  const [retrying, setRetrying] = useState<Set<string>>(new Set());
  const platforms = data ?? [];

  const retryPlatform = async (platform: Platform) => {
    setRetrying((current) => new Set(current).add(platform));
    try {
      const next = await fetchHotPlatform(platform);
      setOverrides((current) => ({ ...current, [platform]: next }));
    } finally {
      setRetrying((current) => {
        const next = new Set(current);
        next.delete(platform);
        return next;
      });
    }
  };

  const handleRefresh = () => {
    setOverrides({});
    void refetch();
  };

  return (
    <>
      {/* ① 动态背景：固定层 z-index -1 */}
      <ParticleBg />

      {/* ② 顶部导航 */}
      <TopNav refetch={handleRefresh} loading={fetching} />

      {/* ③ 每日一句 */}
      <DailyQuote />

      <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-6 pb-6">
        <p className="m-0 text-sm text-gray-500 dark:text-gray-400">
          聚合微博、知乎、B站、抖音、百度、今日头条六大平台热搜，一屏速览全网热点
        </p>

        {/* ④ 个性化推荐区（游客引导卡） */}
        <ErrorBoundary message="推荐暂不可用">
          <RecommendZone />
        </ErrorBoundary>

        {/* ⑤ 跨平台综合热榜（组件内已含局部 ErrorBoundary 与数据拉取） */}
        <ComprehensiveBoard />

        {/* ⑥ 平台卡片网格：桌面 3 列，移动端横向滑动 */}
        <section className="flex items-start gap-4 overflow-x-auto pb-2 snap-x scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:items-stretch md:overflow-visible md:snap-none">
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={CARD_SHELL}>
                  <HotCard loading />
                </div>
              ))
            : platforms.map((platform) => {
                const card = overrides[platform.platform] ?? platform;
                return (
                  <div key={platform.platform} className={CARD_SHELL}>
                    <ErrorBoundary>
                      <HotCard
                        data={card}
                        cacheHit={cacheHit}
                        previewCount={5}
                        loading={retrying.has(card.platform)}
                        onRetry={() => void retryPlatform(card.platform)}
                      />
                    </ErrorBoundary>
                  </div>
                );
              })}
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

export default Home;

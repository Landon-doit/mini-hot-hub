import ParticleBg from '../components/ParticleBg';
import TopNav from '../components/TopNav';
import DailyQuote from '../components/DailyQuote';
import RecommendZone from '../components/RecommendZone';
import ComprehensiveBoard from '../components/ComprehensiveBoard';
import HotCard from '../components/HotCard';
import ErrorBoundary from '../components/ErrorBoundary';
import { useHotAggregate } from '../hooks/useHotAggregate';
import { BRAND } from '../constants/brand';

const CARD_SHELL = 'snap-center shrink-0 w-[82%] md:w-auto md:shrink';

function Home() {
  const { data, cacheHit, loading, fetching, refetch } = useHotAggregate();
  const platforms = data ?? [];

  return (
    <>
      {/* ① 动态背景：固定层 z-index -1 */}
      <ParticleBg />

      {/* ② 顶部导航 */}
      <TopNav refetch={refetch} loading={fetching} />

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
            : platforms.map((platform) => (
                <div key={platform.platform} className={CARD_SHELL}>
                  <ErrorBoundary>
                    <HotCard data={platform} cacheHit={cacheHit} previewCount={5} />
                  </ErrorBoundary>
                </div>
              ))}
        </section>
      </main>

      {/* ⑦ 页脚 */}
      <footer className="mt-8 border-t border-gray-200 pt-4 text-center text-xs leading-6 text-gray-400 dark:border-gray-800 dark:text-gray-500">
        <p className="m-0">{BRAND.name} {BRAND.nameEn} © 2026 | 学习项目，非商用</p>
        <p className="m-0">数据来源：微博 · 知乎 · B站 · 抖音 · 百度 · 今日头条</p>
        <p className="m-0">数据仅供参考，版权归原作者所有</p>
      </footer>
    </>
  );
}

export default Home;
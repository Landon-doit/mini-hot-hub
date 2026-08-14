import HotCard from '../components/HotCard';
import ErrorBoundary from '../components/ErrorBoundary';
import { useHotList } from '../hooks/useHotList';

const CARD_SHELL = 'snap-center shrink-0 w-[82%] md:w-auto md:shrink';

function Home() {
  const { loading, error, data, refetch } = useHotList();

  return (
    <div className="mx-auto max-w-[1200px] p-6">
      <header className="mb-6">
        <h1 className="m-0 text-2xl font-bold text-brand">迷你今日热榜</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          聚合微博、知乎、B站、抖音、百度、今日头条六大平台热搜，一屏速览全网热点
        </p>
      </header>

      {error ? (
        <main className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-24 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="m-0 text-sm text-gray-500 dark:text-gray-400">
            该内容暂时无法加载
          </p>
          <button
            type="button"
            onClick={refetch}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            点击重试
          </button>
        </main>
      ) : (
        <main className="flex items-start gap-4 overflow-x-auto pb-2 snap-x scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:items-stretch md:overflow-visible md:snap-none">
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={CARD_SHELL}>
                  <HotCard loading />
                </div>
              ))
            : (data ?? []).map((platform) => (
                <div key={platform.platform} className={CARD_SHELL}>
                  <ErrorBoundary>
                    <HotCard data={platform} loading={false} error={null} />
                  </ErrorBoundary>
                </div>
              ))}
        </main>
      )}

      {/* 页脚占位链接：上线前替换为真实 GitHub / 邮箱 / 隐私政策 / 用户协议地址 */}
      <footer className="mt-8 border-t border-gray-200 pt-4 text-center text-xs leading-6 text-gray-400 dark:border-gray-800 dark:text-gray-500">
        <p className="m-0">今日热搜 © 2026 | 个人作品集项目</p>
        <p className="m-0">数据来源：微博 · 知乎 · B站 · 抖音 · 百度 · 今日头条</p>
        <p className="m-0">数据仅供参考，版权归原作者所有</p>
        <p className="m-0">
          GitHub:{' '}
          <a
            href="#"
            className="text-gray-500 hover:text-brand-dark dark:text-gray-400 dark:hover:text-brand"
          >
            github.com/xxx/hot-search-aggregator
          </a>
        </p>
        <p className="m-0">
          联系方式：{' '}
          <a
            href="#"
            className="text-gray-500 hover:text-brand-dark dark:text-gray-400 dark:hover:text-brand"
          >
            contact@example.com
          </a>
        </p>
        <p className="m-0">
          <a
            href="#"
            className="text-gray-500 hover:text-brand-dark dark:text-gray-400 dark:hover:text-brand"
          >
            隐私政策
          </a>
          {' / '}
          <a
            href="#"
            className="text-gray-500 hover:text-brand-dark dark:text-gray-400 dark:hover:text-brand"
          >
            用户协议
          </a>
        </p>
      </footer>
    </div>
  );
}

export default Home;
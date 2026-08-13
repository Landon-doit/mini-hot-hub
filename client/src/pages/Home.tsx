import type { HotPlatform } from '../types/hot';
import hotMock from '../mock/hot.json';
import HotCard from '../components/HotCard';
import ErrorBoundary from '../components/ErrorBoundary';

const platforms = hotMock as HotPlatform[];

function Home() {
  return (
    <div className="mx-auto max-w-[1200px] p-6">
      <header className="mb-6">
        <h1 className="m-0 text-2xl font-bold text-brand">迷你今日热榜</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          聚合微博、知乎、B站、抖音、百度、今日头条六大平台热搜，一屏速览全网热点
        </p>
      </header>

      <main className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {platforms.map((platform) => (
          <ErrorBoundary key={platform.platform}>
            <HotCard platform={platform} />
          </ErrorBoundary>
        ))}
      </main>

      <footer className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
        学习演示项目，数据来自各平台公开榜单，仅供学习交流，非商用
      </footer>
    </div>
  );
}

export default Home;
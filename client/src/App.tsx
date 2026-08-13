import type { HotPlatform } from './types/hot';
import hotMock from './mock/hot.json';
import HotCard from './components/HotCard';

const platforms = hotMock as HotPlatform[];

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>今日热搜</h1>
        <p>多平台热点聚合浏览 · 示例数据</p>
      </header>
      <main className="platform-grid">
        {platforms.map((platform) => (
          <HotCard key={platform.platform} platform={platform} />
        ))}
      </main>
    </div>
  );
}

export default App;
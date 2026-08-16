import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PlatformDetail from './pages/PlatformDetail';
import { themeAtom, applyTheme } from './store/theme';

function App() {
  const theme = useAtomValue(themeAtom);

  useEffect(() => {
    applyTheme(theme);

    // system 模式下跟随系统主题变化
    if (theme !== 'system') return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/platform/:platform" element={<PlatformDetail />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
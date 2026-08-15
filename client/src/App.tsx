import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import Home from './pages/Home';
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

  return <Home />;
}

export default App;
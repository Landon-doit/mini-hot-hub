import { useEffect, useMemo, useState } from 'react';
import { Particles, ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { ISourceOptions } from '@tsparticles/engine';

const DESKTOP_MQ = '(min-width: 768px)';
const REDUCED_MOTION_MQ = '(prefers-reduced-motion: reduce)';
const DEFAULT_PARTICLES = 80;
const MAX_PARTICLES = 120;
const LOW_CORE_PARTICLES = 60;
const FPS_HALVE_THRESHOLD = 50;
const FPS_RESTORE_THRESHOLD = 55;
const FPS_DISABLE_THRESHOLD = 24;
const LOW_BATTERY_LEVEL = 0.2;

const DARK_GRADIENT =
  'linear-gradient(160deg, #1a1a2e 0%, #16213e 60%, #0d1226 100%)';

interface BatteryManager {
  charging: boolean;
  level: number;
  addEventListener(
    type: 'levelchange' | 'chargingchange',
    listener: () => void,
  ): void;
  removeEventListener(
    type: 'levelchange' | 'chargingchange',
    listener: () => void,
  ): void;
}

type BatteryNavigator = Navigator & {
  getBattery?: () => Promise<BatteryManager>;
};

// 按逻辑核数分档：默认 80，多核上调至上限 120，少核下调
function countForCores(cores: number): number {
  if (cores >= 8) return MAX_PARTICLES;
  if (cores <= 2) return LOW_CORE_PARTICLES;
  return DEFAULT_PARTICLES;
}

function buildOptions(count: number): ISourceOptions {
  return {
    fullScreen: { enable: false },
    detectRetina: true,
    fpsLimit: 60,
    particles: {
      number: { value: count, density: { enable: true } },
      color: { value: '#ff6b35' },
      links: {
        enable: true,
        distance: 150,
        color: '#ff6b35',
        opacity: 0.4,
        width: 1,
      },
      move: { enable: true, speed: 1.2 },
      size: { value: { min: 1, max: 3 } },
      opacity: { value: 0.5 },
    },
  };
}

function ParticleBg() {
  const [baseCount, setBaseCount] = useState(DEFAULT_PARTICLES);
  const [halved, setHalved] = useState(false);
  const [enabled, setEnabled] = useState(false);

  // 门控：桌面 + 非减少动效 + 非低电量；按 hardwareConcurrency 定基础粒子数
  useEffect(() => {
    const desktopMq = window.matchMedia(DESKTOP_MQ);
    const reducedMq = window.matchMedia(REDUCED_MOTION_MQ);

    const cores = navigator.hardwareConcurrency;
    if (typeof cores === 'number' && cores > 0) {
      setBaseCount(countForCores(cores));
    }

    let lowBattery = false;
    let battery: BatteryManager | null = null;

    const recompute = () => {
      setEnabled(desktopMq.matches && !reducedMq.matches && !lowBattery);
    };

    const applyBattery = () => {
      lowBattery =
        battery !== null && !battery.charging && battery.level <= LOW_BATTERY_LEVEL;
      recompute();
    };

    recompute();
    desktopMq.addEventListener('change', recompute);
    reducedMq.addEventListener('change', recompute);

    (navigator as BatteryNavigator)
      .getBattery?.()
      .then((b) => {
        battery = b;
        applyBattery();
        b.addEventListener('levelchange', applyBattery);
        b.addEventListener('chargingchange', applyBattery);
      })
      .catch(() => {
        // 电池 API 不可用/拒绝：不视为低电量
      });

    return () => {
      desktopMq.removeEventListener('change', recompute);
      reducedMq.removeEventListener('change', recompute);
      if (battery) {
        battery.removeEventListener('levelchange', applyBattery);
        battery.removeEventListener('chargingchange', applyBattery);
      }
    };
  }, []);

  // 实时帧率：<50fps 减半（带迟滞恢复），<24fps 禁用；页面隐藏时跳过采样
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let frames = 0;
    let start = performance.now();

    const reset = () => {
      frames = 0;
      start = performance.now();
    };

    const onVisibility = () => {
      if (!document.hidden) reset();
    };

    const tick = () => {
      if (document.hidden) {
        raf = requestAnimationFrame(tick);
        return;
      }
      frames += 1;
      const now = performance.now();
      const elapsed = now - start;
      if (elapsed >= 1000) {
        const fps = (frames * 1000) / elapsed;
        if (fps < FPS_DISABLE_THRESHOLD) {
          setEnabled(false);
          return;
        }
        setHalved((prev) => {
          if (fps < FPS_HALVE_THRESHOLD) return true;
          if (fps >= FPS_RESTORE_THRESHOLD) return false;
          return prev;
        });
        reset();
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled]);

  const count = halved ? Math.max(30, Math.floor(baseCount / 2)) : baseCount;
  const options = useMemo(() => buildOptions(count), [count]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: -1, background: DARK_GRADIENT }}
    >
      {enabled && (
        <ParticlesProvider init={loadSlim}>
          <Particles id="particle-bg" className="h-full w-full" options={options} />
        </ParticlesProvider>
      )}
    </div>
  );
}

export default ParticleBg;
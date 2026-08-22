import { Link, useParams } from 'react-router-dom';
import HotCard from '../components/HotCard';
import SiteFooter from '../components/SiteFooter';
import { usePlatformDetail } from '../hooks/usePlatformDetail';
import { ALL_PLATFORMS, PLATFORM_NAMES } from '@shared/constants';
import type { Platform } from '../types/hot';

function PlatformDetail() {
  const { platform } = useParams<{ platform: string }>();
  const valid = ALL_PLATFORMS.includes(platform as Platform)
    ? (platform as Platform)
    : null;

  if (!valid) {
    return (
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <p className="m-0 text-sm text-gray-500 dark:text-gray-400">未找到该平台</p>
        <Link
          to="/"
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          返回首页
        </Link>
      </div>
    );
  }

  return <PlatformDetailContent platform={valid} />;
}

function PlatformDetailContent({ platform }: { platform: Platform }) {
  const { data, isLoading, error, refetch } = usePlatformDetail(platform);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="m-0 text-2xl font-bold text-brand">
          {PLATFORM_NAMES[platform]}
        </h1>
        <Link to="/" className="text-sm text-brand-dark hover:text-brand">
          返回首页
        </Link>
      </header>

      {isLoading ? (
        <HotCard loading />
      ) : error ? (
        <HotCard
          error={error instanceof Error ? error.message : '加载失败'}
          onRetry={() => void refetch()}
        />
      ) : data ? (
        <HotCard data={data} onRetry={() => void refetch()} />
      ) : (
        <HotCard error="该内容暂时无法加载" onRetry={() => void refetch()} />
      )}
      <SiteFooter />
    </div>
  );
}

export default PlatformDetail;

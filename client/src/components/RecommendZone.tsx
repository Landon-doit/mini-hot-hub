import { useAtomValue } from 'jotai';
import { authAtom } from '../store/auth';

function GuestGuide() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
      <p className="m-0 text-sm text-muted">登录后获取个性化推荐</p>
      <button
        type="button"
        className="inline-flex min-h-[44px] items-center rounded-md border border-brand px-4 text-sm font-medium text-brand transition-colors hover:bg-brand/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        登录
      </button>
    </div>
  );
}

function RecommendZone() {
  const auth = useAtomValue(authAtom);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="m-0 mb-3 text-xl font-semibold text-foreground">
        个性化推荐
      </h2>

      {auth === 'authenticated' ? (
        <p className="m-0 py-6 text-center text-sm text-muted">
          推荐内容即将上线
        </p>
      ) : (
        <GuestGuide />
      )}
    </section>
  );
}

export default RecommendZone;
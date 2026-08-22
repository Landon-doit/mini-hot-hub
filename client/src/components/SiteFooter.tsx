import { BRAND } from '../constants/brand';
import { CACHE_TTL_SECONDS, CONTACT_EMAIL } from '@shared/constants';

function SiteFooter() {
  const refreshMinutes = CACHE_TTL_SECONDS / 60;

  return (
    <footer className="mt-8 border-t border-gray-200 px-6 py-4 text-center text-xs leading-6 dark:border-gray-800">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-1">
        <p className="m-0 text-gray-400 dark:text-gray-500">
          {BRAND.name} {BRAND.nameEn}：本站为个人学习项目，非商业用途。
        </p>
        <p className="m-0 text-[#D4520A]">
          数据来源于各平台公开信息，非官方发布，仅供参考。
        </p>
        <p className="m-0 text-[#D4520A]">
          数据更新频率约 {refreshMinutes} 分钟（与后端缓存 TTL 一致）。
        </p>
        <p className="m-0 break-words text-[#D4520A]">
          如有侵权或违规内容，请联系：{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline underline-offset-2 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {CONTACT_EMAIL}
          </a>
          。
        </p>
      </div>
    </footer>
  );
}

export default SiteFooter;

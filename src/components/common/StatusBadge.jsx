import { RIDE_STATUSES } from '../../data/mockData';
import { useLanguage } from '../../context/LanguageContext';

export default function StatusBadge({ status }) {
  const { t } = useLanguage();
  const info = RIDE_STATUSES.find(s => s.value === status);
  if (!info) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${info.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {t(`status.${status}`)}
    </span>
  );
}

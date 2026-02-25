import { useDriver } from '../context/DriverContext';

const TABS = [
  { key: 'home',      icon: '🏠', labelKey: 'nav.home' },
  { key: 'checklist', icon: '✅', labelKey: 'nav.checklist' },
  { key: 'documents', icon: '📄', labelKey: 'nav.documents' },
];

export default function BottomNav({ active, onChange }) {
  const { t } = useDriver();

  return (
    <nav className="da-bottom-nav">
      {TABS.map(tab => (
        <button
          key={tab.key}
          className={`da-nav-item ${active === tab.key ? 'da-nav-item-active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          <span className="da-nav-icon">{tab.icon}</span>
          <span className="da-nav-label">{t(tab.labelKey)}</span>
          {active === tab.key && <span className="da-nav-indicator" />}
        </button>
      ))}
    </nav>
  );
}

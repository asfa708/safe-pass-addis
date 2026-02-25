import { useState } from 'react';
import { useDriver } from '../context/DriverContext';

const CHECKLIST_KEYS = [
  'checklist.item1',
  'checklist.item2',
  'checklist.item3',
  'checklist.item4',
  'checklist.item5',
  'checklist.item6',
  'checklist.item7',
  'checklist.item8',
  'checklist.item9',
  'checklist.item10',
];

export default function ChecklistScreen() {
  const { t } = useDriver();
  const [checked, setChecked] = useState(() => new Array(CHECKLIST_KEYS.length).fill(false));

  const toggle = (i) => setChecked(prev => prev.map((v, idx) => idx === i ? !v : v));
  const reset = () => setChecked(new Array(CHECKLIST_KEYS.length).fill(false));

  const checkedCount = checked.filter(Boolean).length;
  const allDone = checkedCount === CHECKLIST_KEYS.length;
  const pct = Math.round((checkedCount / CHECKLIST_KEYS.length) * 100);

  return (
    <div className="da-screen da-checklist">
      {/* Header */}
      <div className="da-section-header">
        <h2 className="da-section-title">{t('checklist.title')}</h2>
        <p className="da-section-sub">{t('checklist.subtitle')}</p>
      </div>

      {/* Progress bar */}
      <div className="da-progress-wrap">
        <div className="da-progress-bar">
          <div
            className="da-progress-fill"
            style={{ width: `${pct}%`, background: allDone ? '#4ade80' : '#FFD700' }}
          />
        </div>
        <p className="da-progress-label">
          {checkedCount}/{CHECKLIST_KEYS.length} {t('checklist.progress')}
        </p>
      </div>

      {/* Items */}
      <div className="da-checklist-items">
        {CHECKLIST_KEYS.map((key, i) => (
          <button
            key={key}
            className={`da-check-item ${checked[i] ? 'da-check-item-done' : ''}`}
            onClick={() => toggle(i)}
          >
            <div className={`da-checkbox ${checked[i] ? 'da-checkbox-checked' : ''}`}>
              {checked[i] && <span>✓</span>}
            </div>
            <span className="da-check-label">{t(key)}</span>
          </button>
        ))}
      </div>

      {/* Footer action */}
      <div className="da-checklist-footer">
        {allDone ? (
          <div className="da-checklist-success">
            <p className="da-success-icon">✅</p>
            <p className="da-success-text">{t('checklist.complete')}</p>
            <button onClick={reset} className="da-btn-secondary">
              ↺ Reset
            </button>
          </div>
        ) : (
          <div className="da-checklist-pending">
            <p className="da-pending-text">{t('checklist.incomplete')}</p>
            <p className="da-pending-count">{CHECKLIST_KEYS.length - checkedCount} remaining</p>
          </div>
        )}
      </div>
    </div>
  );
}

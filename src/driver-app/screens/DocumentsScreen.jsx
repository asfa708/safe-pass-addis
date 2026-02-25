import { useState } from 'react';
import { useDriver } from '../context/DriverContext';

const DOCS = [
  {
    key: 'license',
    labelKey: 'docs.license',
    icon: '🪪',
    expiry: '2026-08-15',
    color: '#60a5fa',
  },
  {
    key: 'insurance',
    labelKey: 'docs.insurance',
    icon: '🛡️',
    expiry: '2025-12-31',
    color: '#4ade80',
  },
  {
    key: 'employeeId',
    labelKey: 'docs.id',
    icon: '🎫',
    expiry: null,
    color: '#FFD700',
  },
];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = (new Date(dateStr) - Date.now()) / (1000 * 60 * 60 * 24);
  return Math.round(diff);
}

export default function DocumentsScreen() {
  const { driver, t } = useDriver();
  const [photos, setPhotos] = useState({});

  const handleUpload = (key, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotos(p => ({ ...p, [key]: url }));
  };

  return (
    <div className="da-screen da-docs">
      {/* Driver summary */}
      <div className="da-driver-card">
        <div className="da-driver-avatar">
          {driver?.name?.[0] ?? '?'}
        </div>
        <div className="da-driver-info">
          <p className="da-driver-name">{driver?.name}</p>
          <p className="da-driver-meta">ID: {driver?.id}</p>
          <p className="da-driver-meta">{driver?.licensePlate}</p>
        </div>
        <div className="da-driver-stats">
          <div className="da-mini-stat">
            <p className="da-mini-num">⭐ {driver?.rating}</p>
            <p className="da-mini-label">{t('profile.rating')}</p>
          </div>
          <div className="da-mini-stat">
            <p className="da-mini-num">{driver?.totalRides}</p>
            <p className="da-mini-label">{t('profile.rides')}</p>
          </div>
        </div>
      </div>

      {/* Documents */}
      <h2 className="da-section-title" style={{ marginTop: 8 }}>{t('docs.title')}</h2>

      <div className="da-docs-list">
        {DOCS.map(doc => {
          const days = daysUntil(doc.expiry);
          const expired = days !== null && days < 0;
          const expiringSoon = days !== null && days >= 0 && days <= 30;

          return (
            <div key={doc.key} className="da-doc-card" style={{ borderColor: doc.color + '55' }}>
              <div className="da-doc-top">
                <div className="da-doc-icon" style={{ background: doc.color + '22' }}>
                  {doc.icon}
                </div>
                <div className="da-doc-meta">
                  <p className="da-doc-name">{t(doc.labelKey)}</p>
                  {doc.expiry && (
                    <p className={`da-doc-expiry ${expired ? 'da-expired' : expiringSoon ? 'da-expiring' : 'da-valid'}`}>
                      {expired
                        ? `⚠️ EXPIRED`
                        : expiringSoon
                        ? `⚠️ ${t('docs.expires')}: ${doc.expiry} (${days}d)`
                        : `✅ ${t('docs.valid')} · ${t('docs.expires')}: ${doc.expiry}`}
                    </p>
                  )}
                  {!doc.expiry && (
                    <p className="da-doc-expiry da-valid">✅ {t('docs.valid')}</p>
                  )}
                </div>
              </div>

              {/* Photo area */}
              <div className="da-doc-photo-wrap">
                {photos[doc.key] ? (
                  <img
                    src={photos[doc.key]}
                    alt={t(doc.labelKey)}
                    className="da-doc-photo"
                  />
                ) : (
                  <div className="da-doc-placeholder">
                    <span>{doc.icon}</span>
                    <p>No photo</p>
                  </div>
                )}
              </div>

              <label className="da-btn-upload">
                📷 {t('docs.upload')}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={e => handleUpload(doc.key, e)}
                />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

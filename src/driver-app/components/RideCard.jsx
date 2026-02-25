import { useState } from 'react';
import { useDriver } from '../context/DriverContext';

const STATUS_FLOW = {
  new:       { next: 'confirmed', btnKey: 'status.accept',   color: '#FFD700' },
  confirmed: { next: 'onway',     btnKey: 'status.onway',    color: '#60a5fa' },
  onway:     { next: 'arrived',   btnKey: 'status.arrived',  color: '#fb923c' },
  arrived:   { next: 'completed', btnKey: 'status.completed', color: '#4ade80' },
};

const STATUS_COLORS = {
  new:       { bg: '#1a1400', border: '#FFD700', text: '#FFD700' },
  confirmed: { bg: '#0f1f3d', border: '#60a5fa', text: '#60a5fa' },
  onway:     { bg: '#1f1000', border: '#fb923c', text: '#fb923c' },
  arrived:   { bg: '#0f2d1a', border: '#4ade80', text: '#4ade80' },
  completed: { bg: '#111', border: '#444', text: '#888' },
  cancelled: { bg: '#1f0f0f', border: '#ef4444', text: '#ef4444' },
};

function openNavigation(address, app) {
  const encoded = encodeURIComponent(address);
  if (app === 'waze') {
    window.open(`https://waze.com/ul?q=${encoded}&navigate=yes`, '_blank');
  } else {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
  }
}

export default function RideCard({ ride }) {
  const { t, updateRideStatus } = useDriver();
  const [expanded, setExpanded] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const flow = STATUS_FLOW[ride.status];
  const colors = STATUS_COLORS[ride.status] || STATUS_COLORS.new;
  const statusLabel = t(`status.${ride.status}`);

  return (
    <div
      className="da-ride-card"
      style={{ borderColor: colors.border, background: colors.bg }}
    >
      {/* Status pill + time */}
      <div className="da-ride-top">
        <span className="da-status-pill" style={{ color: colors.text, borderColor: colors.border }}>
          {statusLabel}
        </span>
        <span className="da-ride-time">🕐 {ride.time || '—'} · {ride.date}</span>
      </div>

      {/* Passenger */}
      <div className="da-ride-passenger">
        <span className="da-passenger-icon">👤</span>
        <div>
          <p className="da-passenger-name">{ride.passengerName}</p>
          <p className="da-passenger-sub">{t('ride.passenger')}</p>
        </div>
        {/* Call button */}
        {ride.passengerPhone && (
          <a
            href={`tel:${ride.passengerPhone}`}
            className="da-call-btn"
            onClick={e => e.stopPropagation()}
          >
            📞
          </a>
        )}
      </div>

      {/* Route */}
      <div className="da-route">
        <div className="da-route-row">
          <span className="da-route-dot da-dot-green" />
          <div className="da-route-info">
            <p className="da-route-label">{t('ride.pickup')}</p>
            <p className="da-route-addr">{ride.pickupLocation}</p>
          </div>
        </div>
        <div className="da-route-line" />
        <div className="da-route-row">
          <span className="da-route-dot da-dot-gold" />
          <div className="da-route-info">
            <p className="da-route-label">{t('ride.dropoff')}</p>
            <p className="da-route-addr">{ride.dropoffLocation}</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {ride.status !== 'completed' && ride.status !== 'cancelled' && (
        <div className="da-ride-actions">
          {/* Navigate button */}
          <div className="da-nav-wrapper">
            <button
              className="da-btn-nav"
              onClick={() => setNavOpen(o => !o)}
            >
              🗺️ {t('ride.navigate')}
            </button>
            {navOpen && (
              <div className="da-nav-menu">
                <button
                  className="da-nav-option"
                  onClick={() => { openNavigation(ride.pickupLocation, 'gmaps'); setNavOpen(false); }}
                >
                  🌐 {t('ride.gmaps')}
                </button>
                <button
                  className="da-nav-option"
                  onClick={() => { openNavigation(ride.pickupLocation, 'waze'); setNavOpen(false); }}
                >
                  🔵 {t('ride.waze')}
                </button>
              </div>
            )}
          </div>

          {/* Status advance button */}
          {flow && (
            <button
              className="da-btn-status"
              style={{ background: colors.border, color: '#000' }}
              onClick={() => updateRideStatus(ride.id, flow.next)}
            >
              {t(flow.btnKey)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useDriver } from '../context/DriverContext';
import RideCard from '../components/RideCard';

export default function HomeScreen() {
  const { driver, myRides, t } = useDriver();
  const [filter, setFilter] = useState('all');

  const activeStatuses = ['new', 'confirmed', 'onway', 'arrived'];

  const displayed = myRides.filter(r => {
    if (filter === 'active') return activeStatuses.includes(r.status);
    if (filter === 'done') return r.status === 'completed' || r.status === 'cancelled';
    return true;
  }).sort((a, b) => {
    // Active rides first, then by time
    const aActive = activeStatuses.includes(a.status);
    const bActive = activeStatuses.includes(b.status);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return (a.time || '').localeCompare(b.time || '');
  });

  const activeCount = myRides.filter(r => activeStatuses.includes(r.status)).length;

  return (
    <div className="da-screen da-home">
      {/* Header */}
      <div className="da-home-header">
        <div>
          <p className="da-greeting">{t('home.greeting')}, {driver?.name?.split(' ')[0]} 👋</p>
          <p className="da-subtext">{driver?.vehicleModel}</p>
        </div>
        <div className="da-stat-chip">
          <span className="da-stat-num">{activeCount}</span>
          <span className="da-stat-label">{t('home.active')}</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="da-tabs">
        {[
          { key: 'all', label: t('home.myRides') },
          { key: 'active', label: t('home.active') },
          { key: 'done', label: t('status.completed') },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`da-tab ${filter === tab.key ? 'da-tab-active' : ''}`}
          >
            {tab.label}
            {tab.key === 'active' && activeCount > 0 && (
              <span className="da-tab-badge">{activeCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Rides list */}
      <div className="da-rides-list">
        {displayed.length === 0 ? (
          <div className="da-empty">
            <div className="da-empty-icon">🚗</div>
            <p>{t('home.noRides')}</p>
          </div>
        ) : (
          displayed.map(ride => (
            <RideCard key={ride.id} ride={ride} />
          ))
        )}
      </div>
    </div>
  );
}

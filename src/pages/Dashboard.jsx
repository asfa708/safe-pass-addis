import {
  CalendarCheck, Car, Users, DollarSign,
  TrendingUp, Clock, AlertTriangle, CheckCircle2,
  MapPin, ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { useNavigate } from 'react-router-dom';

const conditionKey = (v) =>
  v === 'Good' ? 'conditions.good' : v === 'Critical' ? 'conditions.critical' : 'conditions.needsCheck';

export default function Dashboard() {
  const { stats, rides, drivers, clients, getDriver, getClient, maintenance } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const recentRides = [...rides]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  const urgentRides = rides.filter(r => r.status === 'new');
  const activeRides = rides.filter(r => ['onway', 'confirmed', 'arrived'].includes(r.status));

  const criticalVehicles = maintenance.filter(m =>
    m.tireStatus === 'Critical' || m.brakeStatus === 'Critical' || m.acStatus === 'Critical' ||
    m.tireStatus === 'Needs Check' || m.brakeStatus === 'Needs Check'
  );

  return (
    <div className="p-6 space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('dashboard.totalRevenue')}
          value={`$${stats.totalRevenue.toLocaleString()}`}
          sub={`$${stats.totalProfit.toLocaleString()} ${t('common.netProfit')}`}
          icon={DollarSign}
          color="gold"
          trend={12}
        />
        <StatCard
          label={t('dashboard.ridesThisPeriod')}
          value={stats.totalRides}
          sub={`${stats.completedRides} ${t('common.completed')}`}
          icon={CalendarCheck}
          color="blue"
          trend={8}
        />
        <StatCard
          label={t('dashboard.activeDrivers')}
          value={stats.activeDrivers}
          sub={`${t('common.of')} ${drivers.length} ${t('common.total')}`}
          icon={Car}
          color="green"
        />
        <StatCard
          label={t('dashboard.pendingRequests')}
          value={stats.pendingRides}
          sub={t('common.awaitingAssignment')}
          icon={Clock}
          color={stats.pendingRides > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Activity */}
        <div className="lg:col-span-2 space-y-4">
          {/* Urgent unassigned */}
          {urgentRides.length > 0 && (
            <div className="card border border-red-700/40 bg-red-900/10">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-red-400" />
                <h2 className="font-semibold text-red-300">{t('dashboard.needsAssignment')} ({urgentRides.length})</h2>
              </div>
              <div className="space-y-3">
                {urgentRides.map(ride => (
                  <div
                    key={ride.id}
                    onClick={() => navigate('/rides')}
                    className="flex items-center gap-3 p-3 bg-navy-700/50 rounded-lg cursor-pointer hover:bg-navy-700 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <Clock size={14} className="text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{ride.passengerName}</p>
                      <p className="text-xs text-slate-500">{ride.date} · {ride.time} · ${ride.priceToClient}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={ride.status} />
                      <ArrowRight size={14} className="text-slate-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active rides */}
          {activeRides.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <h2 className="font-semibold text-white">{t('dashboard.liveRides')} ({activeRides.length})</h2>
              </div>
              <div className="space-y-3">
                {activeRides.map(ride => {
                  const driver = getDriver(ride.driverId);
                  const client = getClient(ride.clientId);
                  return (
                    <div key={ride.id} className="flex items-center gap-3 p-3 bg-navy-700/50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0 text-gold-400 font-bold text-sm">
                        {driver?.name?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{ride.passengerName}</p>
                        <p className="text-xs text-slate-500 truncate">{driver?.name || t('common.unassigned')} · {client?.companyName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="text-slate-500" />
                          <p className="text-xs text-slate-600 truncate">{ride.pickupLocation} → {ride.dropoffLocation}</p>
                        </div>
                      </div>
                      <StatusBadge status={ride.status} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Rides */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">{t('dashboard.recentRides')}</h2>
              <button onClick={() => navigate('/rides')} className="text-gold-400 text-sm hover:text-gold-500">
                {t('common.viewAll')} →
              </button>
            </div>
            <div className="space-y-2">
              {recentRides.map(ride => {
                const driver = getDriver(ride.driverId);
                const profit = (ride.priceToClient || 0) - (ride.driverPayout || 0);
                return (
                  <div key={ride.id} className="flex items-center gap-3 py-2.5 border-b border-navy-600/40 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-mono">{ride.id}</span>
                        <StatusBadge status={ride.status} />
                      </div>
                      <p className="text-sm text-slate-300 truncate mt-0.5">{ride.passengerName}</p>
                      <p className="text-xs text-slate-600">{ride.date} · {driver?.name || t('common.unassigned')}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gold-400">${ride.priceToClient || '—'}</p>
                      {ride.status === 'completed' && (
                        <p className={`text-xs ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          +${profit} {t('common.profit')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Fleet status */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">{t('dashboard.fleetStatus')}</h2>
              <button onClick={() => navigate('/fleet')} className="text-gold-400 text-sm hover:text-gold-500">
                {t('common.edit')} →
              </button>
            </div>
            <div className="space-y-3">
              {drivers.map(d => (
                <div key={d.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400 text-sm font-bold flex-shrink-0">
                    {d.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{d.name}</p>
                    <p className="text-xs text-slate-500 truncate">{d.vehicleModel.split(' ').slice(0, 3).join(' ')}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    d.status === 'Active' ? 'bg-green-900/40 text-green-300' :
                    d.status === 'Suspended' ? 'bg-red-900/40 text-red-300' :
                    'bg-yellow-900/40 text-yellow-300'
                  }`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance alerts */}
          {criticalVehicles.length > 0 && (
            <div className="card border border-yellow-700/40 bg-yellow-900/10">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-yellow-400" />
                <h2 className="font-semibold text-yellow-300">{t('dashboard.maintenanceAlerts')}</h2>
              </div>
              <div className="space-y-2">
                {criticalVehicles.map(v => (
                  <div key={v.id} className="text-xs p-2 bg-navy-700/50 rounded-lg">
                    <p className="font-medium text-slate-200">{v.vehicleName.split('—')[0].trim()}</p>
                    <p className="text-yellow-400 mt-0.5">
                      {[
                        v.tireStatus !== 'Good' && `${t('maintenance.tires')}: ${t(conditionKey(v.tireStatus))}`,
                        v.brakeStatus !== 'Good' && `${t('maintenance.brakes')}: ${t(conditionKey(v.brakeStatus))}`,
                        v.acStatus !== 'Good' && `${t('maintenance.ac')}: ${t(conditionKey(v.acStatus))}`,
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/maintenance')} className="text-yellow-400 text-xs mt-3 hover:text-yellow-300">
                {t('dashboard.viewMaintenance')}
              </button>
            </div>
          )}

          {/* Top clients */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">{t('dashboard.topClients')}</h2>
              <button onClick={() => navigate('/clients')} className="text-gold-400 text-sm hover:text-gold-500">
                {t('common.all')} →
              </button>
            </div>
            <div className="space-y-3">
              {[...clients]
                .sort((a, b) => b.totalSpent - a.totalSpent)
                .slice(0, 4)
                .map(c => (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0">
                      {c.companyName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{c.companyName.split('—')[0].trim()}</p>
                      <p className="text-xs text-slate-500">{c.paymentTerms}</p>
                    </div>
                    <p className="text-sm font-semibold text-gold-400">${c.totalSpent.toLocaleString()}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

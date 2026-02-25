import { useState } from 'react';
import { Car, Users, CalendarCheck, Star, Phone, Shield, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

const RIDE_STATUS_COLORS = {
  new:       'bg-blue-900/40 text-blue-300 border-blue-700/40',
  confirmed: 'bg-purple-900/40 text-purple-300 border-purple-700/40',
  onway:     'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
  arrived:   'bg-teal-900/40 text-teal-300 border-teal-700/40',
  completed: 'bg-green-900/40 text-green-300 border-green-700/40',
  cancelled: 'bg-red-900/40 text-red-300 border-red-700/40',
};

const DRIVER_STATUS_COLORS = {
  Active:     'bg-green-900/40 text-green-300 border-green-700/50',
  Suspended:  'bg-red-900/40 text-red-300 border-red-700/50',
  'On Leave': 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
};

const VEHICLE_STATUS_COLORS = {
  Active:      'bg-green-900/40 text-green-300 border-green-700/50',
  Inactive:    'bg-slate-700/40 text-slate-400 border-navy-600/50',
  Maintenance: 'bg-orange-900/40 text-orange-300 border-orange-700/50',
};

export default function OperationsCenterPage() {
  const { rides, drivers, vehicles, getDriver, getClient } = useApp();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('rides');
  const [search, setSearch] = useState('');

  const tabDefs = [
    { id: 'rides',    label: t('nav.rides'),    Icon: CalendarCheck, count: rides.length },
    { id: 'drivers',  label: t('nav.fleet'),     Icon: Users,         count: drivers.length },
    { id: 'vehicles', label: t('nav.vehicles'),  Icon: Car,           count: vehicles.length },
  ];

  const q = search.toLowerCase();

  const filteredRides = rides.filter(r => {
    const client = getClient(r.clientId);
    const driver = getDriver(r.driverId);
    return (
      (r.passengerName || '').toLowerCase().includes(q) ||
      (r.pickupLocation || '').toLowerCase().includes(q) ||
      (r.dropoffLocation || '').toLowerCase().includes(q) ||
      (client?.companyName || '').toLowerCase().includes(q) ||
      (driver?.name || '').toLowerCase().includes(q)
    );
  });

  const filteredDrivers = drivers.filter(d =>
    d.name.toLowerCase().includes(q) ||
    d.vehicleModel.toLowerCase().includes(q) ||
    d.licensePlate.toLowerCase().includes(q) ||
    String(d.employeeNumber || '').includes(q)
  );

  const filteredVehicles = vehicles.filter(v =>
    `${v.make} ${v.model}`.toLowerCase().includes(q) ||
    v.licensePlate.toLowerCase().includes(q) ||
    (v.color || '').toLowerCase().includes(q)
  );

  return (
    <div className="p-6 space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <CalendarCheck size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {rides.filter(r => ['onway', 'confirmed', 'arrived'].includes(r.status)).length}
              </p>
              <p className="text-xs text-slate-500">Active Rides</p>
            </div>
          </div>
        </div>
        <div className="card py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Users size={18} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {drivers.filter(d => d.status === 'Active').length}
              </p>
              <p className="text-xs text-slate-500">Active Drivers</p>
            </div>
          </div>
        </div>
        <div className="card py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold-500/20 flex items-center justify-center">
              <Car size={18} className="text-gold-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {vehicles.filter(v => v.status === 'Active').length}
              </p>
              <p className="text-xs text-slate-500">Active Vehicles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar + search */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1 bg-navy-800 border border-navy-600 rounded-xl p-1">
          {tabDefs.map(({ id, label, Icon, count }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSearch(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-gold-500 text-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={15} />
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === id ? 'bg-black/20 text-black' : 'bg-navy-700 text-slate-500'
              }`}>{count}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="input pl-8 text-sm w-56"
          />
        </div>
      </div>

      {/* Rides tab */}
      {activeTab === 'rides' && (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-600 bg-navy-800/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Passenger / Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Route</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Driver</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Date / Time</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Price</th>
              </tr>
            </thead>
            <tbody>
              {filteredRides.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">No rides found</td>
                </tr>
              )}
              {filteredRides.map(r => {
                const driver = getDriver(r.driverId);
                const client = getClient(r.clientId);
                return (
                  <tr key={r.id} className="border-b border-navy-600/40 hover:bg-navy-700/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-sm truncate max-w-40">{r.passengerName}</p>
                      <p className="text-xs text-slate-500 truncate max-w-40">{client?.companyName || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-300 text-xs truncate max-w-44">{r.pickupLocation}</p>
                      <p className="text-slate-500 text-xs truncate max-w-44">→ {r.dropoffLocation}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {driver
                        ? <span className="text-slate-300">{driver.name}</span>
                        : <span className="text-amber-400">Unassigned</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {r.date}<br />{r.time}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${RIDE_STATUS_COLORS[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gold-400">
                      {r.priceToClient ? `$${r.priceToClient}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Drivers tab */}
      {activeTab === 'drivers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDrivers.length === 0 && (
            <div className="col-span-3 card text-center py-12 text-slate-500">No drivers found</div>
          )}
          {filteredDrivers.map(d => (
            <div key={d.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 text-lg font-bold">
                    {d.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{d.name}</p>
                    {d.employeeNumber && (
                      <p className="text-xs text-slate-500 font-mono">#{d.employeeNumber}</p>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${DRIVER_STATUS_COLORS[d.status]}`}>
                  {d.status}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Car size={12} className="shrink-0 text-slate-500" />
                  {d.vehicleModel}
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={12} className="shrink-0 text-slate-500" />
                  <span className="font-mono text-gold-400">{d.licensePlate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={12} className="shrink-0 text-slate-500" />
                  {d.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Star size={12} className="text-yellow-400 fill-yellow-400 shrink-0" />
                  {d.rating} · {d.commissionPercent}% commission
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vehicles tab */}
      {activeTab === 'vehicles' && (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-600 bg-navy-800/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Vehicle</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Plate</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Fuel · Seats</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Assigned Driver</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Mileage</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">No vehicles found</td>
                </tr>
              )}
              {filteredVehicles.map(v => {
                const assignedDriver = drivers.find(d => d.id === v.assignedDriverId);
                return (
                  <tr key={v.id} className="border-b border-navy-600/40 hover:bg-navy-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{v.make} {v.model}</p>
                      <p className="text-xs text-slate-500">{v.year} · {v.color}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-gold-400">{v.licensePlate}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{v.fuelType} · {v.seats} seats</td>
                    <td className="px-4 py-3 text-xs">
                      {assignedDriver
                        ? <span className="text-slate-300">{assignedDriver.name}</span>
                        : <span className="text-slate-500">Unassigned</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{v.mileage.toLocaleString()} km</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${VEHICLE_STATUS_COLORS[v.status]}`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

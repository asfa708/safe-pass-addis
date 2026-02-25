import { useState } from 'react';
import {
  Plus, Star, Phone, Car, Shield, Edit3, Truck,
  Trash2, Search, AlertCircle, X, Fuel, Users,
  Calendar, Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import Modal from '../components/common/Modal';
import { DRIVER_STATUSES, VEHICLE_STATUSES } from '../data/mockData';

/* ─── Driver helpers ────────────────────────────────────────────────────── */

const EMPTY_DRIVER = {
  name: '', phone: '', email: '', vehicleModel: '',
  licensePlate: '', status: 'Active', commissionPercent: 80, role: 'Driver',
};

function getDriverAlertLevel(driver) {
  if (driver.status === 'Suspended') return 'critical';
  if (driver.status === 'On Leave' || (driver.rating != null && driver.rating < 4.0)) return 'warning';
  return 'ok';
}

const driverStatusColors = {
  Active:     'bg-green-900/40 text-green-300 border-green-700/50',
  Suspended:  'bg-red-900/40 text-red-300 border-red-700/50',
  'On Leave': 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
};

/* ─── Vehicle helpers ───────────────────────────────────────────────────── */

const EMPTY_VEHICLE = {
  make: '', model: '', year: new Date().getFullYear(),
  licensePlate: '', color: '', seats: 5, fuelType: 'Diesel',
  status: 'Active', assignedDriverId: '', mileage: 0,
  purchaseDate: '', insuranceExpiry: '', registrationExpiry: '',
  notes: '',
};

const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];

const vehicleStatusColors = {
  Active:      'bg-green-900/40 text-green-300 border-green-700/50',
  Inactive:    'bg-slate-700/40 text-slate-400 border-navy-600/50',
  Maintenance: 'bg-orange-900/40 text-orange-300 border-orange-700/50',
};

const vehicleStatusIcons = { Active: '🟢', Inactive: '⚫', Maintenance: '🔧' };

function isExpiringSoon(dateStr) {
  if (!dateStr) return false;
  const diff = (new Date(dateStr) - Date.now()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 60;
}

function isExpired(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function FleetPage() {
  const { drivers, rides, vehicles, addDriver, updateDriver, deleteDriver, addVehicle, updateVehicle, deleteVehicle } = useApp();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('drivers');

  /* Driver state */
  const [dSearch, setDSearch] = useState('');
  const [dFilterStatus, setDFilterStatus] = useState('all');
  const [dFilterAlert, setDFilterAlert] = useState('all');
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [driverForm, setDriverForm] = useState(EMPTY_DRIVER);
  const [confirmDeleteDriver, setConfirmDeleteDriver] = useState(null);

  /* Vehicle state */
  const [vSearch, setVSearch] = useState('');
  const [vFilterStatus, setVFilterStatus] = useState('all');
  const [vFilterAlert, setVFilterAlert] = useState('all');
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [vehicleForm, setVehicleForm] = useState(EMPTY_VEHICLE);
  const [confirmDeleteVehicle, setConfirmDeleteVehicle] = useState(null);

  /* ── Driver logic ── */
  const filteredDrivers = drivers.filter(d => {
    const q = dSearch.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.vehicleModel.toLowerCase().includes(q) ||
      d.licensePlate.toLowerCase().includes(q)
    ) && (dFilterStatus === 'all' || d.status === dFilterStatus)
      && (dFilterAlert === 'all' || getDriverAlertLevel(d) === dFilterAlert);
  });

  const openEditDriver = (d) => {
    setEditingDriverId(d.id);
    setDriverForm({ ...EMPTY_DRIVER, ...d });
    setShowDriverForm(true);
  };

  const handleDriverSubmit = (e) => {
    e.preventDefault();
    if (editingDriverId) {
      updateDriver(editingDriverId, driverForm);
    } else {
      addDriver(driverForm);
    }
    setShowDriverForm(false);
    setEditingDriverId(null);
    setDriverForm(EMPTY_DRIVER);
  };

  const getDriverRides = (driverId) => rides.filter(r => r.driverId === driverId);
  const getDriverRevenue = (driverId) =>
    rides.filter(r => r.driverId === driverId && r.status === 'completed')
      .reduce((s, r) => s + (r.driverPayout || 0), 0);

  /* ── Vehicle logic ── */
  const getVehicleAlertLevel = (v) => {
    if (isExpired(v.insuranceExpiry) || isExpired(v.registrationExpiry)) return 'critical';
    if (isExpiringSoon(v.insuranceExpiry) || isExpiringSoon(v.registrationExpiry)) return 'warning';
    return 'ok';
  };

  const filteredVehicles = vehicles.filter(v => {
    const q = vSearch.toLowerCase();
    return (
      `${v.make} ${v.model}`.toLowerCase().includes(q) ||
      v.licensePlate.toLowerCase().includes(q) ||
      v.color.toLowerCase().includes(q)
    ) && (vFilterStatus === 'all' || v.status === vFilterStatus)
      && (vFilterAlert === 'all' || getVehicleAlertLevel(v) === vFilterAlert);
  });

  const openAddVehicle = () => {
    setEditingVehicleId(null);
    setVehicleForm(EMPTY_VEHICLE);
    setShowVehicleForm(true);
  };

  const openEditVehicle = (v) => {
    setEditingVehicleId(v.id);
    setVehicleForm({ ...EMPTY_VEHICLE, ...v });
    setShowVehicleForm(true);
  };

  const handleVehicleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...vehicleForm, year: Number(vehicleForm.year), seats: Number(vehicleForm.seats), mileage: Number(vehicleForm.mileage) };
    if (editingVehicleId) {
      updateVehicle(editingVehicleId, payload);
    } else {
      addVehicle(payload);
    }
    setShowVehicleForm(false);
    setEditingVehicleId(null);
  };

  const vFld = (key) => (e) => setVehicleForm(f => ({ ...f, [key]: e.target.value }));

  const getDriverName = (driverId) => {
    if (!driverId) return 'Unassigned';
    const d = drivers.find(d => d.id === driverId);
    return d ? d.name : 'Unknown';
  };

  return (
    <div className="p-6 space-y-4">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-navy-800 border border-navy-600 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('drivers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'drivers' ? 'bg-gold-500 text-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users size={15} />
          {t('nav.fleet')}
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            activeTab === 'drivers' ? 'bg-black/20 text-black' : 'bg-navy-700 text-slate-500'
          }`}>{drivers.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'vehicles' ? 'bg-gold-500 text-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck size={15} />
          {t('nav.vehicles')}
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            activeTab === 'vehicles' ? 'bg-black/20 text-black' : 'bg-navy-700 text-slate-500'
          }`}>{vehicles.length}</span>
        </button>
      </div>

      {/* ══════════════════ DRIVERS TAB ══════════════════ */}
      {activeTab === 'drivers' && (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-52">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={dSearch}
                onChange={e => setDSearch(e.target.value)}
                placeholder={t('fleet.searchDrivers')}
                className="input pl-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              {['all', ...DRIVER_STATUSES].map(s => (
                <button
                  key={s}
                  onClick={() => setDFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    dFilterStatus === s
                      ? 'bg-gold-500 text-black'
                      : 'bg-navy-700 text-slate-400 hover:text-slate-200 border border-navy-600'
                  }`}
                >
                  {s === 'all' ? t('common.all') : s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[
                { value: 'all',      label: 'All Levels' },
                { value: 'critical', label: '🔴 Critical' },
                { value: 'warning',  label: '🟡 Warning' },
                { value: 'ok',       label: '🟢 OK' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDFilterAlert(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    dFilterAlert === value
                      ? value === 'critical' ? 'bg-red-700/60 text-red-200 border-red-700/50'
                      : value === 'warning'  ? 'bg-yellow-700/50 text-yellow-200 border-yellow-700/50'
                      : value === 'ok'       ? 'bg-green-700/50 text-green-200 border-green-700/50'
                      : 'bg-gold-500 text-black border-gold-500'
                      : 'bg-navy-700 text-slate-400 hover:text-slate-200 border-navy-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {(dSearch || dFilterStatus !== 'all' || dFilterAlert !== 'all') && (
              <button
                onClick={() => { setDSearch(''); setDFilterStatus('all'); setDFilterAlert('all'); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 bg-navy-700 border border-navy-600 hover:border-red-700/50 transition-colors"
              >
                <X size={13} /> Clear filters
              </button>
            )}
            <button
              onClick={() => { setShowDriverForm(true); setEditingDriverId(null); setDriverForm(EMPTY_DRIVER); }}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> {t('fleet.addDriver')}
            </button>
          </div>

          {/* Summary bar */}
          <div className="flex gap-4">
            {DRIVER_STATUSES.map(s => (
              <div key={s} className="card flex-1 py-3">
                <p className="text-2xl font-bold text-white">{drivers.filter(d => d.status === s).length}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s}</p>
              </div>
            ))}
            <div className="card flex-1 py-3">
              <p className="text-2xl font-bold text-gold-400">{drivers.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t('fleet.totalFleet')}</p>
            </div>
          </div>

          {/* Driver cards */}
          {filteredDrivers.length === 0 && (
            <div className="card text-center py-16 text-slate-500">
              <AlertCircle size={32} className="mx-auto mb-3 opacity-30" />
              {t('fleet.noDrivers')}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredDrivers.map(driver => {
              const driverRides = getDriverRides(driver.id);
              const revenue = getDriverRevenue(driver.id);
              const completedRides = driverRides.filter(r => r.status === 'completed').length;

              return (
                <div key={driver.id} className="card hover:border-navy-600 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 text-xl font-bold">
                        {driver.name[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{driver.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Star size={12} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-slate-400">{driver.rating}</span>
                          {driver.employeeNumber && (
                            <span className="text-xs text-slate-500 font-mono">· #{driver.employeeNumber}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${driverStatusColors[driver.status]}`}>
                      {driver.status}
                    </span>
                  </div>

                  <div className="p-3 bg-navy-700/50 rounded-lg mb-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Car size={14} className="text-slate-400" />
                      <span className="text-sm text-slate-200">{driver.vehicleModel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-slate-400" />
                      <span className="text-sm font-mono text-gold-400">{driver.licensePlate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      <span className="text-sm text-slate-300">{driver.phone}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{completedRides}</p>
                      <p className="text-xs text-slate-500">{t('fleet.rides')}</p>
                    </div>
                    <div className="text-center border-x border-navy-600">
                      <p className="text-lg font-bold text-gold-400">${revenue.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{t('fleet.earned')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-400">{driver.commissionPercent}%</p>
                      <p className="text-xs text-slate-500">{t('common.commission')}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditDriver(driver)}
                      className="btn-secondary flex-1 text-sm flex items-center justify-center gap-2"
                    >
                      <Edit3 size={14} /> {t('common.edit')}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteDriver(driver)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-navy-700 hover:bg-red-900/30 border border-navy-600 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 text-center mt-3">{t('fleet.joined')} {driver.joinDate}</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ══════════════════ VEHICLES TAB ══════════════════ */}
      {activeTab === 'vehicles' && (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-52">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={vSearch}
                onChange={e => setVSearch(e.target.value)}
                placeholder="Search vehicles, plates, colors..."
                className="input pl-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              {['all', ...VEHICLE_STATUSES].map(s => (
                <button
                  key={s}
                  onClick={() => setVFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    vFilterStatus === s
                      ? 'bg-gold-500 text-black'
                      : 'bg-navy-700 text-slate-400 hover:text-slate-200 border border-navy-600'
                  }`}
                >
                  {s === 'all' ? t('common.all') : s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[
                { value: 'all',      label: 'All Levels' },
                { value: 'critical', label: '🔴 Critical' },
                { value: 'warning',  label: '🟡 Expiring' },
                { value: 'ok',       label: '🟢 OK' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setVFilterAlert(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    vFilterAlert === value
                      ? value === 'critical' ? 'bg-red-700/60 text-red-200 border-red-700/50'
                      : value === 'warning'  ? 'bg-yellow-700/50 text-yellow-200 border-yellow-700/50'
                      : value === 'ok'       ? 'bg-green-700/50 text-green-200 border-green-700/50'
                      : 'bg-gold-500 text-black border-gold-500'
                      : 'bg-navy-700 text-slate-400 hover:text-slate-200 border-navy-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {(vSearch || vFilterStatus !== 'all' || vFilterAlert !== 'all') && (
              <button
                onClick={() => { setVSearch(''); setVFilterStatus('all'); setVFilterAlert('all'); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 bg-navy-700 border border-navy-600 hover:border-red-700/50 transition-colors"
              >
                <X size={13} /> Clear filters
              </button>
            )}
            <button onClick={openAddVehicle} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> Add Vehicle
            </button>
          </div>

          {/* Summary bar */}
          <div className="flex gap-4">
            {VEHICLE_STATUSES.map(s => {
              const count = vehicles.filter(v => v.status === s).length;
              const colors = { Active: 'text-green-400', Inactive: 'text-slate-400', Maintenance: 'text-orange-400' };
              return (
                <div key={s} className="card flex-1 py-3">
                  <p className={`text-2xl font-bold ${colors[s]}`}>{count}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s}</p>
                </div>
              );
            })}
            <div className="card flex-1 py-3">
              <p className="text-2xl font-bold text-gold-400">{vehicles.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total Fleet</p>
            </div>
          </div>

          {/* Vehicle cards */}
          {filteredVehicles.length === 0 && (
            <div className="card text-center py-16 text-slate-500">
              <AlertCircle size={32} className="mx-auto mb-3 opacity-30" />
              No vehicles found
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredVehicles.map(v => {
              const insExpiring = isExpiringSoon(v.insuranceExpiry);
              const insExpired  = isExpired(v.insuranceExpiry);
              const regExpiring = isExpiringSoon(v.registrationExpiry);
              const regExpired  = isExpired(v.registrationExpiry);
              const hasAlert = insExpired || insExpiring || regExpired || regExpiring;

              return (
                <div
                  key={v.id}
                  className={`card hover:border-navy-600 transition-colors ${
                    v.status === 'Maintenance' ? 'border-orange-700/40' :
                    v.status === 'Inactive' ? 'border-navy-600/40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl
                        ${v.status === 'Active' ? 'bg-gold-500/20 border border-gold-500/30' :
                          v.status === 'Maintenance' ? 'bg-orange-500/20 border border-orange-500/30' :
                          'bg-slate-700/40 border border-navy-600/30'}`}
                      >
                        <Car size={22} className={
                          v.status === 'Active' ? 'text-gold-400' :
                          v.status === 'Maintenance' ? 'text-orange-400' :
                          'text-slate-500'
                        } />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{v.make} {v.model}</h3>
                        <p className="text-xs text-slate-400">{v.year} · {v.color}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${vehicleStatusColors[v.status]}`}>
                      {vehicleStatusIcons[v.status]} {v.status}
                    </span>
                  </div>

                  <div className="p-3 bg-navy-700/50 rounded-lg mb-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-slate-400" />
                      <span className="text-sm font-mono text-gold-400">{v.licensePlate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Fuel size={14} className="text-slate-400" />
                      <span className="text-sm text-slate-300">{v.fuelType}</span>
                      <span className="ml-auto text-xs text-slate-500">{v.mileage.toLocaleString()} km</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-slate-400" />
                      <span className="text-sm text-slate-300">{v.seats} seats</span>
                      <span className="ml-auto text-xs text-slate-400 truncate max-w-28">{getDriverName(v.assignedDriverId)}</span>
                    </div>
                  </div>

                  {hasAlert && (
                    <div className="mb-3 space-y-1">
                      {(insExpired || insExpiring) && (
                        <div className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg ${
                          insExpired ? 'bg-red-900/40 text-red-300' : 'bg-yellow-900/40 text-yellow-300'
                        }`}>
                          <AlertCircle size={12} />
                          Insurance {insExpired ? 'EXPIRED' : 'expiring'}: {v.insuranceExpiry}
                        </div>
                      )}
                      {(regExpired || regExpiring) && (
                        <div className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg ${
                          regExpired ? 'bg-red-900/40 text-red-300' : 'bg-yellow-900/40 text-yellow-300'
                        }`}>
                          <AlertCircle size={12} />
                          Registration {regExpired ? 'EXPIRED' : 'expiring'}: {v.registrationExpiry}
                        </div>
                      )}
                    </div>
                  )}

                  {v.notes && (
                    <p className="text-xs text-slate-500 italic mb-3 line-clamp-2">{v.notes}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditVehicle(v)}
                      className="btn-secondary flex-1 text-sm flex items-center justify-center gap-2"
                    >
                      <Edit3 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => {
                        const next = { Active: 'Inactive', Inactive: 'Maintenance', Maintenance: 'Active' };
                        updateVehicle(v.id, { status: next[v.status] });
                      }}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-navy-700 hover:bg-navy-600 border border-navy-600 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Cycle status"
                    >
                      <Wrench size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteVehicle(v)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-navy-700 hover:bg-red-900/30 border border-navy-600 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 text-center mt-3">
                    <Calendar size={10} className="inline mr-1" />
                    Purchased {v.purchaseDate || '—'}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ══════════════════ DRIVER MODALS ══════════════════ */}
      <Modal
        open={showDriverForm}
        onClose={() => { setShowDriverForm(false); setEditingDriverId(null); }}
        title={editingDriverId ? t('fleet.editDriver') : t('fleet.addDriver')}
        size="md"
      >
        <form onSubmit={handleDriverSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('fleet.fullName')}</label>
              <input value={driverForm.name} onChange={e => setDriverForm(f => ({ ...f, name: e.target.value }))} className="input" required placeholder="Abebe Girma" />
            </div>
            <div>
              <label className="label">{t('fleet.phone')}</label>
              <input value={driverForm.phone} onChange={e => setDriverForm(f => ({ ...f, phone: e.target.value }))} className="input" placeholder="+251911..." />
            </div>
          </div>
          <div>
            <label className="label">{t('fleet.emailForLogin')}</label>
            <input type="email" value={driverForm.email} onChange={e => setDriverForm(f => ({ ...f, email: e.target.value }))} className="input" placeholder="driver@theodorus.et" />
          </div>
          <div>
            <label className="label">{t('fleet.vehicleModel')}</label>
            <input value={driverForm.vehicleModel} onChange={e => setDriverForm(f => ({ ...f, vehicleModel: e.target.value }))} className="input" required placeholder="Toyota HiAce High Roof 2018" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('fleet.licensePlate')}</label>
              <input value={driverForm.licensePlate} onChange={e => setDriverForm(f => ({ ...f, licensePlate: e.target.value }))} className="input" placeholder="AA-3-12345" />
            </div>
            <div>
              <label className="label">{t('common.status')}</label>
              <select value={driverForm.status} onChange={e => setDriverForm(f => ({ ...f, status: e.target.value }))} className="input">
                {DRIVER_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">{t('fleet.commissionPercent')}</label>
            <input type="number" min="0" max="100" value={driverForm.commissionPercent} onChange={e => setDriverForm(f => ({ ...f, commissionPercent: Number(e.target.value) }))} className="input" />
            <p className="text-xs text-slate-500 mt-1">
              {t('fleet.commissionNote')} {driverForm.commissionPercent}% {t('fleet.commissionNote2')} {100 - driverForm.commissionPercent}%
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editingDriverId ? t('common.saveChanges') : t('fleet.addDriver')}</button>
            <button type="button" onClick={() => setShowDriverForm(false)} className="btn-secondary">{t('common.cancel')}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDeleteDriver} onClose={() => setConfirmDeleteDriver(null)} title={t('fleet.removeDriver')} size="sm">
        {confirmDeleteDriver && (
          <div className="space-y-4">
            <p className="text-slate-300">
              {t('fleet.removeConfirm')} <strong>{confirmDeleteDriver.name}</strong> {t('fleet.removeConfirmFrom')}
            </p>
            <div className="flex gap-3">
              <button onClick={() => { deleteDriver(confirmDeleteDriver.id); setConfirmDeleteDriver(null); }} className="btn-danger flex-1">{t('common.remove')}</button>
              <button onClick={() => setConfirmDeleteDriver(null)} className="btn-secondary flex-1">{t('common.cancel')}</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════════════ VEHICLE MODALS ══════════════════ */}
      <Modal
        open={showVehicleForm}
        onClose={() => setShowVehicleForm(false)}
        title={editingVehicleId ? 'Edit Vehicle' : 'Add New Vehicle'}
        size="md"
      >
        <form onSubmit={handleVehicleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Make</label>
              <input value={vehicleForm.make} onChange={vFld('make')} className="input" required placeholder="Toyota" />
            </div>
            <div>
              <label className="label">Model</label>
              <input value={vehicleForm.model} onChange={vFld('model')} className="input" required placeholder="HiAce High Roof" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Year</label>
              <input type="number" value={vehicleForm.year} onChange={vFld('year')} className="input" min="2000" max="2030" />
            </div>
            <div>
              <label className="label">Color</label>
              <input value={vehicleForm.color} onChange={vFld('color')} className="input" placeholder="White" />
            </div>
            <div>
              <label className="label">Seats</label>
              <input type="number" value={vehicleForm.seats} onChange={vFld('seats')} className="input" min="1" max="50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">License Plate</label>
              <input value={vehicleForm.licensePlate} onChange={vFld('licensePlate')} className="input" required placeholder="AA-3-12345" />
            </div>
            <div>
              <label className="label">Fuel Type</label>
              <select value={vehicleForm.fuelType} onChange={vFld('fuelType')} className="input">
                {FUEL_TYPES.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select value={vehicleForm.status} onChange={vFld('status')} className="input">
                {VEHICLE_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Assigned Driver</label>
              <select value={vehicleForm.assignedDriverId || ''} onChange={vFld('assignedDriverId')} className="input">
                <option value="">— Unassigned —</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Current Mileage (km)</label>
            <input type="number" value={vehicleForm.mileage} onChange={vFld('mileage')} className="input" min="0" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Purchase Date</label>
              <input type="date" value={vehicleForm.purchaseDate} onChange={vFld('purchaseDate')} className="input" />
            </div>
            <div>
              <label className="label">Insurance Expiry</label>
              <input type="date" value={vehicleForm.insuranceExpiry} onChange={vFld('insuranceExpiry')} className="input" />
            </div>
            <div>
              <label className="label">Registration Expiry</label>
              <input type="date" value={vehicleForm.registrationExpiry} onChange={vFld('registrationExpiry')} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea value={vehicleForm.notes} onChange={vFld('notes')} className="input" rows={2} placeholder="Any notes..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              {editingVehicleId ? 'Save Changes' : 'Add Vehicle'}
            </button>
            <button type="button" onClick={() => setShowVehicleForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDeleteVehicle} onClose={() => setConfirmDeleteVehicle(null)} title="Remove Vehicle" size="sm">
        {confirmDeleteVehicle && (
          <div className="space-y-4">
            <p className="text-slate-300">
              Remove <strong>{confirmDeleteVehicle.make} {confirmDeleteVehicle.model}</strong> ({confirmDeleteVehicle.licensePlate}) from the fleet? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { deleteVehicle(confirmDeleteVehicle.id); setConfirmDeleteVehicle(null); }}
                className="btn-danger flex-1"
              >
                Remove
              </button>
              <button onClick={() => setConfirmDeleteVehicle(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

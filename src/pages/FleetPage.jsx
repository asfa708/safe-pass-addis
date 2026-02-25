import { useState } from 'react';
import {
  Plus, Star, Phone, Car, Shield, Edit3,
  Trash2, Search, AlertCircle, X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import Modal from '../components/common/Modal';
import { DRIVER_STATUSES } from '../data/mockData';

const EMPTY_DRIVER = {
  name: '', phone: '', email: '', vehicleModel: '',
  licensePlate: '', status: 'Active', commissionPercent: 80, role: 'Driver',
};

function getAlertLevel(driver) {
  if (driver.status === 'Suspended') return 'critical';
  if (driver.status === 'On Leave' || (driver.rating != null && driver.rating < 4.0)) return 'warning';
  return 'ok';
}

export default function FleetPage() {
  const { drivers, rides, addDriver, updateDriver, deleteDriver } = useApp();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAlert, setFilterAlert] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_DRIVER);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = drivers.filter(d => {
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.vehicleModel.toLowerCase().includes(q) ||
      d.licensePlate.toLowerCase().includes(q)
    ) && (filterStatus === 'all' || d.status === filterStatus)
      && (filterAlert === 'all' || getAlertLevel(d) === filterAlert);
  });

  const openEdit = (d) => {
    setEditingId(d.id);
    setForm({ ...EMPTY_DRIVER, ...d });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateDriver(editingId, form);
    } else {
      addDriver(form);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_DRIVER);
  };

  const getDriverRides = (driverId) => rides.filter(r => r.driverId === driverId);
  const getDriverRevenue = (driverId) =>
    rides.filter(r => r.driverId === driverId && r.status === 'completed')
      .reduce((s, r) => s + (r.driverPayout || 0), 0);

  const statusColors = {
    Active: 'bg-green-900/40 text-green-300 border-green-700/50',
    Suspended: 'bg-red-900/40 text-red-300 border-red-700/50',
    'On Leave': 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
  };

  return (
    <div className="p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('fleet.searchDrivers')}
            className="input pl-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', ...DRIVER_STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filterStatus === s
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
              onClick={() => setFilterAlert(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                filterAlert === value
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

        {(search || filterStatus !== 'all' || filterAlert !== 'all') && (
          <button
            onClick={() => { setSearch(''); setFilterStatus('all'); setFilterAlert('all'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 bg-navy-700 border border-navy-600 hover:border-red-700/50 transition-colors"
          >
            <X size={13} />
            Clear filters
          </button>
        )}

        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_DRIVER); }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          {t('fleet.addDriver')}
        </button>
      </div>

      {/* Summary bar */}
      <div className="flex gap-4">
        {DRIVER_STATUSES.map(s => {
          const count = drivers.filter(d => d.status === s).length;
          return (
            <div key={s} className="card flex-1 py-3">
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s}</p>
            </div>
          );
        })}
        <div className="card flex-1 py-3">
          <p className="text-2xl font-bold text-gold-400">{drivers.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">{t('fleet.totalFleet')}</p>
        </div>
      </div>

      {/* Driver cards */}
      {filtered.length === 0 && (
        <div className="card text-center py-16 text-slate-500">
          <AlertCircle size={32} className="mx-auto mb-3 opacity-30" />
          {t('fleet.noDrivers')}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(driver => {
          const driverRides = getDriverRides(driver.id);
          const revenue = getDriverRevenue(driver.id);
          const completedRides = driverRides.filter(r => r.status === 'completed').length;

          return (
            <div key={driver.id} className="card hover:border-navy-600 transition-colors">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 text-xl font-bold">
                    {driver.name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{driver.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-slate-400">{driver.rating}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColors[driver.status]}`}>
                  {driver.status}
                </span>
              </div>

              {/* Vehicle */}
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

              {/* Stats */}
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

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(driver)}
                  className="btn-secondary flex-1 text-sm flex items-center justify-center gap-2"
                >
                  <Edit3 size={14} />
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => setConfirmDelete(driver)}
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

      {/* Add / Edit Form */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingId(null); }}
        title={editingId ? t('fleet.editDriver') : t('fleet.addDriver')}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('fleet.fullName')}</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" required placeholder="Abebe Girma" />
            </div>
            <div>
              <label className="label">{t('fleet.phone')}</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" placeholder="+251911..." />
            </div>
          </div>
          <div>
            <label className="label">{t('fleet.emailForLogin')}</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" placeholder="driver@safepass.et" />
          </div>
          <div>
            <label className="label">{t('fleet.vehicleModel')}</label>
            <input value={form.vehicleModel} onChange={e => setForm(f => ({ ...f, vehicleModel: e.target.value }))} className="input" required placeholder="Toyota HiAce High Roof 2018" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('fleet.licensePlate')}</label>
              <input value={form.licensePlate} onChange={e => setForm(f => ({ ...f, licensePlate: e.target.value }))} className="input" placeholder="AA-3-12345" />
            </div>
            <div>
              <label className="label">{t('common.status')}</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input">
                {DRIVER_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">{t('fleet.commissionPercent')}</label>
            <input type="number" min="0" max="100" value={form.commissionPercent} onChange={e => setForm(f => ({ ...f, commissionPercent: Number(e.target.value) }))} className="input" />
            <p className="text-xs text-slate-500 mt-1">
              {t('fleet.commissionNote')} {form.commissionPercent}% {t('fleet.commissionNote2')} {100 - form.commissionPercent}%
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editingId ? t('common.saveChanges') : t('fleet.addDriver')}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('common.cancel')}</button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title={t('fleet.removeDriver')} size="sm">
        {confirmDelete && (
          <div className="space-y-4">
            <p className="text-slate-300">
              {t('fleet.removeConfirm')} <strong>{confirmDelete.name}</strong> {t('fleet.removeConfirmFrom')}
            </p>
            <div className="flex gap-3">
              <button onClick={() => { deleteDriver(confirmDelete.id); setConfirmDelete(null); }} className="btn-danger flex-1">{t('common.remove')}</button>
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">{t('common.cancel')}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

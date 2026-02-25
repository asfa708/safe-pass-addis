import { useState, useMemo } from 'react';
import {
  Wrench, AlertTriangle, CheckCircle2, Car,
  Calendar, Gauge, Edit3, AlertCircle, ShieldAlert, X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/common/Modal';

const CONDITION_OPTIONS = ['Good', 'Needs Check', 'Critical'];

const conditionColor = {
  Good: 'text-green-400',
  'Needs Check': 'text-yellow-400',
  Critical: 'text-red-400',
};

const conditionBg = {
  Good: 'bg-green-900/30 border-green-700/40',
  'Needs Check': 'bg-yellow-900/30 border-yellow-700/40',
  Critical: 'bg-red-900/30 border-red-700/40',
};

function ConditionBadge({ value }) {
  const color = conditionColor[value] || 'text-slate-400';
  const Icon = value === 'Good' ? CheckCircle2 : value === 'Critical' ? ShieldAlert : AlertTriangle;
  return (
    <div className={`flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon size={13} />
      {value}
    </div>
  );
}

const DATE_FIELDS = [
  { value: 'lastServiceDate', label: 'Last Service' },
  { value: 'insuranceExpiry', label: 'Insurance Expiry' },
  { value: 'registrationExpiry', label: 'Reg. Expiry' },
];

export default function MaintenancePage() {
  const { maintenance, drivers, getDriver, updateMaintenance } = useApp();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(null);
  const [dateField, setDateField] = useState('lastServiceDate');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterCondition, setFilterCondition] = useState('all');

  const openEdit = (m) => {
    setEditingId(m.id);
    setForm({ ...m });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMaintenance(editingId, { ...form, currentKM: Number(form.currentKM), nextServiceKM: Number(form.nextServiceKM) });
    setEditingId(null);
    setForm(null);
  };

  const getAlertLevel = (m) => {
    if (m.tireStatus === 'Critical' || m.brakeStatus === 'Critical') return 'critical';
    if (m.tireStatus === 'Needs Check' || m.brakeStatus === 'Needs Check' || m.acStatus === 'Needs Check') return 'warning';
    const kmLeft = m.nextServiceKM - m.currentKM;
    if (kmLeft <= 0) return 'critical';
    if (kmLeft <= 1000) return 'warning';
    return 'ok';
  };

  const alertOrder = { critical: 0, warning: 1, ok: 2 };

  const filtered = useMemo(() => maintenance.filter(m => {
    const d = m[dateField];
    const dateOk = (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
    const conditionOk = filterCondition === 'all' || getAlertLevel(m) === filterCondition;
    return dateOk && conditionOk;
  }), [maintenance, dateField, dateFrom, dateTo, filterCondition]);

  const sorted = [...filtered].sort((a, b) => alertOrder[getAlertLevel(a)] - alertOrder[getAlertLevel(b)]);

  const criticalCount = filtered.filter(m => getAlertLevel(m) === 'critical').length;
  const warningCount = filtered.filter(m => getAlertLevel(m) === 'warning').length;
  const okCount = filtered.filter(m => getAlertLevel(m) === 'ok').length;

  return (
    <div className="p-6 space-y-4">
      {/* Date range filter */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-slate-500 whitespace-nowrap">Filter by:</span>
        <div className="flex items-center gap-1">
          {DATE_FIELDS.map(f => (
            <button
              key={f.value}
              onClick={() => setDateField(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                dateField === f.value
                  ? 'bg-gold-500 text-black'
                  : 'bg-navy-700 text-slate-400 hover:text-slate-200 border border-navy-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="input text-sm py-1.5 w-40"
        />
        <span className="text-xs text-slate-600">→</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          min={dateFrom || undefined}
          className="input text-sm py-1.5 w-40"
        />
        {(dateFrom || dateTo || filterCondition !== 'all') && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setFilterCondition('all'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 bg-navy-700 border border-navy-600 hover:border-red-700/50 transition-colors"
          >
            <X size={13} /> Clear filters
          </button>
        )}
        {(dateFrom || dateTo || filterCondition !== 'all') && (
          <span className="text-xs text-slate-500">
            {filtered.length} of {maintenance.length} vehicles
          </span>
        )}
      </div>

      {/* Condition filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 whitespace-nowrap">Condition:</span>
        {[
          { value: 'all',      label: 'All',             cls: 'bg-gold-500 text-black',                       inactiveCls: 'bg-navy-700 text-slate-400 border-navy-600' },
          { value: 'critical', label: '🔴 Critical',     cls: 'bg-red-700/60 text-red-200 border-red-700/50', inactiveCls: 'bg-navy-700 text-slate-400 border-navy-600' },
          { value: 'warning',  label: '🟡 Needs Attention', cls: 'bg-yellow-700/50 text-yellow-200 border-yellow-700/50', inactiveCls: 'bg-navy-700 text-slate-400 border-navy-600' },
          { value: 'ok',       label: '🟢 All Good',     cls: 'bg-green-700/50 text-green-200 border-green-700/50', inactiveCls: 'bg-navy-700 text-slate-400 border-navy-600' },
        ].map(({ value, label, cls, inactiveCls }) => (
          <button
            key={value}
            onClick={() => setFilterCondition(value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filterCondition === value ? cls : inactiveCls
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card border border-red-700/30 bg-red-900/10">
          <div className="flex items-center gap-2">
            <ShieldAlert size={20} className="text-red-400" />
            <div>
              <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
              <p className="text-xs text-slate-500">Critical</p>
            </div>
          </div>
        </div>
        <div className="card border border-yellow-700/30 bg-yellow-900/10">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-yellow-400">{warningCount}</p>
              <p className="text-xs text-slate-500">Needs Attention</p>
            </div>
          </div>
        </div>
        <div className="card border border-green-700/30 bg-green-900/10">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-green-400" />
            <div>
              <p className="text-2xl font-bold text-green-400">{okCount}</p>
              <p className="text-xs text-slate-500">All Good</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle cards */}
      <div className="space-y-4">
        {sorted.map(m => {
          const driver = getDriver(m.driverId);
          const alert = getAlertLevel(m);
          const kmLeft = m.nextServiceKM - m.currentKM;
          const kmProgress = Math.min(100, Math.max(0, ((m.currentKM - m.lastServiceKM) / (m.nextServiceKM - m.lastServiceKM)) * 100));

          const borderClass = alert === 'critical'
            ? 'border-red-700/50 bg-red-900/5'
            : alert === 'warning'
            ? 'border-yellow-700/50 bg-yellow-900/5'
            : '';

          return (
            <div key={m.id} className={`card ${borderClass} transition-colors`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    alert === 'critical' ? 'bg-red-900/40' : alert === 'warning' ? 'bg-yellow-900/40' : 'bg-green-900/40'
                  }`}>
                    <Car size={20} className={
                      alert === 'critical' ? 'text-red-400' : alert === 'warning' ? 'text-yellow-400' : 'text-green-400'
                    } />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{m.vehicleName.split('—')[0].trim()}</h3>
                    <p className="text-xs text-gold-400 font-mono">{m.vehicleName.split('—')[1]?.trim()}</p>
                    {driver && <p className="text-xs text-slate-500 mt-0.5">Driver: {driver.name}</p>}
                  </div>
                </div>
                <button onClick={() => openEdit(m)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
                  <Edit3 size={12} /> Update
                </button>
              </div>

              {/* Service progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Gauge size={13} />
                    <span>Service interval: {m.lastServiceKM.toLocaleString()} → {m.nextServiceKM.toLocaleString()} km</span>
                  </div>
                  <span className={`text-xs font-semibold ${kmLeft <= 0 ? 'text-red-400' : kmLeft <= 1000 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {kmLeft > 0 ? `${kmLeft.toLocaleString()} km left` : `${Math.abs(kmLeft).toLocaleString()} km OVERDUE`}
                  </span>
                </div>
                <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      kmProgress >= 100 ? 'bg-red-500' : kmProgress >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, kmProgress)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-600 mt-0.5">
                  <span>Current: {m.currentKM.toLocaleString()} km</span>
                  <span>{Math.round(kmProgress)}% used</span>
                </div>
              </div>

              {/* Components status grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Tires', value: m.tireStatus },
                  { label: 'Brakes', value: m.brakeStatus },
                  { label: 'A/C', value: m.acStatus },
                ].map(({ label, value }) => (
                  <div key={label} className={`p-2.5 rounded-lg border ${conditionBg[value] || 'bg-navy-700/50 border-navy-600'}`}>
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <ConditionBadge value={value} />
                  </div>
                ))}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar size={13} />
                  <span>Last service: <span className="text-slate-300">{m.lastServiceDate}</span></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar size={13} />
                  <span>Insurance: <span className={`font-medium ${
                    new Date(m.insuranceExpiry) < new Date(Date.now() + 60*24*60*60*1000) ? 'text-yellow-400' : 'text-slate-300'
                  }`}>{m.insuranceExpiry}</span></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar size={13} />
                  <span>Reg. expiry: <span className={`font-medium ${
                    new Date(m.registrationExpiry) < new Date(Date.now() + 60*24*60*60*1000) ? 'text-yellow-400' : 'text-slate-300'
                  }`}>{m.registrationExpiry}</span></span>
                </div>
              </div>

              {m.notes && (
                <div className="mt-3 p-2.5 bg-navy-700/50 rounded-lg">
                  <p className="text-xs text-slate-400 leading-relaxed">{m.notes}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      <Modal open={!!editingId} onClose={() => { setEditingId(null); setForm(null); }} title="Update Vehicle Maintenance" size="md">
        {form && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Current KM (odometer)</label>
                <input type="number" value={form.currentKM} onChange={e => setForm(f => ({ ...f, currentKM: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Next Service at KM</label>
                <input type="number" value={form.nextServiceKM} onChange={e => setForm(f => ({ ...f, nextServiceKM: e.target.value }))} className="input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Last Service Date</label>
                <input type="date" value={form.lastServiceDate} onChange={e => setForm(f => ({ ...f, lastServiceDate: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Last Service KM</label>
                <input type="number" value={form.lastServiceKM} onChange={e => setForm(f => ({ ...f, lastServiceKM: e.target.value }))} className="input" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: 'tireStatus', label: 'Tires' },
                { key: 'brakeStatus', label: 'Brakes' },
                { key: 'acStatus', label: 'A/C' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="input">
                    {CONDITION_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Insurance Expiry</label>
                <input type="date" value={form.insuranceExpiry} onChange={e => setForm(f => ({ ...f, insuranceExpiry: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Registration Expiry</label>
                <input type="date" value={form.registrationExpiry} onChange={e => setForm(f => ({ ...f, registrationExpiry: e.target.value }))} className="input" />
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input resize-none" rows={3} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1">Save</button>
              <button type="button" onClick={() => { setEditingId(null); setForm(null); }} className="btn-secondary">Cancel</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

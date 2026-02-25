import { useState } from 'react';
import {
  Plus, Car, Edit3, Trash2, Search, AlertCircle,
  Fuel, Users, Calendar, FileText, Shield, Wrench, X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/common/Modal';
import { VEHICLE_STATUSES } from '../data/mockData';

const EMPTY_VEHICLE = {
  make: '', model: '', year: new Date().getFullYear(),
  licensePlate: '', color: '', seats: 5, fuelType: 'Diesel',
  status: 'Active', assignedDriverId: '', mileage: 0,
  purchaseDate: '', insuranceExpiry: '', registrationExpiry: '',
  notes: '',
};

const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];

const statusColors = {
  Active: 'bg-green-900/40 text-green-300 border-green-700/50',
  Inactive: 'bg-slate-700/40 text-slate-400 border-navy-600/50',
  Maintenance: 'bg-orange-900/40 text-orange-300 border-orange-700/50',
};

const statusIcons = {
  Active: '🟢',
  Inactive: '⚫',
  Maintenance: '🔧',
};

function isExpiringSoon(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const diff = (d - Date.now()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 60;
}

function isExpired(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export default function VehiclesPage() {
  const { vehicles, drivers, addVehicle, updateVehicle, deleteVehicle } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAlert, setFilterAlert] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_VEHICLE);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const getAlertLevel = (v) => {
    if (isExpired(v.insuranceExpiry) || isExpired(v.registrationExpiry)) return 'critical';
    if (isExpiringSoon(v.insuranceExpiry) || isExpiringSoon(v.registrationExpiry)) return 'warning';
    return 'ok';
  };

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase();
    return (
      `${v.make} ${v.model}`.toLowerCase().includes(q) ||
      v.licensePlate.toLowerCase().includes(q) ||
      v.color.toLowerCase().includes(q)
    ) && (filterStatus === 'all' || v.status === filterStatus)
      && (filterAlert === 'all' || getAlertLevel(v) === filterAlert);
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_VEHICLE);
    setShowForm(true);
  };

  const openEdit = (v) => {
    setEditingId(v.id);
    setForm({ ...EMPTY_VEHICLE, ...v });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, year: Number(form.year), seats: Number(form.seats), mileage: Number(form.mileage) };
    if (editingId) {
      updateVehicle(editingId, payload);
    } else {
      addVehicle(payload);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const fld = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const getDriverName = (driverId) => {
    if (!driverId) return 'Unassigned';
    const d = drivers.find(d => d.id === driverId);
    return d ? d.name : 'Unknown';
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
            placeholder="Search vehicles, plates, colors..."
            className="input pl-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', ...VEHICLE_STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filterStatus === s
                  ? 'bg-gold-500 text-black'
                  : 'bg-navy-700 text-slate-400 hover:text-slate-200 border border-navy-600'
              }`}
            >
              {s === 'all' ? 'All' : s}
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

        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} />
          Add Vehicle
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
      {filtered.length === 0 && (
        <div className="card text-center py-16 text-slate-500">
          <AlertCircle size={32} className="mx-auto mb-3 opacity-30" />
          No vehicles found
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(v => {
          const insExpiring = isExpiringSoon(v.insuranceExpiry);
          const insExpired = isExpired(v.insuranceExpiry);
          const regExpiring = isExpiringSoon(v.registrationExpiry);
          const regExpired = isExpired(v.registrationExpiry);
          const hasAlert = insExpired || insExpiring || regExpired || regExpiring;

          return (
            <div
              key={v.id}
              className={`card hover:border-slate-600 transition-colors ${
                v.status === 'Maintenance' ? 'border-orange-700/40' :
                v.status === 'Inactive' ? 'border-slate-600/40' : ''
              }`}
            >
              {/* Header */}
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
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColors[v.status]}`}>
                  {statusIcons[v.status]} {v.status}
                </span>
              </div>

              {/* Key details */}
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

              {/* Expiry alerts */}
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

              {/* Notes */}
              {v.notes && (
                <p className="text-xs text-slate-500 italic mb-3 line-clamp-2">{v.notes}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(v)}
                  className="btn-secondary flex-1 text-sm flex items-center justify-center gap-2"
                >
                  <Edit3 size={14} />
                  Edit
                </button>
                {/* Quick status cycle */}
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
                  onClick={() => setConfirmDelete(v)}
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

      {/* Add / Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Make</label>
              <input value={form.make} onChange={fld('make')} className="input" required placeholder="Toyota" />
            </div>
            <div>
              <label className="label">Model</label>
              <input value={form.model} onChange={fld('model')} className="input" required placeholder="HiAce High Roof" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Year</label>
              <input type="number" value={form.year} onChange={fld('year')} className="input" min="2000" max="2030" />
            </div>
            <div>
              <label className="label">Color</label>
              <input value={form.color} onChange={fld('color')} className="input" placeholder="White" />
            </div>
            <div>
              <label className="label">Seats</label>
              <input type="number" value={form.seats} onChange={fld('seats')} className="input" min="1" max="50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">License Plate</label>
              <input value={form.licensePlate} onChange={fld('licensePlate')} className="input" required placeholder="AA-3-12345" />
            </div>
            <div>
              <label className="label">Fuel Type</label>
              <select value={form.fuelType} onChange={fld('fuelType')} className="input">
                {FUEL_TYPES.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={fld('status')} className="input">
                {VEHICLE_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Assigned Driver</label>
              <select value={form.assignedDriverId || ''} onChange={fld('assignedDriverId')} className="input">
                <option value="">— Unassigned —</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Current Mileage (km)</label>
            <input type="number" value={form.mileage} onChange={fld('mileage')} className="input" min="0" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Purchase Date</label>
              <input type="date" value={form.purchaseDate} onChange={fld('purchaseDate')} className="input" />
            </div>
            <div>
              <label className="label">Insurance Expiry</label>
              <input type="date" value={form.insuranceExpiry} onChange={fld('insuranceExpiry')} className="input" />
            </div>
            <div>
              <label className="label">Registration Expiry</label>
              <input type="date" value={form.registrationExpiry} onChange={fld('registrationExpiry')} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={fld('notes')} className="input" rows={2} placeholder="Any notes..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              {editingId ? 'Save Changes' : 'Add Vehicle'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Remove Vehicle" size="sm">
        {confirmDelete && (
          <div className="space-y-4">
            <p className="text-slate-300">
              Remove <strong>{confirmDelete.make} {confirmDelete.model}</strong> ({confirmDelete.licensePlate}) from the fleet? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { deleteVehicle(confirmDelete.id); setConfirmDelete(null); }}
                className="btn-danger flex-1"
              >
                Remove
              </button>
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

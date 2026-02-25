import { useState, useMemo } from 'react';
import {
  Plus, Search, MapPin, Clock, User,
  DollarSign, Car, Trash2, Edit3, Navigation,
  AlertCircle, X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { RIDE_STATUSES, SERVICE_TIERS } from '../data/mockData';

const EMPTY_RIDE = {
  status: 'new', date: '', time: '', clientId: '', driverId: '', vehicleId: '',
  passengerName: '', passengerPhone: '', pickupLocation: '', dropoffLocation: '',
  serviceTier: 'airport_vip', priceToClient: '', driverPayout: '', currency: 'USD',
  startKM: '', endKM: '', notes: '',
};

export default function RidesPage({ openNewRide, setOpenNewRide }) {
  const { rides, drivers, clients, vehicles, addRide, updateRide, deleteRide, updateRideStatus, getDriver, getClient } = useApp();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [filterDriver, setFilterDriver] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showForm, setShowForm] = useState(openNewRide);
  const [editingRide, setEditingRide] = useState(null);
  const [form, setForm] = useState(EMPTY_RIDE);
  const [viewRide, setViewRide] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Sync prop
  if (openNewRide && !showForm) {
    setShowForm(true);
    setOpenNewRide(false);
    setForm(EMPTY_RIDE);
    setEditingRide(null);
  }

  const filtered = useMemo(() => {
    return rides
      .filter(r => {
        const q = search.toLowerCase();
        return (
          r.passengerName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          (getClient(r.clientId)?.companyName || '').toLowerCase().includes(q) ||
          (getDriver(r.driverId)?.name || '').toLowerCase().includes(q) ||
          r.pickupLocation.toLowerCase().includes(q)
        );
      })
      .filter(r => filterStatus === 'all' || r.status === filterStatus)
      .filter(r => filterVehicle === 'all' || r.vehicleId === filterVehicle)
      .filter(r => filterDriver === 'all' || r.driverId === filterDriver)
      .filter(r => filterClient === 'all' || r.clientId === filterClient)
      .filter(r => !dateFrom || r.date >= dateFrom)
      .filter(r => !dateTo || r.date <= dateTo)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [rides, search, filterStatus, filterVehicle, filterDriver, filterClient, dateFrom, dateTo, getClient, getDriver]);

  const openEdit = (ride) => {
    setEditingRide(ride.id);
    setForm({ ...EMPTY_RIDE, ...ride, startKM: ride.startKM ?? '', endKM: ride.endKM ?? '' });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      priceToClient: Number(form.priceToClient) || 0,
      driverPayout: Number(form.driverPayout) || 0,
      startKM: form.startKM ? Number(form.startKM) : null,
      endKM: form.endKM ? Number(form.endKM) : null,
    };
    if (editingRide) {
      updateRide(editingRide, data);
    } else {
      addRide(data);
    }
    setShowForm(false);
    setEditingRide(null);
    setForm(EMPTY_RIDE);
  };

  const handleStatusChange = (ride, newStatus) => {
    updateRideStatus(ride.id, newStatus);
  };

  const profit = (Number(form.priceToClient) || 0) - (Number(form.driverPayout) || 0);

  return (
    <div className="p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('rides.searchPlaceholder')}
            className="input pl-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {[{ value: 'all' }, ...RIDE_STATUSES].map(s => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filterStatus === s.value
                  ? 'bg-gold-500 text-black'
                  : 'bg-navy-700 text-slate-400 hover:text-slate-200 border border-navy-600'
              }`}
            >
              {s.value === 'all' ? t('common.all') : t(`status.${s.value}`)}
              {s.value !== 'all' && (
                <span className="ml-1.5 opacity-70">
                  {rides.filter(r => r.status === s.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <select
          value={filterClient}
          onChange={e => setFilterClient(e.target.value)}
          className="input text-sm py-1.5 pr-8 min-w-40"
        >
          <option value="all">All Clients</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.companyName.split('—')[0].trim()}</option>
          ))}
        </select>

        <select
          value={filterDriver}
          onChange={e => setFilterDriver(e.target.value)}
          className="input text-sm py-1.5 pr-8 min-w-40"
        >
          <option value="all">All Drivers</option>
          {drivers.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select
          value={filterVehicle}
          onChange={e => setFilterVehicle(e.target.value)}
          className="input text-sm py-1.5 pr-8 min-w-40"
        >
          <option value="all">All Vehicles</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.licensePlate} · {v.make} {v.model}</option>
          ))}
        </select>

        {(filterClient !== 'all' || filterDriver !== 'all' || filterVehicle !== 'all' || filterStatus !== 'all' || search || dateFrom || dateTo) && (
          <button
            onClick={() => { setFilterClient('all'); setFilterDriver('all'); setFilterVehicle('all'); setFilterStatus('all'); setSearch(''); setDateFrom(''); setDateTo(''); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 bg-navy-700 border border-navy-600 hover:border-red-700/50 transition-colors"
          >
            <X size={13} />
            Clear filters
          </button>
        )}

        <button
          onClick={() => { setShowForm(true); setEditingRide(null); setForm(EMPTY_RIDE); }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          {t('common.newRide')}
        </button>
      </div>

      {/* Date range row */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 whitespace-nowrap">Date range:</span>
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
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-slate-500 hover:text-red-400 transition-colors">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Rides list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card text-center py-16 text-slate-500">
            <AlertCircle size={32} className="mx-auto mb-3 opacity-30" />
            {t('rides.noRides')}
          </div>
        )}
        {filtered.map(ride => {
          const driver = getDriver(ride.driverId);
          const client = getClient(ride.clientId);
          const vehicle = vehicles.find(v => v.id === ride.vehicleId);
          const profit = (ride.priceToClient || 0) - (ride.driverPayout || 0);
          const dist = ride.startKM && ride.endKM ? ride.endKM - ride.startKM : null;

          return (
            <div
              key={ride.id}
              className="card hover:border-navy-600 transition-colors cursor-pointer"
              onClick={() => setViewRide(ride)}
            >
              <div className="flex flex-wrap items-start gap-4">
                {/* Left: ID + status */}
                <div className="flex flex-col gap-1.5 min-w-32">
                  <span className="font-mono text-xs text-slate-500">{ride.id}</span>
                  <StatusBadge status={ride.status} />
                  <span className="text-xs text-slate-600">{ride.date} · {ride.time}</span>
                </div>

                {/* Middle: Passenger + route */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <User size={13} className="text-slate-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-slate-100">{ride.passengerName}</span>
                  </div>
                  {client && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{client.companyName.split('—')[0].trim()}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <MapPin size={13} className="text-slate-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-400 leading-snug">
                      {ride.pickupLocation} <span className="text-slate-600">→</span> {ride.dropoffLocation}
                    </span>
                  </div>
                  {dist && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Navigation size={11} />
                      {dist} km
                    </div>
                  )}
                </div>

                {/* Driver + Vehicle */}
                <div className="flex flex-col gap-1 min-w-36">
                  <div className="flex items-center gap-2">
                    <Car size={13} className="text-slate-500" />
                    <span className="text-sm text-slate-300">
                      {driver?.name || <span className="text-red-400 text-xs">{t('common.unassigned')}</span>}
                    </span>
                  </div>
                  {vehicle ? (
                    <>
                      <span className="text-xs text-slate-500">{vehicle.make} {vehicle.model} {vehicle.year}</span>
                      <span className="text-xs font-mono text-gold-600">{vehicle.licensePlate}</span>
                    </>
                  ) : driver && (
                    <>
                      <span className="text-xs text-slate-500">{driver.vehicleModel.split(' ').slice(0, 3).join(' ')}</span>
                      <span className="text-xs text-slate-600">{driver.licensePlate}</span>
                    </>
                  )}
                </div>

                {/* Financial */}
                <div className="text-right flex-shrink-0 min-w-24">
                  <p className="text-lg font-bold text-gold-400">${ride.priceToClient || '—'}</p>
                  {ride.driverPayout && (
                    <p className="text-xs text-slate-500">{t('common.driver')}: ${ride.driverPayout}</p>
                  )}
                  {ride.status === 'completed' && ride.driverPayout && (
                    <p className={`text-xs font-semibold mt-0.5 ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      +${profit} {t('common.profit')}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(ride)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-navy-700 hover:bg-navy-600 text-slate-400 hover:text-white transition-colors border border-navy-600">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => setConfirmDelete(ride)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-navy-700 hover:bg-red-900/50 text-slate-400 hover:text-red-400 transition-colors border border-navy-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Status progression */}
              {['new','confirmed','onway','arrived'].includes(ride.status) && (
                <div className="mt-3 pt-3 border-t border-navy-600/50 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <span className="text-xs text-slate-500">{t('rides.moveTo')}</span>
                  {RIDE_STATUSES.filter(s => s.value !== ride.status && s.value !== 'cancelled').map(s => (
                    <button
                      key={s.value}
                      onClick={() => handleStatusChange(ride, s.value)}
                      className="text-xs px-2 py-1 rounded bg-navy-700 hover:bg-navy-600 border border-navy-600 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {t(`status.${s.value}`)}
                    </button>
                  ))}
                  <button
                    onClick={() => handleStatusChange(ride, 'cancelled')}
                    className="text-xs px-2 py-1 rounded bg-navy-700 hover:bg-red-900/30 border border-navy-600 text-slate-500 hover:text-red-400 transition-colors ml-auto"
                  >
                    {t('status.cancelled')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New / Edit Ride Form */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditingRide(null); }} title={editingRide ? t('rides.editRide') : t('rides.newRide')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('rides.client')}</label>
              <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} className="input" required>
                <option value="">Select client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.companyName.split('—')[0].trim()}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('rides.assignDriver')}</label>
              <select value={form.driverId} onChange={e => setForm(f => ({ ...f, driverId: e.target.value }))} className="input">
                <option value="">{t('common.unassigned')}</option>
                {drivers.filter(d => d.status === 'Active').map(d => (
                  <option key={d.id} value={d.id}>{d.name} — {d.vehicleModel.split(' ').slice(0, 2).join(' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Vehicle</label>
            <select value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))} className="input">
              <option value="">— No specific vehicle —</option>
              {vehicles.filter(v => v.status === 'Active').map(v => (
                <option key={v.id} value={v.id}>{v.make} {v.model} ({v.year}) · {v.licensePlate}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('rides.passenger')}</label>
              <input value={form.passengerName} onChange={e => setForm(f => ({ ...f, passengerName: e.target.value }))} className="input" required placeholder="Mr. Smith" />
            </div>
            <div>
              <label className="label">{t('rides.passengerPhone')}</label>
              <input value={form.passengerPhone} onChange={e => setForm(f => ({ ...f, passengerPhone: e.target.value }))} className="input" placeholder="+251..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('common.date')}</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input" required />
            </div>
            <div>
              <label className="label">{t('common.time')}</label>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="input" required />
            </div>
          </div>

          <div>
            <label className="label">{t('rides.pickupLocation')}</label>
            <input value={form.pickupLocation} onChange={e => setForm(f => ({ ...f, pickupLocation: e.target.value }))} className="input" required placeholder="e.g. Hilton Addis Ababa, Menelik II Ave" />
          </div>
          <div>
            <label className="label">{t('rides.dropoffLocation')}</label>
            <input value={form.dropoffLocation} onChange={e => setForm(f => ({ ...f, dropoffLocation: e.target.value }))} className="input" required placeholder="e.g. Bole International Airport" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">{t('rides.serviceTier')}</label>
              <select value={form.serviceTier} onChange={e => {
                const tier = SERVICE_TIERS.find(t => t.value === e.target.value);
                setForm(f => ({ ...f, serviceTier: e.target.value, priceToClient: tier?.price || f.priceToClient }));
              }} className="input">
                {SERVICE_TIERS.map(t => <option key={t.value} value={t.value}>{t.label} {t.price > 0 ? `($${t.price})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('rides.priceToClient')}</label>
              <input type="number" value={form.priceToClient} onChange={e => setForm(f => ({ ...f, priceToClient: e.target.value }))} className="input" placeholder="0" min="0" />
            </div>
            <div>
              <label className="label">{t('rides.driverPayout')}</label>
              <input type="number" value={form.driverPayout} onChange={e => setForm(f => ({ ...f, driverPayout: e.target.value }))} className="input" placeholder="0" min="0" />
            </div>
          </div>

          {/* Profit preview */}
          {(form.priceToClient || form.driverPayout) && (
            <div className={`flex items-center gap-2 p-3 rounded-lg border ${profit >= 0 ? 'bg-green-900/20 border-green-700/40' : 'bg-red-900/20 border-red-700/40'}`}>
              <DollarSign size={16} className={profit >= 0 ? 'text-green-400' : 'text-red-400'} />
              <span className="text-sm">
                {t('rides.netProfit')}: <strong className={profit >= 0 ? 'text-green-400' : 'text-red-400'}>${profit}</strong>
                {' '}({form.priceToClient > 0 ? Math.round((profit / form.priceToClient) * 100) : 0}% {t('common.margin')})
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('rides.startKM')}</label>
              <input type="number" value={form.startKM} onChange={e => setForm(f => ({ ...f, startKM: e.target.value }))} className="input" placeholder="e.g. 45210" />
            </div>
            <div>
              <label className="label">{t('rides.endKM')}</label>
              <input type="number" value={form.endKM} onChange={e => setForm(f => ({ ...f, endKM: e.target.value }))} className="input" placeholder="e.g. 45248" />
            </div>
          </div>

          <div>
            <label className="label">{t('common.status')}</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input">
              {RIDE_STATUSES.map(s => <option key={s.value} value={s.value}>{t(`status.${s.value}`)}</option>)}
            </select>
          </div>

          <div>
            <label className="label">{t('rides.notes')}</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input resize-none" rows={3} placeholder="Any special instructions..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              {editingRide ? t('common.saveChanges') : t('common.bookRide')}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingRide(null); }} className="btn-secondary">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Ride Detail */}
      <Modal open={!!viewRide} onClose={() => setViewRide(null)} title={`Ride ${viewRide?.id}`}>
        {viewRide && (() => {
          const driver = getDriver(viewRide.driverId);
          const client = getClient(viewRide.clientId);
          const vehicle = vehicles.find(v => v.id === viewRide.vehicleId);
          const profit = (viewRide.priceToClient || 0) - (viewRide.driverPayout || 0);
          const dist = viewRide.startKM && viewRide.endKM ? viewRide.endKM - viewRide.startKM : null;
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <StatusBadge status={viewRide.status} />
                <span className="text-xl font-bold text-gold-400">${viewRide.priceToClient}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: `${t('common.date')} & ${t('common.time')}`, value: `${viewRide.date} at ${viewRide.time}` },
                  { label: t('rides.passenger'), value: viewRide.passengerName },
                  { label: t('rides.passengerPhone'), value: viewRide.passengerPhone || '—' },
                  { label: t('rides.client'), value: client?.companyName || '—' },
                  { label: t('common.driver'), value: driver?.name || t('common.unassigned') },
                  { label: 'Vehicle', value: vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.licensePlate}` : driver?.vehicleModel || '—' },
                  { label: t('rides.pickupLocation'), value: viewRide.pickupLocation },
                  { label: t('rides.dropoffLocation'), value: viewRide.dropoffLocation },
                  { label: t('rides.priceToClient'), value: `$${viewRide.priceToClient}` },
                  { label: t('rides.driverPayout'), value: `$${viewRide.driverPayout || 0}` },
                  { label: t('rides.netProfit'), value: `$${profit}` },
                  { label: t('common.distance'), value: dist ? `${dist} km` : '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-sm text-slate-200 font-medium mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              {viewRide.notes && (
                <div className="p-3 bg-navy-700 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">{t('rides.notes')}</p>
                  <p className="text-sm text-slate-300">{viewRide.notes}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setViewRide(null); openEdit(viewRide); }} className="btn-secondary flex-1">{t('common.edit')}</button>
                <button onClick={() => setViewRide(null)} className="btn-primary flex-1">{t('common.close')}</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title={t('rides.deleteRide')} size="sm">
        {confirmDelete && (
          <div className="space-y-4">
            <p className="text-slate-300">
              {t('rides.deleteConfirm')} <strong>{confirmDelete.id}</strong> {t('rides.deleteConfirmFor')} <strong>{confirmDelete.passengerName}</strong>? {t('rides.deleteCannotUndo')}
            </p>
            <div className="flex gap-3">
              <button onClick={() => { deleteRide(confirmDelete.id); setConfirmDelete(null); }} className="btn-danger flex-1">{t('common.delete')}</button>
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">{t('common.cancel')}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

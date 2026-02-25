import { useState } from 'react';
import {
  Plus, Search, Edit3, Trash2, Phone,
  Mail, DollarSign, AlertCircle, CreditCard, X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import Modal from '../components/common/Modal';
import { PAYMENT_TERMS } from '../data/mockData';

const EMPTY_CLIENT = {
  companyName: '', contactPerson: '', whatsapp: '', email: '',
  paymentTerms: 'Cash', contractRate: '', currency: 'USD', tier: 'Premium', notes: '',
};

const TIERS = ['Airport VIP', 'Premium', 'Corporate', 'VIP Corporate', 'School'];

const tierColor = {
  'Airport VIP':  'bg-blue-900/40 text-blue-300',
  'Premium':      'bg-purple-900/40 text-purple-300',
  'Corporate':    'bg-gold-500/20 text-gold-400',
  'VIP Corporate':'bg-orange-900/40 text-orange-300',
  'School':       'bg-green-900/40 text-green-300',
};

export default function ClientsPage() {
  const { clients, rides, addClient, updateClient, deleteClient } = useApp();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [filterAlert, setFilterAlert] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_CLIENT);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewClient, setViewClient] = useState(null);

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (
      c.companyName.toLowerCase().includes(q) ||
      c.contactPerson.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    ) && (filterAlert === 'all' || getAlertLevel(c) === filterAlert)
      && (filterTier === 'all' || c.tier === filterTier)
      && (filterPayment === 'all' || c.paymentTerms === filterPayment);
  });

  const openEdit = (c) => {
    setEditingId(c.id);
    setForm({ ...EMPTY_CLIENT, ...c });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, contractRate: Number(form.contractRate) || 0 };
    if (editingId) {
      updateClient(editingId, data);
    } else {
      addClient(data);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_CLIENT);
  };

  const getClientRides = (id) => rides.filter(r => r.clientId === id);
  const getClientRevenue = (id) =>
    rides.filter(r => r.clientId === id && r.status === 'completed')
      .reduce((s, r) => s + (r.priceToClient || 0), 0);

  const getAlertLevel = (client) => {
    const total = rides.filter(r => r.clientId === client.id).length;
    const completed = rides.filter(r => r.clientId === client.id && r.status === 'completed').length;
    if (total === 0) return 'critical';
    if (completed === 0) return 'warning';
    return 'ok';
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('clients.searchPlaceholder')}
            className="input pl-9 text-sm"
          />
        </div>
        <select
          value={filterTier}
          onChange={e => setFilterTier(e.target.value)}
          className="input text-sm py-1.5 pr-8 min-w-40"
        >
          <option value="all">All Tiers</option>
          {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          value={filterPayment}
          onChange={e => setFilterPayment(e.target.value)}
          className="input text-sm py-1.5 pr-8 min-w-44"
        >
          <option value="all">All Payment Terms</option>
          {PAYMENT_TERMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <div className="flex items-center gap-1">
          {[
            { value: 'all',      label: 'All Levels' },
            { value: 'critical', label: '🔴 No Rides' },
            { value: 'warning',  label: '🟡 No Revenue' },
            { value: 'ok',       label: '🟢 Active' },
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

        {(search || filterAlert !== 'all' || filterTier !== 'all' || filterPayment !== 'all') && (
          <button
            onClick={() => { setSearch(''); setFilterAlert('all'); setFilterTier('all'); setFilterPayment('all'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 bg-navy-700 border border-navy-600 hover:border-red-700/50 transition-colors"
          >
            <X size={13} />
            Clear filters
          </button>
        )}

        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_CLIENT); }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          {t('clients.addClient')}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card py-3">
          <p className="text-2xl font-bold text-white">{clients.length}</p>
          <p className="text-xs text-slate-500">{t('clients.totalClients')}</p>
        </div>
        <div className="card py-3">
          <p className="text-2xl font-bold text-gold-400">
            ${clients.reduce((s, c) => s + (c.totalSpent || 0), 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">{t('clients.totalRevenue')}</p>
        </div>
        <div className="card py-3">
          <p className="text-2xl font-bold text-blue-400">
            {clients.filter(c => c.paymentTerms === 'Monthly Invoice').length}
          </p>
          <p className="text-xs text-slate-500">{t('clients.contractClients')}</p>
        </div>
      </div>

      {/* Client grid */}
      {filtered.length === 0 && (
        <div className="card text-center py-16 text-slate-500">
          <AlertCircle size={32} className="mx-auto mb-3 opacity-30" />
          {t('clients.noClients')}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered
          .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
          .map(client => {
            const clientRides = getClientRides(client.id);
            const revenue = getClientRevenue(client.id);
            const activeRides = clientRides.filter(r => ['onway','confirmed','arrived'].includes(r.status)).length;

            return (
              <div
                key={client.id}
                className="card hover:border-navy-600 transition-colors cursor-pointer"
                onClick={() => setViewClient(client)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
                      {client.companyName[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm leading-snug max-w-xs">
                        {client.companyName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{client.contactPerson}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierColor[client.tier] || 'bg-navy-700 text-slate-300'}`}>
                      {client.tier}
                    </span>
                    {activeRides > 0 && (
                      <span className="text-xs bg-green-900/40 text-green-300 border border-green-700/50 px-2 py-0.5 rounded-full">
                        {activeRides} {t('common.active')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone size={13} />
                    <span className="text-xs truncate">{client.whatsapp}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail size={13} />
                    <span className="text-xs truncate">{client.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <CreditCard size={13} />
                    <span className="text-xs">{client.paymentTerms}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <DollarSign size={13} />
                    <span className="text-xs">${client.contractRate}/ride</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-navy-600/50">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-lg font-bold text-gold-400">${revenue.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{t('common.revenue')}</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{clientRides.length}</p>
                      <p className="text-xs text-slate-500">{t('common.rides')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(client)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
                      <Edit3 size={12} /> {t('common.edit')}
                    </button>
                    <button onClick={() => setConfirmDelete(client)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-navy-700 hover:bg-red-900/30 border border-navy-600 text-slate-400 hover:text-red-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* View Client Modal */}
      <Modal open={!!viewClient} onClose={() => setViewClient(null)} title={t('clients.clientDetails')}>
        {viewClient && (() => {
          const clientRides = getClientRides(viewClient.id);
          const revenue = getClientRevenue(viewClient.id);
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-2xl">
                  {viewClient.companyName[0]}
                </div>
                <div>
                  <h3 className="font-bold text-white">{viewClient.companyName}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${tierColor[viewClient.tier] || ''}`}>{viewClient.tier}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t('clients.contactPerson'), value: viewClient.contactPerson },
                  { label: t('clients.whatsapp'), value: viewClient.whatsapp },
                  { label: t('clients.email'), value: viewClient.email || '—' },
                  { label: t('clients.paymentTerms'), value: viewClient.paymentTerms },
                  { label: t('clients.contractRate'), value: `$${viewClient.contractRate}/ride` },
                  { label: t('clients.since'), value: viewClient.joinDate },
                  { label: t('clients.totalRides'), value: clientRides.length },
                  { label: t('clients.totalRevenue'), value: `$${revenue.toLocaleString()}` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-sm text-slate-200 font-medium mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              {viewClient.notes && (
                <div className="p-3 bg-navy-700 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">{t('clients.notes')}</p>
                  <p className="text-sm text-slate-300">{viewClient.notes}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setViewClient(null); openEdit(viewClient); }} className="btn-secondary flex-1">{t('common.edit')}</button>
                <button onClick={() => setViewClient(null)} className="btn-primary flex-1">{t('common.close')}</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Add/Edit Form */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} title={editingId ? t('clients.editClient') : t('clients.addClient')} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{t('clients.companyName')}</label>
            <input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} className="input" required placeholder="UNECA, Hilton Addis, etc." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('clients.contactPerson')}</label>
              <input value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} className="input" required placeholder="Ms. Sarah Johnson" />
            </div>
            <div>
              <label className="label">{t('clients.tier')}</label>
              <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))} className="input">
                {TIERS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('clients.whatsapp')}</label>
              <input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} className="input" placeholder="+251911..." />
            </div>
            <div>
              <label className="label">{t('clients.email')}</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" placeholder="transport@org.et" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('clients.paymentTerms')}</label>
              <select value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))} className="input">
                {PAYMENT_TERMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('clients.contractRate')}</label>
              <input type="number" value={form.contractRate} onChange={e => setForm(f => ({ ...f, contractRate: e.target.value }))} className="input" placeholder="0" min="0" />
            </div>
          </div>
          <div>
            <label className="label">{t('clients.notes')}</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input resize-none" rows={3} placeholder="Special requirements, contact notes..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editingId ? t('common.saveChanges') : t('clients.addClient')}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('common.cancel')}</button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title={t('clients.removeClient')} size="sm">
        {confirmDelete && (
          <div className="space-y-4">
            <p className="text-slate-300">
              {t('clients.removeConfirm')} <strong>{confirmDelete.companyName}</strong>? {t('clients.removeCannotUndo')}
            </p>
            <div className="flex gap-3">
              <button onClick={() => { deleteClient(confirmDelete.id); setConfirmDelete(null); }} className="btn-danger flex-1">{t('common.remove')}</button>
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">{t('common.cancel')}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

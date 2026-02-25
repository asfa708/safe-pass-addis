import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, DollarSign, Car, Users, Award, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RIDE_STATUSES } from '../data/mockData';

const COLORS = ['#FFD700', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-sm shadow-xl">
        <p className="text-slate-300 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' && p.name?.includes('$') ? `$${p.value}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const { rides, drivers, clients, getDriver, getClient } = useApp();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredRides = useMemo(() => rides.filter(r =>
    (!dateFrom || r.date >= dateFrom) && (!dateTo || r.date <= dateTo)
  ), [rides, dateFrom, dateTo]);

  const completedRides = useMemo(() => filteredRides.filter(r => r.status === 'completed'), [filteredRides]);

  const totalRevenue = completedRides.reduce((s, r) => s + (r.priceToClient || 0), 0);
  const totalPayout = completedRides.reduce((s, r) => s + (r.driverPayout || 0), 0);
  const totalProfit = totalRevenue - totalPayout;
  const margin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  // Revenue by client
  const clientRevenue = useMemo(() => {
    const map = {};
    completedRides.forEach(r => {
      const c = getClient(r.clientId);
      const name = c ? c.companyName.split('—')[0].trim().split(' ').slice(0, 2).join(' ') : 'Unknown';
      map[name] = (map[name] || 0) + (r.priceToClient || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [completedRides, getClient]);

  // Revenue by driver
  const driverPerformance = useMemo(() => {
    const map = {};
    completedRides.forEach(r => {
      const d = getDriver(r.driverId);
      const name = d ? d.name.split(' ')[0] : 'Unknown';
      if (!map[name]) map[name] = { name, rides: 0, revenue: 0, payout: 0 };
      map[name].rides++;
      map[name].revenue += r.priceToClient || 0;
      map[name].payout += r.driverPayout || 0;
    });
    return Object.values(map).sort((a, b) => b.rides - a.rides);
  }, [completedRides, getDriver]);

  // Status distribution for pie chart
  const statusData = useMemo(() => {
    const map = {};
    filteredRides.forEach(r => { map[r.status] = (map[r.status] || 0) + 1; });
    return Object.entries(map).map(([status, count]) => {
      const info = RIDE_STATUSES.find(s => s.value === status);
      return { name: info?.label || status, value: count };
    });
  }, [filteredRides]);

  // Service tier breakdown
  const tierData = useMemo(() => {
    const map = {};
    completedRides.forEach(r => {
      const tier = r.serviceTier || 'custom';
      if (!map[tier]) map[tier] = { name: tier.replace('_', ' ').toUpperCase(), revenue: 0, count: 0 };
      map[tier].revenue += r.priceToClient || 0;
      map[tier].count++;
    });
    return Object.values(map);
  }, [completedRides]);

  // Top performing rides
  const topRides = useMemo(() => {
    return [...completedRides]
      .sort((a, b) => ((b.priceToClient || 0) - (b.driverPayout || 0)) - ((a.priceToClient || 0) - (a.driverPayout || 0)))
      .slice(0, 5);
  }, [completedRides]);

  return (
    <div className="p-6 space-y-6">
      {/* Date range filter */}
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
          <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 bg-navy-700 border border-navy-600 hover:border-red-700/50 transition-colors">
            <X size={13} /> Clear filters
          </button>
        )}
        {(dateFrom || dateTo) && (
          <span className="text-xs text-slate-500 ml-2">
            Showing {filteredRides.length} of {rides.length} rides
          </span>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-gold-400', bg: 'bg-gold-500/10' },
          { label: 'Net Profit', value: `$${totalProfit.toLocaleString()}`, sub: `${margin}% margin`, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Driver Payouts', value: `$${totalPayout.toLocaleString()}`, icon: Car, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Completed Rides', value: completedRides.length, sub: `of ${rides.length} total`, icon: Award, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm">{label}</p>
                <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
                {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
              </div>
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon size={20} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Client */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Revenue by Client ($)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={clientRevenue} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Revenue $" fill="#FFD700" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ride status pie */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Ride Status Distribution</h2>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {statusData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 truncate">{entry.name}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-200">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Driver performance */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Driver Performance</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={driverPerformance} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rides" name="Rides" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="payout" name="Payout $" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Service tier */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Revenue by Service Tier</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tierData} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue $" fill="#a855f7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="count" name="Count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top rides table */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Most Profitable Rides</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-navy-600">
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">Passenger</th>
                <th className="pb-2 pr-4">Client</th>
                <th className="pb-2 pr-4">Driver</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4 text-right">Revenue</th>
                <th className="pb-2 text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-600/50">
              {topRides.map(ride => {
                const driver = getDriver(ride.driverId);
                const client = getClient(ride.clientId);
                const profit = (ride.priceToClient || 0) - (ride.driverPayout || 0);
                return (
                  <tr key={ride.id} className="text-slate-300 hover:bg-navy-700/60">
                    <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">{ride.id}</td>
                    <td className="py-2.5 pr-4">{ride.passengerName}</td>
                    <td className="py-2.5 pr-4 text-slate-400 text-xs">{client?.companyName?.split('—')[0].trim() || '—'}</td>
                    <td className="py-2.5 pr-4 text-slate-400">{driver?.name || '—'}</td>
                    <td className="py-2.5 pr-4 text-slate-500 text-xs">{ride.date}</td>
                    <td className="py-2.5 pr-4 text-right font-semibold text-gold-400">${ride.priceToClient}</td>
                    <td className="py-2.5 text-right font-bold text-green-400">${profit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client revenue table */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Client Revenue Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-navy-600">
                <th className="pb-2 pr-4">Client</th>
                <th className="pb-2 pr-4">Payment Terms</th>
                <th className="pb-2 pr-4 text-right">Rides</th>
                <th className="pb-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-600/50">
              {clients
                .map(c => {
                  const clientRides = filteredRides.filter(r => r.clientId === c.id && r.status === 'completed');
                  const rev = clientRides.reduce((s, r) => s + (r.priceToClient || 0), 0);
                  return { ...c, rideCount: clientRides.length, revenue: rev };
                })
                .sort((a, b) => b.revenue - a.revenue)
                .map(c => (
                  <tr key={c.id} className="text-slate-300 hover:bg-navy-700/60">
                    <td className="py-2.5 pr-4">{c.companyName.split('—')[0].trim()}</td>
                    <td className="py-2.5 pr-4 text-xs text-slate-400">{c.paymentTerms}</td>
                    <td className="py-2.5 pr-4 text-right">{c.rideCount}</td>
                    <td className="py-2.5 text-right font-bold text-gold-400">${c.revenue.toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

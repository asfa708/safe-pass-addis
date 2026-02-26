// All Anthropic API calls go through the Netlify serverless proxy at
// /.netlify/functions/chat so the API key never touches the browser and
// there are no CORS issues.

const PROXY_URL = '/api/chat';

/* ─── Context builder ────────────────────────────────────────────────────── */

export function buildFleetContext({ rides, drivers, vehicles, clients, maintenance }) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
  const in30 = new Date(now.getTime() + 30 * 86400000);
  const in60 = new Date(now.getTime() + 60 * 86400000);

  const getDriverName = (id) => drivers.find(d => d.id === id)?.name || 'UNASSIGNED';
  const getClientName = (id) => clients.find(c => c.id === id)?.companyName || 'Unknown';

  const completedRides = rides.filter(r => r.status === 'completed' || r.status === 'Completed');
  const totalRevenue = completedRides.reduce((s, r) => s + (r.priceToClient || 0), 0);
  const totalPayout  = completedRides.reduce((s, r) => s + (r.driverPayout  || 0), 0);
  const netProfit    = totalRevenue - totalPayout;
  const unassignedRides = rides.filter(r => !r.driverId && ['new', 'New Request', 'Scheduled'].includes(r.status));
  const pendingRevenue  = unassignedRides.reduce((s, r) => s + (r.priceToClient || 0), 0);

  const driversSection = drivers.map(d => {
    const completed = rides.filter(r => r.driverId === d.id && ['completed','Completed'].includes(r.status)).length;
    const active    = rides.filter(r => r.driverId === d.id && ['onway','confirmed','arrived','In Progress'].includes(r.status)).length;
    const statusFlag = d.status === 'Suspended' ? '🔴 SUSPENDED' : d.status === 'On Leave' ? '🟡 ON LEAVE' : '🟢 Active';
    return `  ${statusFlag} #${d.employeeNumber || d.id} ${d.name} | ${d.vehicleModel || ''} | Plate: ${d.licensePlate || '—'} | Rating: ${d.rating || '—'}⭐ | Commission: ${d.commissionPercent || 0}% | Completed: ${completed} | Active: ${active} | Phone: ${d.phone || '—'}`;
  }).join('\n');

  const vehiclesSection = vehicles.map(v => {
    const driver = drivers.find(d => d.id === v.assignedDriverId);
    const insExp = v.insuranceExpiry    ? new Date(v.insuranceExpiry)    : null;
    const regExp = v.registrationExpiry ? new Date(v.registrationExpiry) : null;
    const insFlag = insExp ? (insExp < now ? '⚠️EXPIRED' : insExp < in30 ? '⚠️<30d' : insExp < in60 ? '⚠️<60d' : '✓') : '?';
    const regFlag = regExp ? (regExp < now ? '⚠️EXPIRED' : regExp < in30 ? '⚠️<30d' : regExp < in60 ? '⚠️<60d' : '✓') : '?';
    const statusIcon = v.status === 'Active' ? '🟢' : v.status === 'Maintenance' ? '🔧' : '⚫';
    const mileage = v.mileage != null ? Number(v.mileage).toLocaleString() + 'km' : '—';
    return `  ${statusIcon} ${v.licensePlate || '—'} | ${v.make || ''} ${v.model || ''} ${v.year || ''} | ${v.seats || '?'} seats | ${v.fuelType || '—'} | Driver: ${driver?.name || 'Unassigned'} | Mileage: ${mileage} | Ins: ${v.insuranceExpiry || '—'}[${insFlag}] | Reg: ${v.registrationExpiry || '—'}[${regFlag}]`;
  }).join('\n');

  const maintenanceSection = (maintenance || []).map(m => {
    const kmLeft = (m.nextServiceKM || 0) - (m.currentKM || 0);
    const crits  = ['tireStatus','brakeStatus','acStatus'].filter(k => m[k] === 'Critical').map(k => k.replace('Status',''));
    const warns  = ['tireStatus','brakeStatus','acStatus'].filter(k => m[k] === 'Needs Check').map(k => k.replace('Status',''));
    const flags  = [...crits.map(f => f+'🔴'), ...warns.map(f => f+'⚠️')].join(', ') || '✓ All Good';
    return `  ${m.vehicleName || '—'} | Last svc: ${m.lastServiceDate || '—'} | Next: ${m.nextServiceKM || '?'}km | Now: ${m.currentKM || 0}km (${kmLeft > 0 ? kmLeft + 'km left' : Math.abs(kmLeft) + 'km OVERDUE'}) | ${flags}`;
  }).join('\n');

  const ridesSection = rides.map(r => {
    const needsDriver = !r.driverId ? ' ⚠️NEEDS DRIVER' : '';
    return `  ${r.id} | ${r.date || '—'} ${r.time || ''} | ${String(r.status || '').toUpperCase()}${needsDriver} | ${r.serviceTier || '—'} | "${r.passengerName || '—'}" | Client: ${getClientName(r.clientId)} | Driver: ${getDriverName(r.driverId)} | ${r.pickupLocation || '—'} → ${r.dropoffLocation || '—'} | $${r.priceToClient || '?'}`;
  }).join('\n');

  const clientsSection = clients.map(c => {
    const clientRides = rides.filter(r => r.clientId === c.id);
    return `  ${c.companyName || '—'} | ${c.tier || '—'} | Rate: $${c.contractRate || '?'}/ride | Spent: $${(c.totalSpent || 0).toLocaleString()} | Total rides: ${clientRides.length}`;
  }).join('\n');

  const margin = totalRevenue > 0 ? Math.round(netProfit / totalRevenue * 100) : 0;

  return `You are the AI Operations Manager for Theodorus — a premium fleet management and mobility company in Addis Ababa, Ethiopia. You have full real-time access to fleet data and provide intelligent analysis, smart dispatch, risk detection, and strategic insights.

Today: ${today} (Tomorrow: ${tomorrow})

═══ DRIVERS (${drivers.length} total · ${drivers.filter(d => d.status === 'Active').length} active) ═══
${driversSection || '  No drivers.'}

═══ VEHICLES (${vehicles.length} total · ${vehicles.filter(v => v.status === 'Active').length} active) ═══
${vehiclesSection || '  No vehicles.'}

═══ MAINTENANCE ═══
${maintenanceSection || '  No records.'}

═══ RIDES (${rides.length} total · ${unassignedRides.length} unassigned) ═══
${ridesSection || '  No rides.'}

═══ CLIENTS (${clients.length}) ═══
${clientsSection || '  No clients.'}

═══ FINANCIALS ═══
  Revenue: $${totalRevenue.toLocaleString()} | Payouts: $${totalPayout.toLocaleString()} | Net Profit: $${netProfit.toLocaleString()} (${margin}% margin)
  Unassigned revenue at risk: $${pendingRevenue} across ${unassignedRides.length} ride(s)

DISPATCH RULES: Only assign Active drivers. Airport VIP → prefer Land Cruiser Prado. School runs → prefer HiAce. Match vehicle capacity to passenger count.

Be concise, specific, and proactive. Use driver names and ride IDs. Format responses with markdown headers and bullets.`;
}

/* ─── Proxy call (all requests go through Netlify function) ──────────────── */

export async function callClaude(model, systemPrompt, messages, signal) {
  const msgArray = typeof messages === 'string'
    ? [{ role: 'user', content: messages }]
    : messages;

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, system: systemPrompt, messages: msgArray }),
    signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }

  return data?.text ?? '';
}

/* ─── Local risk computation (no API) ───────────────────────────────────── */

export function computeRiskAlerts({ rides, drivers, vehicles, maintenance }) {
  const alerts = [];
  const now      = new Date();
  const in30     = new Date(now.getTime() + 30 * 86400000);
  const in60     = new Date(now.getTime() + 60 * 86400000);
  const today    = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];

  drivers.filter(d => d.status === 'Suspended').forEach(d => {
    const hasUpcoming = rides.some(r => r.driverId === d.id && ['new','confirmed','onway','Scheduled'].includes(r.status));
    alerts.push({
      id: `suspended-${d.id}`, severity: hasUpcoming ? 'critical' : 'warning', category: 'driver',
      title: `${d.name} suspended`,
      detail: hasUpcoming ? 'Has upcoming rides — reassign immediately' : 'Not available for dispatch',
    });
  });

  vehicles.filter(v => v.status === 'Maintenance').forEach(v => {
    const driver = drivers.find(d => d.id === v.assignedDriverId);
    alerts.push({
      id: `maint-${v.id}`, severity: 'critical', category: 'vehicle',
      title: `${v.make} ${v.model} in maintenance`,
      detail: `${v.licensePlate}${driver ? ` · ${driver.name}` : ''}`,
    });
  });

  vehicles.forEach(v => {
    if (v.insuranceExpiry) {
      const exp = new Date(v.insuranceExpiry);
      if (exp < now)        alerts.push({ id: `ins-exp-${v.id}`, severity: 'critical', category: 'document', title: 'Insurance EXPIRED',          detail: `${v.licensePlate} — expired ${v.insuranceExpiry}` });
      else if (exp < in30)  alerts.push({ id: `ins-30-${v.id}`,  severity: 'warning',  category: 'document', title: 'Insurance expiring <30 days', detail: `${v.licensePlate} — expires ${v.insuranceExpiry}` });
      else if (exp < in60)  alerts.push({ id: `ins-60-${v.id}`,  severity: 'info',     category: 'document', title: 'Insurance expiring <60 days', detail: `${v.licensePlate} — expires ${v.insuranceExpiry}` });
    }
    if (v.registrationExpiry) {
      const exp = new Date(v.registrationExpiry);
      if (exp < now)        alerts.push({ id: `reg-exp-${v.id}`, severity: 'critical', category: 'document', title: 'Registration EXPIRED',          detail: `${v.licensePlate} — expired ${v.registrationExpiry}` });
      else if (exp < in30)  alerts.push({ id: `reg-30-${v.id}`,  severity: 'warning',  category: 'document', title: 'Registration expiring <30 days', detail: `${v.licensePlate} — expires ${v.registrationExpiry}` });
    }
  });

  (maintenance || []).forEach(m => {
    const crits = ['tireStatus','brakeStatus','acStatus'].filter(k => m[k] === 'Critical').map(k => k.replace('Status',''));
    if (crits.length) alerts.push({ id: `crit-${m.id}`, severity: 'critical', category: 'maintenance', title: 'Critical maintenance needed', detail: `${m.vehicleName}: ${crits.join(', ')}` });

    const warns = ['tireStatus','brakeStatus','acStatus'].filter(k => m[k] === 'Needs Check').map(k => k.replace('Status',''));
    if (warns.length && !crits.length) alerts.push({ id: `warn-${m.id}`, severity: 'warning', category: 'maintenance', title: 'Maintenance check needed', detail: `${m.vehicleName}: ${warns.join(', ')}` });

    if ((m.currentKM || 0) > (m.nextServiceKM || Infinity)) {
      const over = (m.currentKM || 0) - (m.nextServiceKM || 0);
      alerts.push({ id: `km-${m.id}`, severity: 'warning', category: 'maintenance', title: 'Service overdue', detail: `${m.vehicleName}: ${over.toLocaleString()}km past interval` });
    }
  });

  const unassigned = rides.filter(r => !r.driverId && (r.date === today || r.date === tomorrow));
  if (unassigned.length)
    alerts.push({ id: 'unassigned', severity: 'warning', category: 'dispatch', title: `${unassigned.length} ride(s) need drivers`, detail: unassigned.map(r => `${r.id} at ${r.time}`).join(', ') });

  const order = { critical: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}

/* ─── Named generators ───────────────────────────────────────────────────── */

export function generateDailyBriefing(model, systemPrompt) {
  const d = new Date().toDateString();
  return callClaude(model, systemPrompt,
    `Generate a concise daily operations briefing for ${d}.

## Daily Briefing — ${d}

Cover:
**Fleet Status** — driver availability, suspensions, leaves
**Today's Rides** — scheduled, active, completed
**🚨 Critical Alerts** — expiring docs, maintenance, unassigned rides
**📋 Top 3 Priorities** — ranked action items

Be specific with names and IDs. Keep under 300 words. Use markdown.`);
}

export function generateDispatchSuggestions(model, systemPrompt) {
  return callClaude(model, systemPrompt,
    `Analyze all unassigned rides. For each, recommend the best available Active driver.

For each unassigned ride state:
- Ride details (ID, time, service tier, pickup → dropoff)
- Recommended driver (name + employee number) with reasoning
- Vehicle suitability

If all rides are assigned, summarize dispatch status and driver availability. Use markdown.`);
}

export function generatePricingSuggestions(model, systemPrompt) {
  return callClaude(model, systemPrompt,
    `Analyze our pricing and provide 6-8 specific dynamic pricing recommendations.

Consider: profitability per tier, client contract rates, demand patterns, underpriced services.

Give concrete numbers and percentages. Format as a numbered list. Use markdown.`);
}

export function generateMonthlyReport(model, systemPrompt) {
  return callClaude(model, systemPrompt,
    `Generate a comprehensive monthly performance report for Theodorus Fleet Management.

## Monthly Performance Report

1. **Executive Summary** — headline KPIs
2. **Revenue & Profitability** — by service tier and by client
3. **Driver Rankings** — performance, earnings, efficiency
4. **Fleet Utilization & Health** — vehicle status, maintenance compliance
5. **Client Analysis** — top clients, churn risks, growth opportunities
6. **Risk Register** — compliance gaps, expiring documents
7. **Strategic Recommendations** — 3-5 insights for next month

Be analytical. Reference actual names and numbers. Use markdown.`);
}

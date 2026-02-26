const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

/* ─── Context builder ────────────────────────────────────────────────────── */

export function buildFleetContext({ rides, drivers, vehicles, clients, maintenance }) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
  const in30 = new Date(now.getTime() + 30 * 86400000);
  const in60 = new Date(now.getTime() + 60 * 86400000);

  const getDriverName = (id) => drivers.find(d => d.id === id)?.name || 'UNASSIGNED';
  const getClientName = (id) => clients.find(c => c.id === id)?.companyName || 'Unknown';

  const completedRides = rides.filter(r => r.status === 'completed');
  const totalRevenue = completedRides.reduce((s, r) => s + (r.priceToClient || 0), 0);
  const totalPayout = completedRides.reduce((s, r) => s + (r.driverPayout || 0), 0);
  const netProfit = totalRevenue - totalPayout;
  const unassignedRides = rides.filter(r => r.status === 'new' && !r.driverId);
  const pendingRevenue = unassignedRides.reduce((s, r) => s + (r.priceToClient || 0), 0);

  const driversSection = drivers.map(d => {
    const completed = rides.filter(r => r.driverId === d.id && r.status === 'completed').length;
    const active = rides.filter(r => r.driverId === d.id && ['onway', 'confirmed', 'arrived'].includes(r.status)).length;
    const statusFlag = d.status === 'Suspended' ? '🔴 SUSPENDED' : d.status === 'On Leave' ? '🟡 ON LEAVE' : '🟢 Active';
    return `  ${statusFlag} #${d.employeeNumber || d.id} ${d.name} | ${d.vehicleModel} | Plate: ${d.licensePlate} | Rating: ${d.rating}⭐ | Commission: ${d.commissionPercent}% | Completed: ${completed} rides | Active now: ${active} | Phone: ${d.phone} | Joined: ${d.joinDate}`;
  }).join('\n');

  const vehiclesSection = vehicles.map(v => {
    const driver = drivers.find(d => d.id === v.assignedDriverId);
    const insExp = v.insuranceExpiry ? new Date(v.insuranceExpiry) : null;
    const regExp = v.registrationExpiry ? new Date(v.registrationExpiry) : null;
    const insFlag = insExp ? (insExp < now ? '⚠️EXPIRED' : insExp < in30 ? '⚠️<30d' : insExp < in60 ? '⚠️<60d' : '✓') : '?';
    const regFlag = regExp ? (regExp < now ? '⚠️EXPIRED' : regExp < in30 ? '⚠️<30d' : regExp < in60 ? '⚠️<60d' : '✓') : '?';
    const statusIcon = v.status === 'Active' ? '🟢' : v.status === 'Maintenance' ? '🔧' : '⚫';
    return `  ${statusIcon} ${v.licensePlate} | ${v.make} ${v.model} ${v.year} | ${v.color} | ${v.seats} seats | ${v.fuelType} | Driver: ${driver?.name || 'Unassigned'} | Mileage: ${v.mileage.toLocaleString()}km | Ins: ${v.insuranceExpiry}[${insFlag}] | Reg: ${v.registrationExpiry}[${regFlag}]${v.notes ? ` | Note: ${v.notes}` : ''}`;
  }).join('\n');

  const maintenanceSection = (maintenance || []).map(m => {
    const kmLeft = m.nextServiceKM - m.currentKM;
    const criticals = [m.tireStatus === 'Critical' && 'Tires🔴', m.brakeStatus === 'Critical' && 'Brakes🔴', m.acStatus === 'Critical' && 'A/C🔴'].filter(Boolean);
    const warnings = [m.tireStatus === 'Needs Check' && 'Tires⚠️', m.brakeStatus === 'Needs Check' && 'Brakes⚠️', m.acStatus === 'Needs Check' && 'A/C⚠️'].filter(Boolean);
    const flags = [...criticals, ...warnings].join(', ') || '✓ All Good';
    return `  ${m.vehicleName} | Last svc: ${m.lastServiceDate}@${m.lastServiceKM}km | Next: ${m.nextServiceKM}km | Now: ${m.currentKM}km (${kmLeft > 0 ? kmLeft + 'km left' : Math.abs(kmLeft) + 'km OVERDUE'}) | ${flags}`;
  }).join('\n');

  const ridesSection = rides.map(r => {
    const needsDriver = r.status === 'new' && !r.driverId ? ' ⚠️NEEDS DRIVER' : '';
    return `  ${r.id} | ${r.date} ${r.time} | ${r.status.toUpperCase()}${needsDriver} | ${r.serviceTier} | "${r.passengerName}" | Client: ${getClientName(r.clientId)} | Driver: ${getDriverName(r.driverId)} | ${r.pickupLocation} → ${r.dropoffLocation} | $${r.priceToClient || '?'} (payout $${r.driverPayout || '?'})`;
  }).join('\n');

  const clientsSection = clients.map(c => {
    const clientRides = rides.filter(r => r.clientId === c.id);
    return `  ${c.companyName} | ${c.tier} | Rate: $${c.contractRate}/ride | Spent: $${c.totalSpent.toLocaleString()} | Payment: ${c.paymentTerms} | Total rides: ${clientRides.length}`;
  }).join('\n');

  const margin = totalRevenue > 0 ? Math.round(netProfit / totalRevenue * 100) : 0;

  return `You are the AI Operations Manager for Theodorus — a premium fleet management and mobility company operating in Addis Ababa, Ethiopia. You have full real-time access to all fleet data and provide intelligent analysis, smart dispatch, risk detection, and strategic insights to the admin.

Today: ${today} (Tomorrow: ${tomorrow})

═══ DRIVERS (${drivers.length} total · ${drivers.filter(d => d.status === 'Active').length} active) ═══
${driversSection}

═══ VEHICLES (${vehicles.length} total · ${vehicles.filter(v => v.status === 'Active').length} active) ═══
${vehiclesSection}

═══ MAINTENANCE ═══
${maintenanceSection || '  No records.'}

═══ RIDES (${rides.length} total · ${rides.filter(r => ['onway','confirmed','arrived'].includes(r.status)).length} active · ${unassignedRides.length} unassigned) ═══
${ridesSection}

═══ CLIENTS (${clients.length}) ═══
${clientsSection}

═══ FINANCIALS ═══
  Revenue: $${totalRevenue.toLocaleString()} | Payouts: $${totalPayout.toLocaleString()} | Net Profit: $${netProfit.toLocaleString()} (${margin}% margin)
  Unassigned revenue at risk: $${pendingRevenue} across ${unassignedRides.length} ride(s)

DISPATCH RULES: Only assign Active drivers. Airport VIP → prefer Land Cruiser Prado (Yonas/d3). School runs → prefer HiAce (Abebe/d1). Corporate → any active driver. Match vehicle capacity to passenger count.

Be concise, specific, and proactive. Use driver names and ride IDs. Format with markdown headers and bullets.`;
}

/* ─── API calls ──────────────────────────────────────────────────────────── */

export async function callClaude(apiKey, model, systemPrompt, messages) {
  const msgArray = typeof messages === 'string'
    ? [{ role: 'user', content: messages }]
    : messages;

  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-browser': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model, max_tokens: 1500, system: systemPrompt, messages: msgArray }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }
  const data = await response.json();
  return data.content[0].text;
}

export async function* callClaudeStream(apiKey, model, systemPrompt, messages, signal) {
  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-browser': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model, max_tokens: 2000, stream: true, system: systemPrompt, messages }),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const json = line.slice(6).trim();
        if (json === '[DONE]') return;
        try {
          const evt = JSON.parse(json);
          if (evt.type === 'content_block_delta' && evt.delta?.text) {
            yield evt.delta.text;
          }
        } catch { /* skip malformed */ }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/* ─── Local risk computation (no API) ───────────────────────────────────── */

export function computeRiskAlerts({ rides, drivers, vehicles, maintenance }) {
  const alerts = [];
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86400000);
  const in60 = new Date(now.getTime() + 60 * 86400000);
  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];

  drivers.filter(d => d.status === 'Suspended').forEach(d => {
    const hasUpcoming = rides.some(r => r.driverId === d.id && ['new', 'confirmed', 'onway'].includes(r.status));
    alerts.push({
      id: `suspended-${d.id}`, severity: hasUpcoming ? 'critical' : 'warning', category: 'driver',
      title: `${d.name} suspended`,
      detail: hasUpcoming ? 'Has upcoming rides — reassign immediately' : 'Not available for dispatch',
      action: hasUpcoming ? 'Reassign rides' : null,
    });
  });

  vehicles.filter(v => v.status === 'Maintenance').forEach(v => {
    const driver = drivers.find(d => d.id === v.assignedDriverId);
    alerts.push({
      id: `maint-${v.id}`, severity: 'critical', category: 'vehicle',
      title: `${v.make} ${v.model} in maintenance`,
      detail: `${v.licensePlate}${driver ? ` · ${driver.name}` : ''} · ${v.notes || ''}`.trim(),
      action: 'Check repair status',
    });
  });

  vehicles.forEach(v => {
    if (v.insuranceExpiry) {
      const exp = new Date(v.insuranceExpiry);
      if (exp < now)
        alerts.push({ id: `ins-exp-${v.id}`, severity: 'critical', category: 'document', title: 'Insurance EXPIRED', detail: `${v.licensePlate} — expired ${v.insuranceExpiry}`, action: 'Renew immediately' });
      else if (exp < in30)
        alerts.push({ id: `ins-30-${v.id}`, severity: 'warning', category: 'document', title: 'Insurance expiring <30 days', detail: `${v.licensePlate} — expires ${v.insuranceExpiry}`, action: 'Renew now' });
      else if (exp < in60)
        alerts.push({ id: `ins-60-${v.id}`, severity: 'info', category: 'document', title: 'Insurance expiring <60 days', detail: `${v.licensePlate} — expires ${v.insuranceExpiry}`, action: null });
    }
    if (v.registrationExpiry) {
      const exp = new Date(v.registrationExpiry);
      if (exp < now)
        alerts.push({ id: `reg-exp-${v.id}`, severity: 'critical', category: 'document', title: 'Registration EXPIRED', detail: `${v.licensePlate} — expired ${v.registrationExpiry}`, action: 'Ground vehicle' });
      else if (exp < in30)
        alerts.push({ id: `reg-30-${v.id}`, severity: 'warning', category: 'document', title: 'Registration expiring <30 days', detail: `${v.licensePlate} — expires ${v.registrationExpiry}`, action: 'Renew now' });
    }
  });

  (maintenance || []).forEach(m => {
    const crits = [m.tireStatus === 'Critical' && 'Tires', m.brakeStatus === 'Critical' && 'Brakes', m.acStatus === 'Critical' && 'A/C'].filter(Boolean);
    if (crits.length)
      alerts.push({ id: `crit-${m.id}`, severity: 'critical', category: 'maintenance', title: 'Critical maintenance needed', detail: `${m.vehicleName}: ${crits.join(', ')}`, action: 'Remove from service' });

    const warns = [m.tireStatus === 'Needs Check' && 'Tires', m.brakeStatus === 'Needs Check' && 'Brakes', m.acStatus === 'Needs Check' && 'A/C'].filter(Boolean);
    if (warns.length && !crits.length)
      alerts.push({ id: `warn-${m.id}`, severity: 'warning', category: 'maintenance', title: 'Maintenance check needed', detail: `${m.vehicleName}: ${warns.join(', ')}`, action: 'Schedule service' });

    if (m.currentKM > m.nextServiceKM) {
      const over = m.currentKM - m.nextServiceKM;
      alerts.push({ id: `km-${m.id}`, severity: 'warning', category: 'maintenance', title: 'Service overdue', detail: `${m.vehicleName}: ${over.toLocaleString()}km past interval`, action: 'Book service' });
    }
  });

  const unassigned = rides.filter(r => r.status === 'new' && !r.driverId && (r.date === today || r.date === tomorrow));
  if (unassigned.length)
    alerts.push({ id: 'unassigned', severity: 'warning', category: 'dispatch', title: `${unassigned.length} ride(s) need drivers`, detail: unassigned.map(r => `${r.id} at ${r.time}`).join(', '), action: 'Assign now' });

  const order = { critical: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}

/* ─── Named generators ───────────────────────────────────────────────────── */

export async function generateDailyBriefing(apiKey, model, systemPrompt) {
  const d = new Date().toDateString();
  return callClaude(apiKey, model, systemPrompt,
    `Generate a concise daily operations briefing for ${d}.

## Daily Briefing — ${d}

Sections:
**Fleet Status** — driver availability, any suspensions or leaves
**Today's Rides** — what's scheduled, active, completed
**🚨 Critical Alerts** — anything needing action today (expiring docs, maintenance, unassigned rides)
**📋 Top 3 Priorities** — ranked action items for the team

Be specific with names and IDs. Keep under 300 words. Use markdown.`);
}

export async function generateDispatchSuggestions(apiKey, model, systemPrompt) {
  return callClaude(apiKey, model, systemPrompt,
    `Analyze all rides with status "new" and no assigned driver. For each, recommend the best available Active driver.

For each unassigned ride state:
- Ride details (ID, time, service tier, pickup/dropoff)
- Recommended driver (name + employee number) with clear reasoning
- Vehicle suitability (capacity, type match)
- Any caveats or alternatives

If all rides are assigned, summarize current dispatch status and driver availability. Use markdown.`);
}

export async function generatePricingSuggestions(apiKey, model, systemPrompt) {
  return callClaude(apiKey, model, systemPrompt,
    `Analyze our pricing and provide 6-8 specific dynamic pricing recommendations.

Consider:
- Profitability per service tier (revenue vs driver payout)
- Client contract rates vs market opportunity
- High-demand patterns (times, routes, tiers)
- Underpriced or overpriced services

Give concrete numbers and percentages. Format as a numbered list with brief reasoning per point. Use markdown.`);
}

export async function generateMonthlyReport(apiKey, model, systemPrompt) {
  return callClaude(apiKey, model, systemPrompt,
    `Generate a comprehensive monthly performance report for Theodorus Fleet Management.

## Monthly Performance Report

1. **Executive Summary** — headline KPIs
2. **Revenue & Profitability** — by service tier and by client
3. **Driver Rankings** — performance, earnings, efficiency
4. **Fleet Utilization & Health** — vehicle status, maintenance compliance
5. **Client Analysis** — top clients, churn risks, growth opportunities
6. **Risk Register** — compliance gaps, expiring documents
7. **Strategic Recommendations** — 3-5 insights for next month

Be analytical. Reference actual names and numbers. Use markdown with clear sections.`);
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { Navigation, RefreshCw, Wifi, WifiOff, Car, MapPin, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

// ── Map coordinate system ─────────────────────────────────────────────────────
const MAP = { latMin: 8.96, latMax: 9.10, lngMin: 38.66, lngMax: 38.86 };
const SVG_W = 800;
const SVG_H = 580;

function toXY(lat, lng) {
  const x = ((lng - MAP.lngMin) / (MAP.lngMax - MAP.lngMin)) * SVG_W;
  const y = ((MAP.latMax - lat) / (MAP.latMax - MAP.latMin)) * SVG_H;
  return { x, y };
}

// ── Addis Ababa landmarks ─────────────────────────────────────────────────────
const LANDMARKS = [
  { name: 'Bole Intl Airport', lat: 8.978, lng: 38.799 },
  { name: 'Meskel Square',     lat: 9.010, lng: 38.763 },
  { name: 'African Union HQ', lat: 9.013, lng: 38.767 },
  { name: 'UNECA HQ',         lat: 9.033, lng: 38.757 },
  { name: 'Sheraton Addis',   lat: 9.017, lng: 38.763 },
  { name: 'Nat. Museum',      lat: 9.021, lng: 38.758 },
  { name: 'Piassa',           lat: 9.035, lng: 38.747 },
  { name: 'Kazanchis',        lat: 9.016, lng: 38.762 },
  { name: 'Bole Medhanialem', lat: 9.002, lng: 38.792 },
  { name: 'US Embassy',       lat: 9.007, lng: 38.764 },
];

function makeRoad(points) {
  const coords = points.map(([lat, lng]) => toXY(lat, lng));
  return coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

const ROADS = [
  { d: makeRoad([[9.010, 38.720], [9.005, 38.740], [8.998, 38.760], [8.990, 38.780], [8.982, 38.800], [8.978, 38.820]]), w: 3, label: 'Bole Rd' },
  { d: makeRoad([[9.045, 38.763], [9.030, 38.763], [9.015, 38.762], [9.000, 38.762], [8.985, 38.762]]), w: 3, label: 'Africa Ave' },
  { d: makeRoad([[9.040, 38.800], [9.020, 38.810], [9.000, 38.815], [8.978, 38.805]]), w: 2, label: '' },
  { d: makeRoad([[9.040, 38.720], [9.020, 38.715], [9.000, 38.718], [8.978, 38.730]]), w: 2, label: '' },
  { d: makeRoad([[9.045, 38.750], [9.040, 38.750], [9.035, 38.748], [9.030, 38.745]]), w: 2, label: 'Entoto Rd' },
  { d: makeRoad([[8.978, 38.800], [8.968, 38.800], [8.960, 38.800]]), w: 2, label: 'Debre Zeit Rd' },
  { d: makeRoad([[9.035, 38.748], [9.025, 38.748], [9.012, 38.748], [8.998, 38.748]]), w: 2, label: 'Churchill Ave' },
  { d: makeRoad([[9.015, 38.745], [9.015, 38.760], [9.015, 38.775]]), w: 1.5, label: '' },
  { d: makeRoad([[9.005, 38.760], [9.010, 38.770], [9.015, 38.780]]), w: 1.5, label: '' },
];

const INITIAL_POSITIONS = {
  d1: { lat: 9.003, lng: 38.791 },
  d2: { lat: 9.015, lng: 38.764 },
  d3: { lat: 9.030, lng: 38.758 },
  d4: { lat: 9.019, lng: 38.741 },
  d5: { lat: 9.034, lng: 38.748 },
};

const DRIVER_COLORS = {
  d1: '#00d4ff',
  d2: '#60a5fa',
  d3: '#34d399',
  d4: '#f472b6',
  d5: '#a78bfa',
};

function nudge(val, range = 0.003) {
  return val + (Math.random() - 0.5) * range;
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

export default function GPSTrackingPage() {
  const { drivers, vehicles } = useApp();
  const [positions, setPositions] = useState(INITIAL_POSITIONS);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [live, setLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [updateCount, setUpdateCount] = useState(0);
  const intervalRef = useRef(null);

  const tick = useCallback(() => {
    setPositions(prev => {
      const next = {};
      for (const [id, pos] of Object.entries(prev)) {
        next[id] = {
          lat: clamp(nudge(pos.lat, 0.0025), MAP.latMin + 0.01, MAP.latMax - 0.01),
          lng: clamp(nudge(pos.lng, 0.0025), MAP.lngMin + 0.01, MAP.lngMax - 0.01),
        };
      }
      return next;
    });
    setLastUpdate(new Date());
    setUpdateCount(c => c + 1);
  }, []);

  useEffect(() => {
    if (live) {
      intervalRef.current = setInterval(tick, 10000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [live, tick]);

  const activeDrivers = drivers.filter(d => d.status === 'Active');
  const getVehicle = (driverId) => vehicles.find(v => v.assignedDriverId === driverId);

  return (
    <div className="p-6 space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Navigation size={18} className="text-gold-400" />
          <h2 className="text-lg font-bold text-white">Live GPS Tracking</h2>
        </div>
        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-sm font-mono ${
          live ? 'bg-green-900/30 text-green-400 border border-green-700/40' : 'bg-navy-700/40 text-slate-500 border border-navy-600'
        }`} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.1em' }}>
          {live ? <Wifi size={12} /> : <WifiOff size={12} />}
          {live ? 'LIVE' : 'PAUSED'}
        </div>
        <p className="text-xs text-slate-500">
          Updates every 10 s · Last: {lastUpdate.toLocaleTimeString()} · #{updateCount}
        </p>
        <div className="ml-auto flex gap-2">
          {selectedDriver && (
            <button
              onClick={() => setSelectedDriver(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 bg-navy-700 border border-navy-600 hover:border-red-700/50 transition-colors"
            >
              <X size={13} /> Clear selection
            </button>
          )}
          <button onClick={tick} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
            <RefreshCw size={13} />
            Refresh
          </button>
          <button
            onClick={() => setLive(l => !l)}
            className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              live
                ? 'bg-green-900/40 text-green-300 border border-green-700/50 hover:bg-green-900/60'
                : 'bg-navy-700 text-slate-400 border border-navy-600 hover:text-slate-200'
            }`}
          >
            {live ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Map */}
        <div className="flex-1 card p-0 overflow-hidden relative" style={{ minHeight: 520 }}>
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full h-full"
            style={{ background: '#000810' }}
          >
            {/* Grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,212,255,0.04)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width={SVG_W} height={SVG_H} fill="url(#grid)" />

            {/* Northern hills zone */}
            <ellipse cx="400" cy="60" rx="300" ry="70" fill="rgba(0,212,255,0.03)" opacity="0.8" />

            {/* City block texture */}
            {[
              [300, 200, 150, 120], [460, 200, 120, 100], [260, 320, 100, 80],
              [370, 300, 100, 100], [480, 310, 80, 70], [310, 400, 80, 60],
              [400, 400, 100, 60], [500, 380, 70, 50],
            ].map(([x, y, w, h], i) => (
              <rect key={i} x={x} y={y} width={w} height={h} fill="rgba(0,212,255,0.025)" rx="2" opacity="0.8" />
            ))}

            {/* Roads */}
            {ROADS.map((r, i) => (
              <g key={i}>
                <path d={r.d} fill="none" stroke="rgba(0,212,255,0.06)" strokeWidth={r.w + 3} strokeLinecap="round" strokeLinejoin="round" />
                <path d={r.d} fill="none" stroke="rgba(0,212,255,0.18)" strokeWidth={r.w} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            ))}

            {/* Road labels */}
            {ROADS.filter(r => r.label).map((r, i) => {
              const m = r.d.match(/M\s*([\d.]+)\s+([\d.]+)/);
              if (!m) return null;
              return (
                <text key={i} x={parseFloat(m[1]) + 5} y={parseFloat(m[2]) - 5} fontSize="9" fill="rgba(0,212,255,0.3)" fontFamily="'JetBrains Mono', monospace">
                  {r.label}
                </text>
              );
            })}

            {/* Landmarks */}
            {LANDMARKS.map((lm, i) => {
              const { x, y } = toXY(lm.lat, lm.lng);
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="4" fill="rgba(0,212,255,0.05)" stroke="rgba(0,212,255,0.25)" strokeWidth="1" />
                  <text x={x + 8} y={y + 4} fontSize="9" fill="rgba(0,212,255,0.4)" fontFamily="'JetBrains Mono', monospace">
                    {lm.name}
                  </text>
                </g>
              );
            })}

            {/* Vehicle markers */}
            {activeDrivers.map(driver => {
              const pos = positions[driver.id];
              if (!pos) return null;
              const { x, y } = toXY(pos.lat, pos.lng);
              const color = DRIVER_COLORS[driver.id] || '#94a3b8';
              const isSelected = selectedDriver === driver.id;
              const vehicle = getVehicle(driver.id);

              return (
                <g key={driver.id} onClick={() => setSelectedDriver(id => id === driver.id ? null : driver.id)} style={{ cursor: 'pointer' }}>
                  {isSelected && (
                    <circle cx={x} cy={y} r="22" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" />
                  )}
                  <circle cx={x} cy={y} r="14" fill={color} opacity="0.15" />
                  <circle cx={x} cy={y} r="9" fill={color} stroke="#000810" strokeWidth="2" />
                  <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fill="#000810" fontWeight="bold">🚗</text>
                  <text
                    x={x + 13} y={y - 12}
                    fontSize="10" fontWeight="bold"
                    fill={color} stroke="#000810" strokeWidth="3" paintOrder="stroke"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {driver.name.split(' ')[0]}
                  </text>
                  {vehicle?.licensePlate && (
                    <text
                      x={x + 13} y={y}
                      fontSize="8" fontWeight="bold"
                      fill={color} stroke="#000810" strokeWidth="2.5" paintOrder="stroke"
                      fontFamily="'JetBrains Mono', monospace"
                      opacity="0.85"
                    >
                      {vehicle.licensePlate}
                    </text>
                  )}
                  {isSelected && (
                    <g>
                      <rect x={x - 65} y={y - 66} width="140" height="56" rx="2" fill="#000c1a" stroke={color} strokeWidth="1" strokeOpacity="0.7" />
                      <text x={x} y={y - 49} textAnchor="middle" fontSize="10" fontWeight="bold" fill={color} fontFamily="'JetBrains Mono', monospace">
                        {driver.name}
                      </text>
                      <text x={x} y={y - 36} textAnchor="middle" fontSize="9" fill="rgba(148,163,184,0.7)" fontFamily="'JetBrains Mono', monospace">
                        {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle unknown'}
                      </text>
                      {vehicle?.licensePlate && (
                        <text x={x} y={y - 23} textAnchor="middle" fontSize="9" fontWeight="bold" fill={color} fontFamily="'JetBrains Mono', monospace" opacity="0.9">
                          {vehicle.licensePlate}
                        </text>
                      )}
                      <text x={x} y={y - 11} textAnchor="middle" fontSize="8" fill="rgba(0,212,255,0.3)" fontFamily="'JetBrains Mono', monospace">
                        {pos.lat.toFixed(4)}°N, {pos.lng.toFixed(4)}°E
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Compass */}
            <g transform="translate(760, 40)">
              <circle cx="0" cy="0" r="16" fill="rgba(0,12,24,0.9)" stroke="rgba(0,212,255,0.25)" strokeWidth="1" />
              <text x="0" y="-4" textAnchor="middle" fontSize="11" fill="#00d4ff" fontWeight="bold" fontFamily="'JetBrains Mono', monospace">N</text>
              <text x="0" y="10" textAnchor="middle" fontSize="8" fill="rgba(0,212,255,0.3)" fontFamily="'JetBrains Mono', monospace">S</text>
              <text x="-10" y="4" textAnchor="middle" fontSize="8" fill="rgba(0,212,255,0.3)" fontFamily="'JetBrains Mono', monospace">W</text>
              <text x="10" y="4" textAnchor="middle" fontSize="8" fill="rgba(0,212,255,0.3)" fontFamily="'JetBrains Mono', monospace">E</text>
            </g>

            {/* Scale bar */}
            <g transform="translate(20, 555)">
              <rect x="0" y="0" width="80" height="2" fill="#00d4ff" opacity="0.4" />
              <text x="0" y="-4" fontSize="9" fill="rgba(0,212,255,0.35)" fontFamily="'JetBrains Mono', monospace">0</text>
              <text x="60" y="-4" fontSize="9" fill="rgba(0,212,255,0.35)" fontFamily="'JetBrains Mono', monospace">~4 km</text>
            </g>
          </svg>

          {/* Live indicator overlay */}
          {live && (
            <div
              className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5"
              style={{
                background: 'rgba(0,8,16,0.92)',
                border: '1px solid rgba(74,222,128,0.3)',
                borderRadius: '2px',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#4ade80', animation: 'glow-pulse 2s ease-in-out infinite', boxShadow: '0 0 6px #4ade80' }}
              />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', fontWeight: 700, color: '#4ade80', letterSpacing: '0.12em' }}>
                LIVE
              </span>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="w-64 flex flex-col gap-3">
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', fontWeight: 700, color: 'rgba(0,212,255,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Active Vehicles</p>
          {activeDrivers.map(driver => {
            const pos = positions[driver.id];
            const color = DRIVER_COLORS[driver.id] || '#94a3b8';
            const vehicle = getVehicle(driver.id);
            const isSelected = selectedDriver === driver.id;

            return (
              <button
                key={driver.id}
                onClick={() => setSelectedDriver(id => id === driver.id ? null : driver.id)}
                className="w-full text-left p-3 transition-all"
                style={{
                  background: isSelected ? 'rgba(0,212,255,0.06)' : 'rgba(1,16,32,0.8)',
                  border: isSelected ? '1px solid rgba(0,212,255,0.35)' : '1px solid rgba(0,212,255,0.08)',
                  borderRadius: '2px',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm font-medium text-white truncate">{driver.name}</span>
                </div>
                {vehicle && (
                  <p className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                    <Car size={11} />
                    {vehicle.make} {vehicle.model}
                    {vehicle.licensePlate && (
                      <span className="ml-auto font-mono text-xs font-bold" style={{ color }}>{vehicle.licensePlate}</span>
                    )}
                  </p>
                )}
                {pos && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin size={11} />
                    {pos.lat.toFixed(4)}°N, {pos.lng.toFixed(4)}°E
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-xs text-green-400">Moving</span>
                  <span className="ml-auto text-xs text-slate-600">{driver.phone}</span>
                </div>
              </button>
            );
          })}

          {drivers.filter(d => d.status !== 'Active').length > 0 && (
            <div className="p-3" style={{ background: 'rgba(1,16,32,0.6)', border: '1px solid rgba(0,212,255,0.06)', borderRadius: '2px' }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: 'rgba(100,116,139,0.7)' }}>
                {drivers.filter(d => d.status !== 'Active').length} driver(s) off-duty — not tracked
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="mt-auto p-3 space-y-1.5" style={{ background: 'rgba(1,16,32,0.6)', border: '1px solid rgba(0,212,255,0.06)', borderRadius: '2px' }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.58rem', fontWeight: 700, color: 'rgba(0,212,255,0.35)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Map Legend</p>
            <div className="flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#475569' }}>
              <div className="w-5 h-px" style={{ background: 'rgba(0,212,255,0.4)' }} /> Major road
            </div>
            <div className="flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#475569' }}>
              <div className="w-3 h-3 rounded-full" style={{ background: '#00d4ff' }} /> Active vehicle
            </div>
            <div className="flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#475569' }}>
              <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)' }} /> Landmark
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Vehicles', value: activeDrivers.length, color: 'text-green-400' },
          { label: 'Total Fleet',     value: drivers.length,       color: 'text-gold-400' },
          { label: 'Position Updates', value: updateCount,         color: 'text-blue-400' },
          { label: 'Update Interval', value: '10 sec',             color: 'text-slate-300' },
        ].map(s => (
          <div key={s.label} className="card py-3">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

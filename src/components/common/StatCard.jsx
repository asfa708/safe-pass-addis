export default function StatCard({ label, value, sub, icon: Icon, trend, color = 'gold' }) {
  const palette = {
    gold:   { accent: '#00d4ff', border: 'rgba(0,212,255,0.18)',  glow: 'rgba(0,212,255,0.12)',  iconBg: 'rgba(0,212,255,0.07)',  text: '#00d4ff' },
    green:  { accent: '#4ade80', border: 'rgba(74,222,128,0.18)', glow: 'rgba(74,222,128,0.1)',  iconBg: 'rgba(74,222,128,0.07)', text: '#4ade80' },
    blue:   { accent: '#60a5fa', border: 'rgba(96,165,250,0.18)', glow: 'rgba(96,165,250,0.1)',  iconBg: 'rgba(96,165,250,0.07)', text: '#60a5fa' },
    red:    { accent: '#f87171', border: 'rgba(248,113,113,0.18)', glow: 'rgba(248,113,113,0.1)', iconBg: 'rgba(248,113,113,0.07)', text: '#f87171' },
    purple: { accent: '#c084fc', border: 'rgba(192,132,252,0.18)', glow: 'rgba(192,132,252,0.1)', iconBg: 'rgba(192,132,252,0.07)', text: '#c084fc' },
  };
  const c = palette[color] || palette.gold;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(1,16,32,0.97) 0%, rgba(1,25,46,0.93) 100%)',
        border: `1px solid ${c.border}`,
        borderRadius: '3px',
        padding: '1.25rem 1.5rem',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 32px ${c.glow}`; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${c.accent}, transparent)`, opacity: 0.5 }}
      />

      {/* Corner accent — top right */}
      <div
        className="absolute top-0 right-3 w-6 h-0.5"
        style={{ background: `linear-gradient(90deg, transparent, ${c.accent})` }}
      />
      <div
        className="absolute top-3 right-0 w-0.5 h-6"
        style={{ background: `linear-gradient(180deg, ${c.accent}, transparent)` }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className="uppercase mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.15em', color: 'rgba(148,163,184,0.5)' }}
          >
            {label}
          </p>
          <p
            className="font-bold leading-none"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '2rem',
              color: c.text,
              textShadow: `0 0 24px ${c.glow}`,
            }}
          >
            {value}
          </p>
          {sub && (
            <p
              className="mt-1.5"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: 'rgba(100,116,139,0.8)' }}
            >
              {sub}
            </p>
          )}
          {trend !== undefined && (
            <p
              className="mt-1.5"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.62rem',
                letterSpacing: '0.1em',
                color: trend >= 0 ? '#4ade80' : '#f87171',
              }}
            >
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% THIS WEEK
            </p>
          )}
        </div>

        {Icon && (
          <div
            className="flex-shrink-0 flex items-center justify-center"
            style={{
              width: '38px',
              height: '38px',
              background: c.iconBg,
              border: `1px solid ${c.border}`,
              borderRadius: '3px',
            }}
          >
            <Icon size={17} style={{ color: c.text }} />
          </div>
        )}
      </div>
    </div>
  );
}

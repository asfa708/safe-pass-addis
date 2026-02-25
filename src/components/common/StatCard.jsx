export default function StatCard({ label, value, sub, icon: Icon, trend, color = 'gold' }) {
  const colors = {
    gold:   { bg: 'bg-gold-500/10',   border: 'border-gold-500/20',   icon: 'text-gold-400',   text: 'text-gold-400' },
    green:  { bg: 'bg-green-500/10',  border: 'border-green-500/20',  icon: 'text-green-400',  text: 'text-green-400' },
    blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   icon: 'text-blue-400',   text: 'text-blue-400' },
    red:    { bg: 'bg-red-500/10',    border: 'border-red-500/20',    icon: 'text-red-400',    text: 'text-red-400' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: 'text-purple-400', text: 'text-purple-400' },
  };
  const c = colors[color] || colors.gold;

  return (
    <div className={`card border ${c.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${c.text}`}>{value}</p>
          {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
          {trend !== undefined && (
            <p className={`text-xs mt-1 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% this week
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
            <Icon size={20} className={c.icon} />
          </div>
        )}
      </div>
    </div>
  );
}

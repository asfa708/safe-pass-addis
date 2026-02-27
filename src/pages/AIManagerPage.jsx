import { useState, useRef, useEffect, useCallback, useMemo, Component } from 'react';
import {
  Brain, Send, AlertTriangle, AlertCircle, Info,
  Zap, BarChart2, Truck, DollarSign, FileText, Settings,
  ChevronRight, RefreshCw, Bot, User, X, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  buildFleetContext,
  callClaude,
  computeRiskAlerts,
  generateDailyBriefing,
  generateDispatchSuggestions,
  generatePricingSuggestions,
  generateMonthlyReport,
} from '../services/claudeService';

const LS_KEY_MODEL     = 'theodorus-ai-model';
const LS_BRIEFING_DATE = 'theodorus-briefing-date';
const LS_BRIEFING_TEXT = 'theodorus-briefing-text';

// ── Error boundary ─────────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('AI Manager render error:', error, info); }

  render() {
    if (this.state.error) {
      return (
        <div className="h-full flex items-center justify-center p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="w-14 h-14 rounded-sm flex items-center justify-center mx-auto" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              {this.state.error.message || 'An unexpected error occurred in the AI Manager.'}
            </p>
            <button type="button" onClick={() => this.setState({ error: null })} className="btn-primary mx-auto">
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Simple markdown renderer ───────────────────────────────────────────────────
function SimpleMarkdown({ text }) {
  if (!text) return null;
  const lines = String(text).split('\n');
  const elements = [];

  const renderInline = (str) =>
    String(str).split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, idx) => {
      if (p.startsWith('**') && p.endsWith('**'))
        return <strong key={idx} className="text-white font-semibold">{p.slice(2, -2)}</strong>;
      if (p.startsWith('`') && p.endsWith('`'))
        return <code key={idx} className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(0,212,255,0.1)', color: '#67e8f9' }}>{p.slice(1, -1)}</code>;
      return p;
    });

  lines.forEach((line, i) => {
    if      (line.startsWith('### ')) elements.push(<h3 key={i} className="text-sm font-bold mt-3 mb-1" style={{ color: '#00d4ff', fontFamily: "'JetBrains Mono', monospace" }}>{renderInline(line.slice(4))}</h3>);
    else if (line.startsWith('## '))  elements.push(<h2 key={i} className="text-base font-bold mt-4 mb-1.5 pb-1" style={{ color: '#67e8f9', borderBottom: '1px solid rgba(0,212,255,0.15)', fontFamily: "'JetBrains Mono', monospace" }}>{renderInline(line.slice(3))}</h2>);
    else if (line.startsWith('# '))   elements.push(<h1 key={i} className="text-lg font-bold mt-4 mb-2" style={{ color: '#67e8f9', fontFamily: "'JetBrains Mono', monospace" }}>{renderInline(line.slice(2))}</h1>);
    else if (/^\d+\.\s/.test(line))   elements.push(<p key={i} className="text-sm text-slate-300 ml-3 my-0.5 leading-relaxed">{renderInline(line)}</p>);
    else if (line.startsWith('- ') || line.startsWith('• '))
      elements.push(
        <p key={i} className="text-sm text-slate-300 ml-3 my-0.5 leading-relaxed flex gap-2">
          <span className="flex-shrink-0 mt-1" style={{ color: '#00d4ff' }}>•</span>
          <span>{renderInline(line.slice(2))}</span>
        </p>
      );
    else if (line.trim() === '') elements.push(<div key={i} className="h-1.5" />);
    else elements.push(<p key={i} className="text-sm text-slate-300 leading-relaxed my-0.5">{renderInline(line)}</p>);
  });

  return <div className="space-y-0">{elements}</div>;
}

// ── Typing dots ────────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex gap-1 items-center py-1 px-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ background: '#00d4ff', animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// ── Risk alert ─────────────────────────────────────────────────────────────────
const SEVERITY_STYLES = {
  critical: { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.3)',   color: '#f87171' },
  warning:  { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.3)',  color: '#fcd34d' },
  info:     { bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.3)',  color: '#93c5fd' },
};
const SEVERITY_ICON_MAP = { critical: AlertTriangle, warning: AlertCircle, info: Info };

function RiskAlert({ alert }) {
  const Icon = SEVERITY_ICON_MAP[alert.severity] || Info;
  const s = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
  return (
    <div className="flex gap-2 p-2.5 rounded-sm text-xs" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <Icon size={13} className="flex-shrink-0 mt-0.5" style={{ color: s.color }} />
      <div className="min-w-0">
        <p className="font-semibold leading-snug" style={{ color: s.color }}>{alert.title}</p>
        <p className="leading-snug mt-0.5 truncate text-slate-400">{alert.detail}</p>
      </div>
    </div>
  );
}

// ── Quick actions ──────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { id: 'dispatch', icon: Truck,      label: 'Smart Dispatch',   fn: generateDispatchSuggestions },
  { id: 'pricing',  icon: DollarSign, label: 'Pricing Analysis', fn: generatePricingSuggestions  },
  { id: 'report',   icon: FileText,   label: 'Monthly Report',   fn: generateMonthlyReport       },
  { id: 'briefing', icon: Zap,        label: 'Daily Briefing',   fn: generateDailyBriefing       },
];

const SUGGESTIONS = [
  'Which drivers are available right now?',
  'What are our top revenue-generating routes?',
  'Which vehicles need maintenance soon?',
  'Suggest ways to improve dispatch efficiency.',
  'Best pricing strategy for airport transfers?',
];

// ── Message bubble ─────────────────────────────────────────────────────────────
function Message({ msg }) {
  const isBot = msg.role === 'assistant';
  return (
    <div className={`flex gap-2.5 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div
        className="w-7 h-7 rounded-sm flex-shrink-0 flex items-center justify-center mt-0.5"
        style={{
          background: isBot ? 'rgba(0,212,255,0.08)' : 'rgba(1,25,46,0.8)',
          border: isBot ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(0,212,255,0.15)',
        }}
      >
        {isBot
          ? <Bot size={14} style={{ color: '#00d4ff' }} />
          : <User size={14} className="text-slate-300" />
        }
      </div>
      <div
        className="max-w-[85%] px-3 py-2.5 text-sm rounded-sm"
        style={isBot
          ? { background: 'rgba(1,16,32,0.9)', border: '1px solid rgba(0,212,255,0.1)', borderTopLeftRadius: '2px' }
          : { background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.35)', borderTopRightRadius: '2px' }
        }
      >
        {isBot
          ? (msg.loading ? <TypingDots /> : <SimpleMarkdown text={msg.text || ''} />)
          : <p className="whitespace-pre-wrap text-slate-200">{msg.text}</p>
        }
      </div>
    </div>
  );
}

// ── Main inner component ───────────────────────────────────────────────────────
function AIManagerInner() {
  const navigate = useNavigate();
  const { rides, drivers, vehicles, clients, maintenance } = useApp();

  const model = useRef(localStorage.getItem(LS_KEY_MODEL) || 'claude-sonnet-4-6').current;

  const [messages, setMessages] = useState([{
    id: 1,
    role: 'assistant',
    text: "Hello! I'm the Theodorus AI Operations Manager powered by Claude. I have full visibility into your fleet, drivers, rides, and clients.\n\nAsk me anything — dispatch recommendations, pricing strategy, performance analysis, risk alerts — or use the quick action buttons.",
  }]);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [quickLoading, setQuickLoading] = useState(null);
  const [alerts, setAlerts]             = useState([]);
  const [briefingLoading, setBriefingLoading] = useState(false);

  const abortRef    = useRef(null);
  const bottomRef   = useRef(null);
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const systemPrompt = useMemo(
    () => buildFleetContext({ rides, drivers, vehicles, clients, maintenance }),
    [rides, drivers, vehicles, clients, maintenance]
  );

  // Risk alerts
  useEffect(() => {
    setAlerts(computeRiskAlerts({ rides, drivers, vehicles, maintenance }));
  }, [rides, drivers, vehicles, maintenance]);

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [messages]);

  // Cancel on unmount
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  // Auto daily briefing once per day
  useEffect(() => {
    const today    = new Date().toDateString();
    const lastDate = localStorage.getItem(LS_BRIEFING_DATE);
    const lastText = localStorage.getItem(LS_BRIEFING_TEXT);

    if (lastDate === today && lastText) {
      setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', text: '📋 **Daily Briefing** (cached)\n\n' + lastText }]);
      return;
    }

    setBriefingLoading(true);
    generateDailyBriefing(model, systemPrompt)
      .then(text => {
        const briefText = text || 'Could not generate briefing.';
        localStorage.setItem(LS_BRIEFING_DATE, today);
        localStorage.setItem(LS_BRIEFING_TEXT, briefText);
        setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', text: '📋 **Daily Briefing**\n\n' + briefText }]);
      })
      .catch(err => {
        setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', text: `⚠️ Could not generate daily briefing: ${err.message}` }]);
      })
      .finally(() => setBriefingLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;

    const userMsg     = { id: Date.now(), role: 'user', text: text.trim() };
    const assistantId = Date.now() + 1;

    setMessages(prev => [...prev, userMsg, { id: assistantId, role: 'assistant', text: '', loading: true }]);
    setInput('');
    setLoading(true);

    const history = [...messagesRef.current, userMsg]
      .filter(m => m.role === 'user' || (m.role === 'assistant' && m.text))
      .map(m => ({ role: m.role, content: m.text }));

    abortRef.current = new AbortController();

    try {
      const responseText = await callClaude(model, systemPrompt, history, abortRef.current.signal);
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, text: responseText, loading: false } : m
      ));
    } catch (err) {
      const errText = err.name === 'AbortError'
        ? '_(request cancelled)_'
        : `❌ ${err.message || 'Request failed'}`;
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, text: errText, loading: false } : m
      ));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [loading, model, systemPrompt]);

  const cancelRequest = () => { abortRef.current?.abort(); };

  const runQuickAction = async (action) => {
    if (loading || quickLoading) return;
    const assistantId = Date.now() + 1;
    setMessages(prev => [...prev,
      { id: Date.now(), role: 'user', text: `Generate: ${action.label}` },
      { id: assistantId, role: 'assistant', text: '', loading: true },
    ]);
    setQuickLoading(action.id);
    try {
      const text = await action.fn(model, systemPrompt);
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, text: text || 'No response generated.', loading: false } : m
      ));
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, text: `❌ ${err.message || 'Request failed'}`, loading: false } : m
      ));
    } finally {
      setQuickLoading(null);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount  = alerts.filter(a => a.severity === 'warning').length;
  const hasUserMsg    = messages.some(m => m.role === 'user');
  const isBusy        = loading || !!quickLoading;

  // ── Single stable root — no conditional top-level renders ─────────────────
  return (
    <div className="h-full flex gap-4 p-4 overflow-hidden">

      {/* ── Chat column ─────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col overflow-hidden min-w-0"
        style={{ background: 'rgba(1,16,32,0.95)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: '3px' }}
      >

        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(0,212,255,0.08)', background: 'rgba(0,8,18,0.6)' }}
        >
          <div
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center"
            style={{ background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '3px' }}
          >
            <Brain size={17} style={{ color: '#00d4ff' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              AI Operations Manager
            </p>
            <p className="truncate" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: 'rgba(0,212,255,0.3)', letterSpacing: '0.08em' }}>
              {briefingLoading ? 'Generating daily briefing…' : `${model} · Fleet context loaded`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="flex items-center justify-center transition-all"
            style={{ width: '30px', height: '30px', borderRadius: '2px', border: '1px solid rgba(0,212,255,0.1)', color: '#334155', background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#00d4ff'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#334155'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.1)'; }}
            title="Settings"
          >
            <Settings size={14} />
          </button>
        </div>

        {/* Quick actions */}
        <div
          className="flex gap-2 px-4 py-2.5 flex-shrink-0 overflow-x-auto"
          style={{ borderBottom: '1px solid rgba(0,212,255,0.06)', background: 'rgba(0,8,18,0.3)' }}
        >
          {QUICK_ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => runQuickAction(action)}
                disabled={isBusy}
                className="flex items-center gap-1.5 flex-shrink-0 transition-all"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.65rem',
                  letterSpacing: '0.06em',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '2px',
                  background: 'rgba(1,25,46,0.8)',
                  border: '1px solid rgba(0,212,255,0.12)',
                  color: quickLoading === action.id ? '#00d4ff' : '#475569',
                  cursor: isBusy ? 'not-allowed' : 'pointer',
                  opacity: isBusy && quickLoading !== action.id ? 0.4 : 1,
                }}
              >
                {quickLoading === action.id
                  ? <span className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: '#00d4ff', borderTopColor: 'transparent' }} />
                  : <Icon size={11} />
                }
                {action.label}
              </button>
            );
          })}
        </div>

        {/* Messages — always present, scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map(m => <Message key={m.id} msg={m} />)}
          <div ref={bottomRef} />
        </div>

        {/* Suggestion chips — always in DOM, hidden via visibility when not needed */}
        <div
          className="px-4 pb-2 flex-shrink-0"
          style={{ display: hasUserMsg ? 'none' : 'flex', flexWrap: 'wrap', gap: '0.375rem' }}
        >
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => sendMessage(s)}
              disabled={isBusy}
              className="transition-all"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.62rem',
                letterSpacing: '0.04em',
                padding: '0.35rem 0.65rem',
                borderRadius: '2px',
                background: 'rgba(1,25,46,0.7)',
                border: '1px solid rgba(0,212,255,0.1)',
                color: '#475569',
                cursor: isBusy ? 'not-allowed' : 'pointer',
                opacity: isBusy ? 0.4 : 1,
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input bar — single stable container */}
        <div
          className="p-3 flex gap-2 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(0,212,255,0.08)' }}
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about dispatch, pricing, performance, risks…"
            rows={1}
            disabled={isBusy}
            className="flex-1 resize-none"
            style={{
              background: 'rgba(0,8,18,0.9)',
              border: '1px solid rgba(0,212,255,0.15)',
              borderRadius: '2px',
              padding: '0.45rem 0.75rem',
              fontSize: '0.8rem',
              color: '#cbd5e1',
              fontFamily: "'JetBrains Mono', monospace",
              outline: 'none',
              maxHeight: '120px',
              overflowY: 'auto',
              opacity: isBusy ? 0.6 : 1,
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(0,212,255,0.45)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(0,212,255,0.15)'; }}
          />
          {/* Single stable button — toggles between send/cancel via state */}
          <button
            type="button"
            onClick={loading ? cancelRequest : () => sendMessage(input)}
            disabled={!loading && !input.trim()}
            title={loading ? 'Cancel' : 'Send'}
            className="flex-shrink-0 flex items-center justify-center transition-all"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '2px',
              background: loading ? 'rgba(239,68,68,0.12)' : 'rgba(0,212,255,0.1)',
              border: loading ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(0,212,255,0.4)',
              color: loading ? '#f87171' : '#00d4ff',
              cursor: (!loading && !input.trim()) ? 'not-allowed' : 'pointer',
              opacity: (!loading && !input.trim()) ? 0.35 : 1,
            }}
          >
            {loading ? <X size={14} /> : <Send size={14} />}
          </button>
        </div>
      </div>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <div className="w-72 flex flex-col gap-4 overflow-y-auto flex-shrink-0">

        {/* Fleet snapshot */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={14} style={{ color: '#00d4ff' }} />
            <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Fleet Snapshot</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Active Rides',    value: rides.filter(r => ['In Progress','onway','arrived'].includes(r.status)).length, color: '#4ade80' },
              { label: 'On Duty Drivers', value: drivers.filter(d => d.status === 'On Duty').length,   color: '#60a5fa' },
              { label: 'Active Vehicles', value: vehicles.filter(v => v.status === 'Active').length,   color: '#00d4ff' },
              { label: 'Pending Rides',   value: rides.filter(r => ['Scheduled','new'].includes(r.status)).length, color: '#fcd34d' },
            ].map(stat => (
              <div
                key={stat.label}
                className="rounded-sm p-2.5"
                style={{ background: 'rgba(0,8,18,0.7)', border: '1px solid rgba(0,212,255,0.07)' }}
              >
                <p className="text-xl font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: stat.color }}>{stat.value}</p>
                <p className="text-xs mt-0.5 leading-tight" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.58rem', color: 'rgba(148,163,184,0.5)', letterSpacing: '0.06em' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Risk alerts */}
        <div className="card flex-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield size={14} style={{ color: '#00d4ff' }} />
              <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Risk Alerts</h3>
            </div>
            <div className="flex gap-1">
              {criticalCount > 0 && (
                <span className="text-xs font-semibold px-1.5 py-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '2px', color: '#f87171' }}>
                  {criticalCount}
                </span>
              )}
              {warningCount > 0 && (
                <span className="text-xs font-semibold px-1.5 py-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '2px', color: '#fcd34d' }}>
                  {warningCount}
                </span>
              )}
            </div>
          </div>
          {alerts.length === 0 ? (
            <div className="text-center py-6">
              <Shield size={28} className="mx-auto mb-2 opacity-20" style={{ color: '#00d4ff' }} />
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: 'rgba(0,212,255,0.3)', letterSpacing: '0.08em' }}>ALL CLEAR — NO ACTIVE ALERTS</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 8).map(alert => <RiskAlert key={alert.id} alert={alert} />)}
              {alerts.length > 8 && (
                <p className="text-xs text-center pt-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', color: 'rgba(0,212,255,0.3)' }}>
                  +{alerts.length - 8} more alerts
                </p>
              )}
            </div>
          )}
        </div>

        {/* Refresh */}
        <button
          type="button"
          onClick={() => setAlerts(computeRiskAlerts({ rides, drivers, vehicles, maintenance }))}
          className="btn-ghost w-full flex items-center justify-center gap-2 text-xs"
        >
          <RefreshCw size={12} />
          Refresh Context
        </button>
      </div>
    </div>
  );
}

export default function AIManagerPage() {
  return (
    <ErrorBoundary>
      <AIManagerInner />
    </ErrorBoundary>
  );
}

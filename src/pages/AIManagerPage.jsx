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

// ── Error boundary — catches render crashes and shows a message instead ────────
class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('AI Manager render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-full flex items-center justify-center p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              {this.state.error.message || 'An unexpected error occurred in the AI Manager.'}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="btn-primary mx-auto"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Simple inline markdown renderer ───────────────────────────────────────────
function SimpleMarkdown({ text }) {
  if (!text) return null;
  const lines = String(text).split('\n');
  const elements = [];

  const renderInline = (str) =>
    String(str).split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, idx) => {
      if (p.startsWith('**') && p.endsWith('**'))
        return <strong key={idx} className="text-white font-semibold">{p.slice(2, -2)}</strong>;
      if (p.startsWith('`') && p.endsWith('`'))
        return <code key={idx} className="px-1 py-0.5 rounded bg-navy-700 text-gold-400 text-xs font-mono">{p.slice(1, -1)}</code>;
      return p;
    });

  lines.forEach((line, i) => {
    if      (line.startsWith('### ')) elements.push(<h3 key={i} className="text-sm font-bold text-gold-400 mt-3 mb-1">{renderInline(line.slice(4))}</h3>);
    else if (line.startsWith('## '))  elements.push(<h2 key={i} className="text-base font-bold text-gold-300 mt-4 mb-1.5 border-b border-navy-600 pb-1">{renderInline(line.slice(3))}</h2>);
    else if (line.startsWith('# '))   elements.push(<h1 key={i} className="text-lg font-bold text-gold-300 mt-4 mb-2">{renderInline(line.slice(2))}</h1>);
    else if (/^\d+\.\s/.test(line))   elements.push(<p key={i} className="text-sm text-slate-200 ml-3 my-0.5 leading-relaxed">{renderInline(line)}</p>);
    else if (line.startsWith('- ') || line.startsWith('• '))
      elements.push(
        <p key={i} className="text-sm text-slate-200 ml-3 my-0.5 leading-relaxed flex gap-2">
          <span className="text-gold-500 flex-shrink-0 mt-1">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </p>
      );
    else if (line.trim() === '') elements.push(<div key={i} className="h-1.5" />);
    else elements.push(<p key={i} className="text-sm text-slate-200 leading-relaxed my-0.5">{renderInline(line)}</p>);
  });

  return <div className="space-y-0">{elements}</div>;
}

// ── Typing dots (shown while waiting for response) ────────────────────────────
function TypingDots() {
  return (
    <div className="flex gap-1 items-center py-1 px-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-gold-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// ── Risk alert ─────────────────────────────────────────────────────────────────
const SEVERITY_STYLES = {
  critical: 'bg-red-500/10 border-red-500/40 text-red-300',
  warning:  'bg-yellow-500/10 border-yellow-500/40 text-yellow-300',
  info:     'bg-blue-500/10 border-blue-500/40 text-blue-300',
};
const SEVERITY_ICONS = { critical: AlertTriangle, warning: AlertCircle, info: Info };

function RiskAlert({ alert }) {
  const Icon = SEVERITY_ICONS[alert.severity] || Info;
  return (
    <div className={`flex gap-2 p-2.5 rounded-lg border text-xs ${SEVERITY_STYLES[alert.severity] || ''}`}>
      <Icon size={13} className="flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="font-semibold leading-snug">{alert.title}</p>
        <p className="opacity-80 leading-snug mt-0.5 truncate">{alert.detail}</p>
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
  'Suggest ways to improve our dispatch efficiency.',
  'What is the best pricing strategy for airport transfers?',
];

// ── Message bubble ─────────────────────────────────────────────────────────────
function Message({ msg }) {
  const isBot = msg.role === 'assistant';
  return (
    <div className={`flex gap-2.5 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
        isBot ? 'bg-gold-500/15 border border-gold-500/30' : 'bg-navy-600 border border-navy-500'
      }`}>
        {isBot ? <Bot size={14} className="text-gold-400" /> : <User size={14} className="text-slate-300" />}
      </div>
      <div className={`max-w-[85%] px-3 py-2.5 rounded-2xl text-sm ${
        isBot
          ? 'bg-navy-700 border border-navy-600/60 rounded-tl-sm'
          : 'bg-gold-500 text-black font-medium rounded-tr-sm'
      }`}>
        {isBot
          ? (msg.loading ? <TypingDots /> : <SimpleMarkdown text={msg.text || ''} />)
          : <p className="whitespace-pre-wrap">{msg.text}</p>
        }
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
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

  // Cancel stream on unmount
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  // Auto daily briefing once per day
  useEffect(() => {
    const today    = new Date().toDateString();
    const lastDate = localStorage.getItem(LS_BRIEFING_DATE);
    const lastText = localStorage.getItem(LS_BRIEFING_TEXT);

    if (lastDate === today && lastText) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        text: '📋 **Daily Briefing** (cached)\n\n' + lastText,
      }]);
      return;
    }

    setBriefingLoading(true);
    generateDailyBriefing(model, systemPrompt)
      .then(text => {
        const briefText = text || 'Could not generate briefing.';
        localStorage.setItem(LS_BRIEFING_DATE, today);
        localStorage.setItem(LS_BRIEFING_TEXT, briefText);
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'assistant',
          text: '📋 **Daily Briefing**\n\n' + briefText,
        }]);
      })
      .catch(err => {
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'assistant',
          text: `⚠️ Could not generate daily briefing: ${err.message}`,
        }]);
      })
      .finally(() => setBriefingLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Send a chat message
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

  const cancelRequest = () => {
    abortRef.current?.abort();
    // loading/message state cleared in sendMessage's finally/catch
  };

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
        m.id === assistantId
          ? { ...m, text: `❌ ${err.message || 'Request failed'}`, loading: false }
          : m
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

  return (
    <div className="h-full flex gap-4 p-4 overflow-hidden">

      {/* ── Chat column ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-navy-800 border border-navy-600 rounded-2xl overflow-hidden min-w-0">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-navy-600 flex-shrink-0 bg-navy-700/40">
          <div className="w-9 h-9 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
            <Brain size={18} className="text-gold-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">AI Operations Manager</p>
            <p className="text-xs text-slate-400 truncate">
              {briefingLoading ? 'Generating daily briefing…' : `${model} · Fleet context loaded`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-navy-600 transition-colors"
            title="Settings"
          >
            <Settings size={15} />
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 px-4 py-2.5 border-b border-navy-600 flex-shrink-0 bg-navy-700/20 overflow-x-auto">
          {QUICK_ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => runQuickAction(action)}
                disabled={isBusy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-700 border border-navy-600 text-xs text-slate-300 hover:border-gold-500/50 hover:text-gold-400 transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {quickLoading === action.id
                  ? <span className="w-3 h-3 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                  : <Icon size={12} />
                }
                {action.label}
              </button>
            );
          })}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(m => <Message key={m.id} msg={m} />)}
          <div ref={bottomRef} />
        </div>

        {/* Suggestion chips */}
        {!hasUserMsg && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => sendMessage(s)}
                disabled={isBusy}
                className="text-xs px-2.5 py-1.5 rounded-full bg-navy-700 border border-navy-600 text-slate-300 hover:border-gold-500/50 hover:text-gold-400 transition-colors disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="p-3 border-t border-navy-600 flex gap-2 flex-shrink-0">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about dispatch, pricing, performance, risks…"
            rows={1}
            disabled={isBusy}
            className="flex-1 bg-navy-700 border border-navy-600 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500 transition-colors resize-none disabled:opacity-60"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          {loading ? (
            <button
              type="button"
              onClick={cancelRequest}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-colors flex-shrink-0"
              title="Cancel"
            >
              <X size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gold-500 hover:bg-gold-600 text-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <div className="w-72 flex flex-col gap-4 overflow-y-auto flex-shrink-0">

        {/* Fleet snapshot */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={15} className="text-gold-400" />
            <h3 className="text-sm font-semibold text-white">Fleet Snapshot</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Active Rides',    value: rides.filter(r => ['In Progress','onway','arrived'].includes(r.status)).length, color: 'text-green-400' },
              { label: 'On Duty Drivers', value: drivers.filter(d => d.status === 'On Duty').length,   color: 'text-blue-400'   },
              { label: 'Active Vehicles', value: vehicles.filter(v => v.status === 'Active').length,   color: 'text-gold-400'   },
              { label: 'Pending Rides',   value: rides.filter(r => ['Scheduled','new'].includes(r.status)).length, color: 'text-yellow-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-navy-700 rounded-lg p-2.5 border border-navy-600">
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Risk alerts */}
        <div className="card flex-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield size={15} className="text-gold-400" />
              <h3 className="text-sm font-semibold text-white">Risk Alerts</h3>
            </div>
            <div className="flex gap-1">
              {criticalCount > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold">{criticalCount}</span>}
              {warningCount  > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-semibold">{warningCount}</span>}
            </div>
          </div>
          {alerts.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              <Shield size={28} className="mx-auto mb-2 opacity-30" />
              All clear — no active alerts
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 8).map(alert => <RiskAlert key={alert.id} alert={alert} />)}
              {alerts.length > 8 && <p className="text-xs text-slate-500 text-center pt-1">+{alerts.length - 8} more alerts</p>}
            </div>
          )}
        </div>

        {/* Refresh */}
        <button
          type="button"
          onClick={() => setAlerts(computeRiskAlerts({ rides, drivers, vehicles, maintenance }))}
          className="btn-ghost w-full flex items-center justify-center gap-2 text-xs"
        >
          <RefreshCw size={13} />
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

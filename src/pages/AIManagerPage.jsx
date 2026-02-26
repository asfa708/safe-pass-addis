import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Brain, Send, Loader2, AlertTriangle, AlertCircle, Info,
  Zap, BarChart2, Truck, DollarSign, FileText, Settings,
  ChevronRight, RefreshCw, Bot, User, X, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  buildFleetContext,
  callClaudeStream,
  computeRiskAlerts,
  generateDailyBriefing,
  generateDispatchSuggestions,
  generatePricingSuggestions,
  generateMonthlyReport,
} from '../services/claudeService';

const LS_KEY_APIKEY  = 'theodorus-api-key';
const LS_KEY_MODEL   = 'theodorus-ai-model';
const LS_BRIEFING_DATE = 'theodorus-briefing-date';
const LS_BRIEFING_TEXT = 'theodorus-briefing-text';

// ── Simple inline markdown renderer ───────────────────────────────────────────
function SimpleMarkdown({ text }) {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  const renderInline = (str) => {
    // Bold + code inline
    const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((p, idx) => {
      if (p.startsWith('**') && p.endsWith('**'))
        return <strong key={idx} className="text-white font-semibold">{p.slice(2, -2)}</strong>;
      if (p.startsWith('`') && p.endsWith('`'))
        return <code key={idx} className="px-1 py-0.5 rounded bg-navy-700 text-gold-400 text-xs font-mono">{p.slice(1, -1)}</code>;
      return p;
    });
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-sm font-bold text-gold-400 mt-3 mb-1">{renderInline(line.slice(4))}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-base font-bold text-gold-300 mt-4 mb-1.5 border-b border-navy-600 pb-1">{renderInline(line.slice(3))}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-lg font-bold text-gold-300 mt-4 mb-2">{renderInline(line.slice(2))}</h1>);
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(<p key={i} className="text-sm text-slate-200 ml-3 my-0.5 leading-relaxed">{renderInline(line)}</p>);
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <p key={i} className="text-sm text-slate-200 ml-3 my-0.5 leading-relaxed flex gap-2">
          <span className="text-gold-500 flex-shrink-0 mt-1">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </p>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1.5" />);
    } else {
      elements.push(<p key={i} className="text-sm text-slate-200 leading-relaxed my-0.5">{renderInline(line)}</p>);
    }
    i++;
  }
  return <div className="space-y-0">{elements}</div>;
}

// ── Risk alert badge ───────────────────────────────────────────────────────────
const SEVERITY_STYLES = {
  critical: 'bg-red-500/10 border-red-500/40 text-red-300',
  warning:  'bg-yellow-500/10 border-yellow-500/40 text-yellow-300',
  info:     'bg-blue-500/10 border-blue-500/40 text-blue-300',
};
const SEVERITY_ICONS = {
  critical: <AlertTriangle size={13} className="flex-shrink-0 mt-0.5 text-red-400" />,
  warning:  <AlertCircle size={13} className="flex-shrink-0 mt-0.5 text-yellow-400" />,
  info:     <Info size={13} className="flex-shrink-0 mt-0.5 text-blue-400" />,
};

function RiskAlert({ alert }) {
  return (
    <div className={`flex gap-2 p-2.5 rounded-lg border text-xs ${SEVERITY_STYLES[alert.severity]}`}>
      {SEVERITY_ICONS[alert.severity]}
      <div className="min-w-0">
        <p className="font-semibold leading-snug">{alert.title}</p>
        <p className="opacity-80 leading-snug mt-0.5 truncate">{alert.detail}</p>
      </div>
    </div>
  );
}

// ── Quick action buttons ───────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { id: 'dispatch',  icon: <Truck size={14} />,     label: 'Smart Dispatch',   fn: generateDispatchSuggestions  },
  { id: 'pricing',   icon: <DollarSign size={14} />, label: 'Pricing Analysis', fn: generatePricingSuggestions   },
  { id: 'report',    icon: <FileText size={14} />,   label: 'Monthly Report',   fn: generateMonthlyReport        },
  { id: 'briefing',  icon: <Zap size={14} />,        label: 'Daily Briefing',   fn: generateDailyBriefing        },
];

const SUGGESTIONS = [
  'Which drivers are available right now?',
  'What are our top revenue-generating routes?',
  'Which vehicles need maintenance soon?',
  'Suggest ways to improve our dispatch efficiency.',
  'What is the best pricing strategy for airport transfers?',
];

// ── Message component ──────────────────────────────────────────────────────────
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
          ? (msg.streaming
              ? <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{msg.text}<span className="inline-block w-1.5 h-3.5 bg-gold-400 animate-pulse ml-0.5 align-middle" /></p>
              : <SimpleMarkdown text={msg.text} />)
          : <p className="whitespace-pre-wrap">{msg.text}</p>
        }
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AIManagerPage() {
  const navigate = useNavigate();
  const { rides, drivers, vehicles, clients, maintenance } = useApp();

  const [apiKey]  = useState(() => localStorage.getItem(LS_KEY_APIKEY) || '');
  const [model]   = useState(() => localStorage.getItem(LS_KEY_MODEL) || 'claude-sonnet-4-6');
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: "Hello! I'm the Theodorus AI Operations Manager. I have full visibility into your fleet, drivers, rides, and clients.\n\nAsk me anything — dispatch recommendations, pricing strategy, driver performance, risk analysis, or use the quick action buttons to generate reports.",
    },
  ]);
  const [input, setInput]           = useState('');
  const [streaming, setStreaming]   = useState(false);
  const [quickLoading, setQuickLoading] = useState(null);
  const [alerts, setAlerts]         = useState([]);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const abortRef  = useRef(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Compute risk alerts whenever data changes
  useEffect(() => {
    const computed = computeRiskAlerts({ rides, drivers, vehicles, maintenance });
    setAlerts(computed);
  }, [rides, drivers, vehicles, maintenance]);

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [messages]);

  // Auto-generate daily briefing once per day
  useEffect(() => {
    if (!apiKey) return;
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem(LS_BRIEFING_DATE);
    const lastText = localStorage.getItem(LS_BRIEFING_TEXT);
    if (lastDate === today && lastText) {
      // Show cached briefing
      setMessages(prev => [
        ...prev,
        { id: Date.now(), role: 'assistant', text: '📋 **Daily Briefing** (cached)\n\n' + lastText },
      ]);
      return;
    }
    // Generate fresh briefing
    const systemPrompt = buildFleetContext({ rides, drivers, vehicles, clients, maintenance });
    setBriefingLoading(true);
    generateDailyBriefing(apiKey, model, systemPrompt)
      .then(result => {
        const text = result?.content?.[0]?.text || 'Could not generate briefing.';
        localStorage.setItem(LS_BRIEFING_DATE, today);
        localStorage.setItem(LS_BRIEFING_TEXT, text);
        setMessages(prev => [
          ...prev,
          { id: Date.now(), role: 'assistant', text: '📋 **Daily Briefing**\n\n' + text },
        ]);
      })
      .catch(() => {})
      .finally(() => setBriefingLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount

  const systemPrompt = buildFleetContext({ rides, drivers, vehicles, clients, maintenance });

  // Stream a user chat message
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || streaming) return;
    if (!apiKey) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        text: '⚠️ No API key configured. Please go to **Settings** to add your Anthropic API key.',
      }]);
      return;
    }

    const userMsg = { id: Date.now(), role: 'user', text: text.trim() };
    const assistantId = Date.now() + 1;
    const assistantMsg = { id: assistantId, role: 'assistant', text: '', streaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setStreaming(true);

    // Build history for API (exclude the empty streaming message)
    const history = [...messages, userMsg]
      .filter(m => m.role === 'user' || (m.role === 'assistant' && m.text))
      .map(m => ({ role: m.role, content: m.text }));

    abortRef.current = new AbortController();

    try {
      let accumulated = '';
      for await (const chunk of callClaudeStream(apiKey, model, systemPrompt, history, abortRef.current.signal)) {
        accumulated += chunk;
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, text: accumulated } : m
        ));
      }
      // Done streaming
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, streaming: false } : m
      ));
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, text: `❌ Error: ${err.message}`, streaming: false }
            : m
        ));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [streaming, apiKey, model, systemPrompt, messages]);

  const stopStream = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  // Quick action handler
  const runQuickAction = async (action) => {
    if (streaming || quickLoading) return;
    if (!apiKey) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        text: '⚠️ No API key configured. Please go to **Settings** to add your Anthropic API key.',
      }]);
      return;
    }
    setQuickLoading(action.id);
    setMessages(prev => [...prev,
      { id: Date.now(), role: 'user', text: `Generate: ${action.label}` },
    ]);
    try {
      const result = await action.fn(apiKey, model, systemPrompt);
      const text = result?.content?.[0]?.text || 'No response generated.';
      setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', text }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        text: `❌ Error generating ${action.label}: ${err.message}`,
      }]);
    } finally {
      setQuickLoading(null);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount  = alerts.filter(a => a.severity === 'warning').length;

  return (
    <div className="h-full flex gap-4 p-4 overflow-hidden">

      {/* ── Left: Chat column ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-navy-800 border border-navy-600 rounded-2xl overflow-hidden min-w-0">

        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-navy-600 flex-shrink-0 bg-navy-700/40">
          <div className="w-9 h-9 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
            <Brain size={18} className="text-gold-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">AI Operations Manager</p>
            <p className="text-xs text-slate-400 truncate">{model} · Full fleet context loaded</p>
          </div>
          {briefingLoading && (
            <div className="flex items-center gap-1.5 text-xs text-gold-400">
              <Loader2 size={13} className="animate-spin" />
              <span>Generating briefing…</span>
            </div>
          )}
          <button
            onClick={() => navigate('/settings')}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-navy-600 transition-colors"
            title="Settings"
          >
            <Settings size={15} />
          </button>
        </div>

        {/* No API key banner */}
        {!apiKey && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-yellow-500/10 border-b border-yellow-500/20 text-xs text-yellow-300">
            <AlertTriangle size={13} className="flex-shrink-0" />
            <span>No API key configured.</span>
            <button
              onClick={() => navigate('/settings')}
              className="ml-auto flex items-center gap-1 font-semibold hover:text-yellow-200 transition-colors"
            >
              Go to Settings <ChevronRight size={12} />
            </button>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex gap-2 px-4 py-2.5 border-b border-navy-600 flex-shrink-0 bg-navy-700/20 overflow-x-auto">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.id}
              onClick={() => runQuickAction(action)}
              disabled={streaming || !!quickLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-700 border border-navy-600 text-xs text-slate-300 hover:border-gold-500/50 hover:text-gold-400 transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {quickLoading === action.id
                ? <Loader2 size={12} className="animate-spin" />
                : action.icon
              }
              {action.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(m => <Message key={m.id} msg={m} />)}
          <div ref={bottomRef} />
        </div>

        {/* Suggestion chips (show when only greeting is visible) */}
        {messages.filter(m => m.role === 'user').length === 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                disabled={streaming}
                className="text-xs px-2.5 py-1.5 rounded-full bg-navy-700 border border-navy-600 text-slate-300 hover:border-gold-500/50 hover:text-gold-400 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="p-3 border-t border-navy-600 flex gap-2 flex-shrink-0">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about dispatch, pricing, performance, risks…"
            rows={1}
            className="flex-1 bg-navy-700 border border-navy-600 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500 transition-colors resize-none"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          {streaming ? (
            <button
              onClick={stopStream}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-colors flex-shrink-0"
              title="Stop"
            >
              <X size={15} />
            </button>
          ) : (
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gold-500 hover:bg-gold-600 text-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Right: Sidebar ────────────────────────────────────────────── */}
      <div className="w-72 flex flex-col gap-4 overflow-y-auto flex-shrink-0">

        {/* Fleet snapshot */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={15} className="text-gold-400" />
            <h3 className="text-sm font-semibold text-white">Fleet Snapshot</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Active Rides',   value: rides.filter(r => r.status === 'In Progress').length, color: 'text-green-400' },
              { label: 'On Duty Drivers',value: drivers.filter(d => d.status === 'On Duty').length, color: 'text-blue-400' },
              { label: 'Active Vehicles',value: vehicles.filter(v => v.status === 'Active').length, color: 'text-gold-400' },
              { label: 'Pending Rides',  value: rides.filter(r => r.status === 'Scheduled').length, color: 'text-yellow-400' },
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
              {criticalCount > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold">{criticalCount}</span>
              )}
              {warningCount > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-semibold">{warningCount}</span>
              )}
            </div>
          </div>

          {alerts.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              <Shield size={28} className="mx-auto mb-2 opacity-30" />
              All clear — no active alerts
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 8).map(alert => (
                <RiskAlert key={alert.id} alert={alert} />
              ))}
              {alerts.length > 8 && (
                <p className="text-xs text-slate-500 text-center pt-1">
                  +{alerts.length - 8} more alerts
                </p>
              )}
            </div>
          )}
        </div>

        {/* Refresh context button */}
        <button
          onClick={() => {
            const newAlerts = computeRiskAlerts({ rides, drivers, vehicles, maintenance });
            setAlerts(newAlerts);
          }}
          className="btn-ghost w-full flex items-center justify-center gap-2 text-xs"
        >
          <RefreshCw size={13} />
          Refresh Context
        </button>
      </div>
    </div>
  );
}

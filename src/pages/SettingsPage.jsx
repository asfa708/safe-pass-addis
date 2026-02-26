import { useState, useEffect, useRef } from 'react';
import { Settings, Key, Brain, CheckCircle, AlertCircle, Eye, EyeOff, Save, Trash2, Loader2 } from 'lucide-react';
import { callClaude } from '../services/claudeService';

const MODELS = [
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', desc: 'Best balance of speed and intelligence (recommended)' },
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', desc: 'Most powerful — best for complex analysis' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', desc: 'Fastest and most cost-efficient' },
];

const LS_KEY_APIKEY = 'theodorus-api-key';
const LS_KEY_MODEL  = 'theodorus-ai-model';

export default function SettingsPage() {
  const [apiKey, setApiKey]     = useState('');
  const [model, setModel]       = useState('claude-sonnet-4-6');
  const [showKey, setShowKey]   = useState(false);
  const [saved, setSaved]       = useState(false);
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [testMsg, setTestMsg]   = useState('');
  const savedTimerRef = useRef(null);

  // Load from localStorage on mount
  useEffect(() => {
    const k = localStorage.getItem(LS_KEY_APIKEY) || '';
    const m = localStorage.getItem(LS_KEY_MODEL) || 'claude-sonnet-4-6';
    setApiKey(k);
    setModel(m);
    setHasSavedKey(!!k);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current); };
  }, []);

  const handleSave = () => {
    const trimmed = apiKey.trim();
    localStorage.setItem(LS_KEY_APIKEY, trimmed);
    localStorage.setItem(LS_KEY_MODEL, model);
    setHasSavedKey(!!trimmed);
    setTestStatus(null);
    setSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaved(false), 3000);
  };

  const handleClear = () => {
    setApiKey('');
    setHasSavedKey(false);
    setSaved(false);
    localStorage.removeItem(LS_KEY_APIKEY);
    setTestStatus(null);
  };

  const handleTest = async () => {
    const key = apiKey.trim() || localStorage.getItem(LS_KEY_APIKEY) || '';
    if (!key) {
      setTestStatus('error');
      setTestMsg('No API key set. Save your key first.');
      return;
    }
    setTestStatus('loading');
    setTestMsg('');
    try {
      const result = await callClaude(key, model, 'You are a helpful assistant.', [
        { role: 'user', content: 'Reply with exactly: "Connection successful."' },
      ]);
      if (result?.content?.[0]?.text) {
        setTestStatus('ok');
        setTestMsg(result.content[0].text.trim());
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      setTestStatus('error');
      setTestMsg(err.message || 'Connection failed');
    }
  };

  const maskedKey = apiKey ? apiKey.slice(0, 8) + '•'.repeat(Math.max(0, apiKey.length - 12)) + apiKey.slice(-4) : '';

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
          <Settings size={20} className="text-gold-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-sm text-slate-400">Configure AI Manager and application preferences</p>
        </div>
      </div>

      {/* AI Configuration card */}
      <div className="card space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-navy-600">
          <Brain size={18} className="text-gold-400" />
          <h2 className="text-base font-semibold text-white">AI Manager Configuration</h2>
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <label className="label flex items-center gap-1.5">
            <Key size={13} className="text-gold-400" />
            Anthropic API Key
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => { setApiKey(e.target.value); setSaved(false); setTestStatus(null); }}
                placeholder="sk-ant-api03-..."
                className="input w-full pr-10 font-mono text-sm"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="btn-ghost px-3 text-red-400 hover:text-red-300 border-red-500/30 hover:border-red-500/50"
              title="Clear saved key"
            >
              <Trash2 size={15} />
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Your key is stored only in your browser's localStorage and never sent anywhere except directly to Anthropic's API.
            {hasSavedKey && (
              <span className="ml-1 text-green-400">Currently saved: {maskedKey}</span>
            )}
          </p>
        </div>

        {/* Model selector */}
        <div className="space-y-2">
          <label className="label flex items-center gap-1.5">
            <Brain size={13} className="text-gold-400" />
            AI Model
          </label>
          <div className="space-y-2">
            {MODELS.map(m => (
              <label
                key={m.id}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  model === m.id
                    ? 'border-gold-500/60 bg-gold-500/5'
                    : 'border-navy-600 hover:border-navy-500'
                }`}
              >
                <input
                  type="radio"
                  name="model"
                  value={m.id}
                  checked={model === m.id}
                  onChange={() => { setModel(m.id); setSaved(false); }}
                  className="mt-0.5 accent-gold-500"
                />
                <div>
                  <p className={`text-sm font-medium ${model === m.id ? 'text-gold-400' : 'text-white'}`}>{m.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{m.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Save success banner */}
        {saved && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-sm text-green-300">
            <CheckCircle size={16} className="flex-shrink-0" />
            <span>Settings saved successfully.</span>
          </div>
        )}

        {/* Test connection result */}
        {testStatus === 'ok' && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-sm text-green-300">
            <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{testMsg}</span>
          </div>
        )}
        {testStatus === 'error' && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{testMsg}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
          >
            {saved ? <CheckCircle size={15} /> : <Save size={15} />}
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
          <button
            type="button"
            onClick={handleTest}
            disabled={testStatus === 'loading'}
            className="btn-ghost flex items-center gap-2"
          >
            {testStatus === 'loading' ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Brain size={15} />
            )}
            Test Connection
          </button>
        </div>
      </div>

      {/* Info card */}
      <div className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">How to get an API key</h2>
        <ol className="space-y-1.5 text-sm text-slate-400 list-decimal list-inside">
          <li>Go to <span className="text-gold-400 font-mono">console.anthropic.com</span></li>
          <li>Sign in or create an Anthropic account</li>
          <li>Navigate to <span className="font-medium text-slate-300">API Keys</span> in the sidebar</li>
          <li>Click <span className="font-medium text-slate-300">Create Key</span>, name it "Theodorus"</li>
          <li>Copy the key (starts with <span className="font-mono text-slate-300">sk-ant-</span>) and paste it above</li>
        </ol>
        <p className="text-xs text-slate-500 pt-1">
          API usage is billed to your Anthropic account. The AI Manager is designed to be efficient — daily briefings and chat queries use minimal tokens.
        </p>
      </div>
    </div>
  );
}

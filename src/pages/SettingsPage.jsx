import { useState, useEffect } from 'react';
import { Settings, Brain, CheckCircle, AlertCircle, Loader2, Server, Info } from 'lucide-react';
import { callClaude } from '../services/claudeService';

const MODELS = [
  { id: 'claude-sonnet-4-6',          label: 'Claude Sonnet 4.6',  desc: 'Best balance of speed and intelligence (recommended)' },
  { id: 'claude-opus-4-6',            label: 'Claude Opus 4.6',    desc: 'Most powerful — best for complex analysis' },
  { id: 'claude-haiku-4-5-20251001',  label: 'Claude Haiku 4.5',   desc: 'Fastest and most cost-efficient' },
];

const LS_KEY_MODEL = 'theodorus-ai-model';

export default function SettingsPage() {
  const [model, setModel]           = useState('claude-sonnet-4-6');
  const [saved, setSaved]           = useState(false);
  const [testStatus, setTestStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [testMsg, setTestMsg]       = useState('');

  useEffect(() => {
    const m = localStorage.getItem(LS_KEY_MODEL) || 'claude-sonnet-4-6';
    setModel(m);
  }, []);

  const handleSave = () => {
    localStorage.setItem(LS_KEY_MODEL, model);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTest = async () => {
    setTestStatus('loading');
    setTestMsg('');
    try {
      const text = await callClaude(model, 'You are a helpful assistant.', [
        { role: 'user', content: 'Reply with exactly three words: "Connection is working."' },
      ]);
      if (text) {
        setTestStatus('ok');
        setTestMsg(text.trim());
      } else {
        throw new Error('Empty response from server');
      }
    } catch (err) {
      setTestStatus('error');
      setTestMsg(err.message || 'Connection failed');
    }
  };

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

      {/* Server API key info */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-navy-600">
          <Server size={16} className="text-gold-400" />
          <h2 className="text-base font-semibold text-white">API Key</h2>
        </div>
        <div className="flex gap-2.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
          <Info size={16} className="flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">The API key is stored securely on the server.</p>
            <p className="text-xs text-blue-400">
              To update it, go to <span className="font-semibold">Netlify → Your site → Site configuration → Environment variables</span> and set <span className="font-mono bg-blue-500/20 px-1 rounded">ANTHROPIC_API_KEY</span>. Changes take effect on the next deploy.
            </p>
          </div>
        </div>
      </div>

      {/* Model selector */}
      <div className="card space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-navy-600">
          <Brain size={18} className="text-gold-400" />
          <h2 className="text-base font-semibold text-white">AI Model</h2>
        </div>

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
                onChange={() => { setModel(m.id); setSaved(false); setTestStatus(null); }}
                className="mt-0.5 accent-gold-500"
              />
              <div>
                <p className={`text-sm font-medium ${model === m.id ? 'text-gold-400' : 'text-white'}`}>{m.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{m.desc}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Success banner */}
        {saved && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-sm text-green-300">
            <CheckCircle size={16} className="flex-shrink-0" />
            <span>Model preference saved.</span>
          </div>
        )}

        {/* Test result */}
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

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
          >
            {saved ? <CheckCircle size={15} /> : null}
            {saved ? 'Saved!' : 'Save Model'}
          </button>
          <button
            type="button"
            onClick={handleTest}
            disabled={testStatus === 'loading'}
            className="btn-ghost flex items-center gap-2"
          >
            {testStatus === 'loading'
              ? <Loader2 size={15} className="animate-spin" />
              : <Brain size={15} />
            }
            Test Connection
          </button>
        </div>
      </div>
    </div>
  );
}

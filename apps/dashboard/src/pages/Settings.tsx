import React from 'react';
import { Shield, Key, Users, Check, Copy, Save } from 'lucide-react';

const STORAGE_KEY = '_sp_settings';

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as { name: string; plan: string };
  } catch {}
  return { name: 'My Organization', plan: 'free' };
}

export const Settings: React.FC = () => {
  const [name, setName] = React.useState(() => loadSettings().name);
  const [plan, setPlan] = React.useState(() => loadSettings().plan);
  const [isSaved, setIsSaved] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const apiKey = React.useMemo(() => {
    const stored = loadSettings();
    const slug = stored.name.toLowerCase().replace(/\s+/g, '_').slice(0, 12);
    return `sp_live_${slug}_${Math.random().toString(36).slice(2, 10)}`;
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, plan }));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Settings & Credentials</h1>
        <p className="text-slate-400 text-sm">Manage organization name, billing plan tier, and secure API credentials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Organization card */}
        <form onSubmit={handleSave} className="glass-card rounded-2xl p-6 md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-200 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Organization Parameters
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold uppercase tracking-wider font-mono">
              Local Storage
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Organization Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
              />
              <p className="text-[11px] text-slate-500">
                In production this is synced with your Clerk organization. Saved locally here.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Billing Plan Tier</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-300 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
              >
                <option value="free">FREE — 1,000 views / mo</option>
                <option value="starter">STARTER — 25,000 views / mo</option>
                <option value="growth">GROWTH — 150,000 views / mo</option>
                <option value="scale">SCALE — 500,000 views / mo</option>
                <option value="agency">AGENCY — 2,000,000 views / mo</option>
              </select>
              <p className="text-[11px] text-slate-500">
                In production this is enforced via Stripe billing events. Toggle freely to test limit features.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              {isSaved ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        </form>

        {/* API Credentials */}
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <h3 className="font-bold text-lg text-slate-200 flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-400" /> API Keys
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed">
            Use this secure webhook token to connect events or push external campaign triggers. Keep it secret!
          </p>

          <div className="space-y-3">
            <div className="relative">
              <input
                type="password"
                disabled
                value={apiKey}
                className="w-full bg-slate-950 border border-slate-800 text-indigo-300 rounded-xl pl-4 pr-12 py-3 text-xs focus:outline-none cursor-not-allowed font-mono"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[10px] text-amber-400 font-semibold">Never share this key publicly.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { User, Mail, Shield, Sparkles, Key, Check, Sliders, Settings } from 'lucide-react';

interface ProfileProps {
  isDemo: boolean;
  isDesktop?: boolean;
  onNavigate: (path: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ isDemo, isDesktop = false, onNavigate }) => {
  const [profile, setProfile] = React.useState({
    name: 'Dev Admin',
    email: isDesktop ? 'admin@scrollpop.local' : 'admin@scrollpop.dev',
    role: 'Admin Manager',
    avatar: '',
    developerMode: true,
    defaultTrigger: 'scroll_pct',
    apiKey: 'sp_pk_live_a3e8630f904adceddc1d0553d7bcda0c'
  });

  const [isSaved, setIsSaved] = React.useState(false);

  // Load from localStorage on mount (desktop_user takes priority)
  React.useEffect(() => {
    const desktopUser = localStorage.getItem('desktop_user');
    if (desktopUser) {
      try {
        const u = JSON.parse(desktopUser);
        setProfile((p) => ({ ...p, name: u.name ?? p.name, email: u.email ?? p.email, avatar: u.avatarUrl ?? p.avatar }));
        return;
      } catch {}
    }
    const stored = localStorage.getItem('_sp_profile');
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('_sp_profile', JSON.stringify(profile));

    if (isDesktop) {
      const token = localStorage.getItem('desktop_token');
      const apiBase = (window as any).electronAPI?.getLocalApiUrl?.() ?? 'http://127.0.0.1:3010';
      try {
        const res = await fetch(`${apiBase}/api/v1/auth/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: profile.name, avatarUrl: profile.avatar }),
        });
        if (res.ok) {
          const resJson = await res.json();
          const dbUser = resJson.data || resJson;
          localStorage.setItem('desktop_user', JSON.stringify(dbUser));
        }
      } catch {}
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    window.dispatchEvent(new Event('storage'));
  };

  const handleGenerateKey = () => {
    const newKey = `sp_pk_live_${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    setProfile({ ...profile, apiKey: newKey });
  };

  const avatarsPreset = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80'
  ];

  return (
    <div className="space-y-8 font-sans">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Account Profile</h1>
        <p className="text-slate-400 text-sm">Configure your personal information, developer tokens, and platform preferences.</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Avatar selector card */}
        <div className="glass-card rounded-3xl p-6 flex flex-col items-center text-center space-y-6">
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profile Picture</span>
            <div className="relative group">
              <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-teal-400 opacity-75 blur-[4px]"></div>
              <img
                src={profile.avatar}
                alt="Profile Avatar"
                className="relative w-24 h-24 rounded-full object-cover border-4 border-slate-950 shadow-2xl"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="space-y-2.5 w-full">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">Choose Avatar Preset</span>
            <div className="flex justify-center gap-3">
              {avatarsPreset.map((avUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setProfile({ ...profile, avatar: avUrl })}
                  className={`w-9 h-9 rounded-full overflow-hidden border-2 cursor-pointer transition ${
                    profile.avatar === avUrl ? 'border-indigo-400 scale-105 shadow' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <img src={avUrl} className="w-full h-full object-cover" alt={`preset-${idx}`} />
                </button>
              ))}
            </div>
            <div className="pt-2">
              <input
                type="text"
                placeholder="Or paste custom image URL..."
                value={profile.avatar}
                onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-slate-300 rounded-xl px-3 py-2 text-[10px] focus:outline-none transition font-mono"
              />
            </div>
          </div>

          <div className="border-t border-slate-800/80 w-full pt-4 text-center">
            <span className="text-xs text-indigo-400 font-extrabold capitalize">{profile.role}</span>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">{profile.email}</p>
          </div>
        </div>

        {/* Center / Right: Profile credentials */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-3xl p-6 space-y-6">
            <h3 className="font-extrabold text-lg text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <User className="w-5 h-5 text-indigo-400" /> Account Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition"
                  />
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition"
                  />
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Access Role</label>
                <div className="relative">
                  <select
                    value={profile.role}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition"
                  >
                    <option value="Admin Manager">Admin Manager</option>
                    <option value="Lead Developer">Lead Developer</option>
                    <option value="Editor Creative">Editor Creative</option>
                    <option value="Marketing Owner">Marketing Owner</option>
                  </select>
                  <Shield className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Default Trigger Type</label>
                <div className="relative">
                  <select
                    value={profile.defaultTrigger}
                    onChange={(e) => setProfile({ ...profile, defaultTrigger: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition"
                  >
                    <option value="scroll_pct">Scroll Percentage</option>
                    <option value="dwell_time">Dwell Time (Seconds)</option>
                    <option value="inactivity">Inactivity Trigger</option>
                  </select>
                  <Sliders className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Developer center API access */}
          <div className="glass-card rounded-3xl p-6 space-y-6">
            <h3 className="font-extrabold text-lg text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Key className="w-5 h-5 text-indigo-400" /> Developer Credentials
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={profile.developerMode}
                    onChange={(e) => setProfile({ ...profile, developerMode: e.target.checked })}
                    className="rounded text-indigo-600 bg-slate-950 border-slate-850"
                  />
                  Enable Developer API Access Dashboard Widgets
                </label>
              </div>

              {profile.developerMode && (
                <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Edge Public Key</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={profile.apiKey}
                      className="flex-1 bg-slate-950 border border-slate-850 text-slate-300 rounded-xl px-4 py-2 text-xs font-mono select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateKey}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition shrink-0"
                    >
                      Roll Key
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    This key identifies your sites programmatically when requesting stand-alone affiliate popup schedules from Edge DNS layers.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('/dashboard')}
              className="px-5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold text-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-sm transition shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Settings className="w-4 h-4" />}
              {isSaved ? 'Changes Saved!' : 'Save Account Settings'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

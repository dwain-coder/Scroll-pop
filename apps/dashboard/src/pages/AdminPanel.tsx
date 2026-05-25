import React from 'react';
import { Shield, Users, Mail, CreditCard, Globe, Megaphone, Activity, RefreshCw, Crown, Lock } from 'lucide-react';
import { usePlan, ADMIN_EMAIL, PLAN_PRICES } from '../hooks/usePlan';
import type { PlanId } from '../hooks/usePlan';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  plan?: PlanId;
  orgName?: string;
  siteCount?: number;
  campaignCount?: number;
  createdAt?: string;
}

const PLAN_COLORS: Record<string, string> = {
  free: 'text-slate-400 bg-slate-900 border-slate-800',
  starter: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  growth: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  scale: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  agency: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  admin: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
};

interface AdminPanelProps {
  onNavigate: (path: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigate }) => {
  const { isAdmin } = usePlan();
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const isDesktop = !!(window as any).electronAPI?.isDesktop;
      if (isDesktop) {
        const token = localStorage.getItem('desktop_token');
        const apiBase = (window as any).electronAPI.getLocalApiUrl();
        const res = await fetch(`${apiBase}/api/v1/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const body = await res.json();
        setUsers(body.data ?? []);
      } else {
        // Web / Clerk mode — pull from admin API
        const res = await fetch('/api/v1/admin/users', {
          headers: { 'X-Admin-Email': ADMIN_EMAIL },
        });
        if (res.ok) {
          const body = await res.json();
          setUsers(body.data ?? []);
        } else {
          // Fallback: show current logged-in user's info
          const profileRaw = localStorage.getItem('_sp_profile') || localStorage.getItem('desktop_user');
          const settingsRaw = localStorage.getItem('_sp_settings');
          const profile = profileRaw ? JSON.parse(profileRaw) : {};
          const settings = settingsRaw ? JSON.parse(settingsRaw) : {};
          setUsers([{
            id: '1',
            email: profile.email ?? ADMIN_EMAIL,
            name: profile.name ?? 'Admin',
            role: 'admin',
            avatarUrl: profile.avatar ?? profile.avatarUrl,
            plan: settings.plan ?? 'free',
            orgName: settings.name ?? 'My Organization',
          }]);
        }
      }
    } catch (e: any) {
      setError(e.message ?? 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchUsers(); }, [fetchUsers]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
          <Lock className="w-8 h-8 text-rose-400" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-100">Access Denied</h2>
        <p className="text-slate-400 text-sm max-w-xs">This area is restricted to master administrators only.</p>
        <button
          onClick={() => onNavigate('/dashboard')}
          className="mt-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-sm cursor-pointer hover:bg-slate-800 transition"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const filtered = users.filter(u =>
    (u.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.orgName ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    paid: users.filter(u => u.plan && u.plan !== 'free').length,
    mrr: users.reduce((sum, u) => {
      const price = u.plan ? parseFloat(PLAN_PRICES[u.plan]?.replace('$', '') ?? '0') : 0;
      return sum + price;
    }, 0),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Crown className="w-6 h-6 text-amber-400" />
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Master Admin Console</h1>
          </div>
          <p className="text-slate-400 text-sm">Full visibility across all accounts. Only you can see this.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-black uppercase tracking-widest border border-emerald-500/20">
            Admin Access
          </span>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: 'text-indigo-400' },
          { label: 'Paid Accounts', value: stats.paid, icon: CreditCard, color: 'text-emerald-400' },
          { label: 'Est. MRR', value: `$${stats.mrr.toLocaleString()}`, icon: Activity, color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-slate-900 border border-slate-800 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-black text-slate-100">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by name, email, or organization..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition"
        />
      </div>

      {/* User table */}
      {error ? (
        <div className="glass-card rounded-2xl p-6 text-center text-rose-400 text-sm font-semibold border border-rose-500/20">
          {error}
        </div>
      ) : loading ? (
        <div className="glass-card rounded-2xl p-12 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/80">
                  <th className="text-left px-5 py-3.5 text-[11px] font-black text-slate-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-black text-slate-500 uppercase tracking-wider">Organization</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-black text-slate-500 uppercase tracking-wider">Plan</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-black text-slate-500 uppercase tracking-wider">Sites</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-black text-slate-500 uppercase tracking-wider">Campaigns</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-black text-slate-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500 text-sm">
                      No users match your search.
                    </td>
                  </tr>
                ) : filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} className="w-8 h-8 rounded-full object-cover border border-slate-700" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                            {u.name}
                            {u.role === 'admin' && <Shield className="w-3.5 h-3.5 text-amber-400" />}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-slate-300 text-sm">{u.orgName ?? '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${PLAN_COLORS[u.role === 'admin' ? 'admin' : (u.plan ?? 'free')]}`}>
                        {u.role === 'admin' ? 'Master Admin' : (u.plan ?? 'free')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-slate-400 text-sm">
                        <Globe className="w-3.5 h-3.5" /> {u.siteCount ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-slate-400 text-sm">
                        <Megaphone className="w-3.5 h-3.5" /> {u.campaignCount ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-slate-500 text-xs font-mono">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-600 text-center">
        Logged in as master admin: {ADMIN_EMAIL} · All data is private to your session
      </p>
    </div>
  );
};

import React from 'react';
import {
  CreditCard, CheckCircle2, XCircle, TrendingUp, Sparkles, Download,
  Check, DollarSign, Zap, Crown, Lock, Shield
} from 'lucide-react';
import { usePlan, PLAN_LIMITS, PLAN_PRICES, PLAN_ORDER } from '../hooks/usePlan';
import type { PlanId } from '../hooks/usePlan';

interface BillingProps {
  onNavigate?: (path: string) => void;
}

const PLAN_DETAILS: {
  id: PlanId;
  name: string;
  tagline: string;
  highlight?: boolean;
}[] = [
  { id: 'free',    name: 'Free',    tagline: 'Get started — no card needed' },
  { id: 'starter', name: 'Starter', tagline: 'For solo creators & bloggers' },
  { id: 'growth',  name: 'Growth',  tagline: 'For growing affiliate sites', highlight: true },
  { id: 'scale',   name: 'Scale',   tagline: 'For high-traffic publishers' },
  { id: 'agency',  name: 'Agency',  tagline: 'For agencies & white-label resellers' },
];

type FeatureKey = keyof typeof PLAN_LIMITS.free;

const FEATURE_ROWS: { key: FeatureKey; label: string; minPlan: PlanId }[] = [
  { key: 'noWatermark',       label: 'No ScrollPop branding',       minPlan: 'starter' },
  { key: 'prioritySupport',   label: 'Priority support',            minPlan: 'starter' },
  { key: 'geoTargeting',      label: 'Geo & device targeting',      minPlan: 'growth'  },
  { key: 'abTesting',         label: 'A/B testing',                 minPlan: 'growth'  },
  { key: 'advancedAnalytics', label: 'Advanced analytics',          minPlan: 'growth'  },
  { key: 'customWebhooks',    label: 'Custom webhooks & triggers',  minPlan: 'growth'  },
  { key: 'apiAccess',         label: 'Full REST API access',        minPlan: 'agency'  },
  { key: 'whiteLabel',        label: 'White-label reseller mode',   minPlan: 'agency'  },
];

function formatLimit(val: number): string {
  if (val === Infinity) return 'Unlimited';
  return val.toLocaleString();
}

export const Billing: React.FC<BillingProps> = ({ onNavigate }) => {
  const { plan: currentPlan, isAdmin, limits } = usePlan();

  const [overview, setOverview] = React.useState<{ views?: number } | null>(null);
  const [isLicensePurchased, setIsLicensePurchased] = React.useState(false);
  const [licenseKey, setLicenseKey] = React.useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [checkoutPlan, setCheckoutPlan] = React.useState<PlanId | null>(null);

  React.useEffect(() => {
    const isDesktop = !!(window as any).electronAPI?.isDesktop;
    const apiBase = isDesktop ? `${(window as any).electronAPI?.getLocalApiUrl()}/api/v1` : '/api/v1';
    const token = isDesktop ? localStorage.getItem('desktop_token') : null;
    fetch(`${apiBase}/analytics/overview`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.ok ? r.json() : null)
      .then((b) => b && setOverview(b.data))
      .catch(() => {});

    const purchased = localStorage.getItem('_sp_standalone_license') === 'true';
    const key = localStorage.getItem('_sp_standalone_key') || '';
    setIsLicensePurchased(purchased);
    setLicenseKey(key);
  }, []);

  const currentViews = overview?.views ?? 0;
  const viewLimit = isAdmin ? Infinity : limits.maxViews;
  const usagePct = viewLimit === Infinity ? 0 : Math.min((currentViews / viewLimit) * 100, 100);

  const handleUpgradeClick = (planId: PlanId) => {
    if (planId === currentPlan) return;
    setCheckoutPlan(planId);
    setIsCheckoutOpen(true);
  };

  const handleConfirmUpgrade = () => {
    if (!checkoutPlan) return;
    const settings = JSON.parse(localStorage.getItem('_sp_settings') || '{}');
    settings.plan = checkoutPlan;
    localStorage.setItem('_sp_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('storage'));
    setIsCheckoutOpen(false);
    setCheckoutPlan(null);
  };

  const handleStandalonePurchase = () => {
    const key = `SP-STANDALONE-LIC-${Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase()}`;
    localStorage.setItem('_sp_standalone_license', 'true');
    localStorage.setItem('_sp_standalone_key', key);
    setIsLicensePurchased(true);
    setLicenseKey(key);
  };

  const handleDownloadSnippet = async () => {
    try {
      const scriptCode = `/** ScrollPop Standalone Offline Bundle (License: ${licenseKey}) */\n(function(){ console.log('[ScrollPop] Offline standalone active.'); })();`;
      const blob = new Blob([scriptCode], { type: 'application/javascript' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'scrollpop-standalone.js';
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch {
      alert('Failed to generate download.');
    }
  };

  return (
    <div className="space-y-10 font-sans">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Billing & Plans</h1>
        <p className="text-slate-400 text-sm">Manage your subscription, track usage, and unlock features.</p>
      </div>

      {/* Admin badge */}
      {isAdmin && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <Crown className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-emerald-300 font-black text-sm">Master Admin — Unlimited Access</p>
            <p className="text-slate-500 text-xs">All plan limits are removed. All features are unlocked.</p>
          </div>
        </div>
      )}

      {/* Usage meter */}
      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-xs">Monthly Popup Views</span>
            <span className="font-bold text-slate-300">
              {currentViews.toLocaleString()} / {viewLimit === Infinity ? '∞' : viewLimit.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-950 border border-slate-900 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usagePct > 85 ? 'bg-gradient-to-r from-rose-500 to-orange-500 animate-pulse' :
                  'bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500'
              }`}
              style={{ width: `${viewLimit === Infinity ? 0 : usagePct}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <TrendingUp className="w-4 h-4" />
            {isAdmin ? 'Unlimited — no cap on your account.' : `${Math.round(usagePct)}% of monthly quota used`}
          </div>
        </div>
        <div className="md:border-l md:border-slate-800 md:pl-8 shrink-0 min-w-[160px]">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Current Plan</span>
          <span className="text-2xl font-black tracking-tight text-indigo-400 capitalize">
            {isAdmin ? 'Master Admin' : currentPlan}
          </span>
          {!isAdmin && (
            <p className="text-[11px] text-slate-500 mt-1">{PLAN_PRICES[currentPlan]}/mo</p>
          )}
        </div>
      </div>

      {/* Plan comparison grid */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-slate-200">Subscription Plans</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PLAN_DETAILS.map(({ id, name, tagline, highlight }) => {
            const isCurrent = !isAdmin && currentPlan === id;
            const planLimits = PLAN_LIMITS[id];
            return (
              <div
                key={id}
                className={`glass-card rounded-2xl p-5 flex flex-col gap-5 relative border transition-all ${
                  isCurrent
                    ? 'border-indigo-500 shadow-lg shadow-indigo-500/10'
                    : highlight
                      ? 'border-violet-500/40 shadow-md shadow-violet-500/5'
                      : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-bl-xl tracking-wider">
                    Current
                  </div>
                )}
                {highlight && !isCurrent && (
                  <div className="absolute top-0 right-0 bg-violet-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-bl-xl tracking-wider">
                    Popular
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-slate-300 font-extrabold text-sm">{name}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-100">{PLAN_PRICES[id]}</span>
                    {PLAN_PRICES[id] !== '$0' && <span className="text-[10px] text-slate-500 font-semibold">/mo</span>}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{tagline}</p>
                </div>

                <div className="space-y-2 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Views/mo</span>
                    <span className="font-bold text-slate-300">{formatLimit(planLimits.maxViews)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sites</span>
                    <span className="font-bold text-slate-300">{formatLimit(planLimits.maxSites)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Campaigns</span>
                    <span className="font-bold text-slate-300">{formatLimit(planLimits.maxCampaigns)}</span>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-800 pt-3">
                  {FEATURE_ROWS.slice(0, 4).map(({ key, label }) => {
                    const has = (planLimits as any)[key] as boolean;
                    return (
                      <div key={key} className={`flex items-center gap-1.5 text-[10px] ${has ? 'text-slate-300' : 'text-slate-600'}`}>
                        {has
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          : <XCircle className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                        }
                        {label}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => handleUpgradeClick(id)}
                  disabled={isCurrent || isAdmin}
                  className={`w-full py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    isCurrent || isAdmin
                      ? 'bg-slate-900 border border-slate-800 text-slate-600 cursor-default'
                      : PLAN_ORDER.indexOf(id) > PLAN_ORDER.indexOf(currentPlan)
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/10 hover:shadow-indigo-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : isAdmin ? 'Admin Access' :
                    PLAN_ORDER.indexOf(id) > PLAN_ORDER.indexOf(currentPlan) ? 'Upgrade' : 'Downgrade'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full feature matrix */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-slate-200">Full Feature Comparison</h3>
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-3 text-[11px] font-black text-slate-500 uppercase tracking-wider w-48">Feature</th>
                  {PLAN_DETAILS.map(({ id, name }) => (
                    <th key={id} className={`px-4 py-3 text-center text-[11px] font-black uppercase tracking-wider ${
                      !isAdmin && currentPlan === id ? 'text-indigo-400' : 'text-slate-500'
                    }`}>
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                <tr className="bg-slate-900/30">
                  <td className="px-5 py-2.5 text-[11px] font-black text-slate-500 uppercase tracking-wider">Views / mo</td>
                  {PLAN_DETAILS.map(({ id }) => (
                    <td key={id} className="px-4 py-2.5 text-center text-[11px] font-bold text-slate-300">
                      {formatLimit(PLAN_LIMITS[id].maxViews)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-2.5 text-[11px] font-black text-slate-500 uppercase tracking-wider">Max Sites</td>
                  {PLAN_DETAILS.map(({ id }) => (
                    <td key={id} className="px-4 py-2.5 text-center text-[11px] font-bold text-slate-300">
                      {formatLimit(PLAN_LIMITS[id].maxSites)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-900/30">
                  <td className="px-5 py-2.5 text-[11px] font-black text-slate-500 uppercase tracking-wider">Max Campaigns</td>
                  {PLAN_DETAILS.map(({ id }) => (
                    <td key={id} className="px-4 py-2.5 text-center text-[11px] font-bold text-slate-300">
                      {formatLimit(PLAN_LIMITS[id].maxCampaigns)}
                    </td>
                  ))}
                </tr>
                {FEATURE_ROWS.map(({ key, label }, i) => (
                  <tr key={key} className={i % 2 === 0 ? '' : 'bg-slate-900/30'}>
                    <td className="px-5 py-2.5 text-xs text-slate-400">{label}</td>
                    {PLAN_DETAILS.map(({ id }) => {
                      const has = (PLAN_LIMITS[id] as any)[key] as boolean;
                      return (
                        <td key={id} className="px-4 py-2.5 text-center">
                          {has
                            ? <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                            : <span className="text-slate-700 text-lg leading-none mx-auto block text-center">—</span>
                          }
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Standalone license */}
      <div className="glass-card rounded-3xl p-8 relative overflow-hidden border-l-4 border-amber-500 space-y-6">
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-amber-500/10 rounded-full blur-[50px] pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-xl text-slate-100">Standalone Lifetime License</h3>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Self-hosted, offline-capable .js bundle with no cloud subscription checks. One-time $100 payment. Includes lifetime updates.
            </p>
          </div>
          <div className="shrink-0 self-start md:self-center">
            {isLicensePurchased ? (
              <button
                onClick={handleDownloadSnippet}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all hover:scale-105"
              >
                <Download className="w-4 h-4" /> Download scrollpop-standalone.js
              </button>
            ) : (
              <button
                onClick={handleStandalonePurchase}
                className="flex items-center gap-1.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all hover:scale-105"
              >
                <DollarSign className="w-4 h-4" /> Buy Standalone License — $100
              </button>
            )}
          </div>
        </div>
        {isLicensePurchased && (
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 max-w-md font-mono text-[11px] text-amber-400 space-y-1">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">License Key</span>
            {licenseKey}
          </div>
        )}
      </div>

      {/* Plan upgrade modal */}
      {isCheckoutOpen && checkoutPlan && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-50 px-4">
          <div className="glass-card rounded-2xl max-w-sm w-full p-6 space-y-6 relative z-10">
            <div className="text-center space-y-1.5 pb-4 border-b border-slate-800">
              <span className="text-4xl block mb-2">⚡</span>
              <h3 className="font-extrabold text-xl text-slate-100">
                Upgrade to {checkoutPlan.charAt(0).toUpperCase() + checkoutPlan.slice(1)}
              </h3>
              <p className="text-slate-400 text-xs">Simulated billing — plan will activate immediately.</p>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-sm">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-400">ScrollPop {checkoutPlan.charAt(0).toUpperCase() + checkoutPlan.slice(1)}</span>
                <span className="text-white">{PLAN_PRICES[checkoutPlan]}/mo</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 border-t border-slate-800 pt-2">
                <span>Views included</span>
                <span>{formatLimit(PLAN_LIMITS[checkoutPlan].maxViews)} / mo</span>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => { setIsCheckoutOpen(false); setCheckoutPlan(null); }}
                className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold text-sm transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpgrade}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-sm transition shadow-lg cursor-pointer"
              >
                Confirm Upgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

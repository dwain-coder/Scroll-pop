import React from 'react';
import { Lock, Zap } from 'lucide-react';
import { usePlan, PLAN_PRICES, PLAN_ORDER } from '../hooks/usePlan';
import type { PlanId } from '../hooks/usePlan';

interface PlanGateProps {
  requiredPlan: PlanId;
  feature?: string;
  onNavigate?: (path: string) => void;
  children: React.ReactNode;
}

export const PlanGate: React.FC<PlanGateProps> = ({ requiredPlan, feature, onNavigate, children }) => {
  const { isAdmin, plan } = usePlan();
  const hasAccess = isAdmin || PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(requiredPlan);
  if (hasAccess) return <>{children}</>;

  const planLabel = requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1);

  return (
    <div className="glass-card rounded-2xl p-10 flex flex-col items-center text-center gap-5 border border-amber-500/20 bg-amber-500/[0.03]">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
        <Lock className="w-8 h-8 text-amber-400" />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-extrabold text-xl text-slate-100">
          {feature ?? 'This feature'} requires {planLabel}
        </h3>
        <p className="text-slate-400 text-sm max-w-sm">
          You're on the <span className="font-bold text-indigo-400 capitalize">{plan}</span> plan. Upgrade to unlock this and everything below it.
        </p>
      </div>
      {onNavigate && (
        <button
          onClick={() => onNavigate('/billing')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 cursor-pointer transition-all hover:scale-105"
        >
          <Zap className="w-4 h-4" /> Upgrade to {planLabel} — {PLAN_PRICES[requiredPlan]}/mo
        </button>
      )}
    </div>
  );
};

interface LimitBannerProps {
  type: 'site' | 'campaign';
  current: number;
  max: number;
  onNavigate?: ((path: string) => void) | undefined;
}

export const LimitBanner: React.FC<LimitBannerProps> = ({ type, current, max, onNavigate }) => (
  <div className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
    <div className="flex items-center gap-2.5 text-sm">
      <Lock className="w-4 h-4 text-amber-400 shrink-0" />
      <span className="text-amber-300 font-semibold">
        Plan limit reached — {current}/{max} {type}s used.
      </span>
      <span className="text-slate-400 text-xs">Upgrade to add more.</span>
    </div>
    {onNavigate && (
      <button
        onClick={() => onNavigate('/billing')}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer transition shrink-0"
      >
        <Zap className="w-3 h-3" /> Upgrade
      </button>
    )}
  </div>
);

export const UpgradeChip: React.FC<{ plan: PlanId; onNavigate?: (path: string) => void }> = ({ plan, onNavigate }) => (
  <button
    onClick={() => onNavigate?.('/billing')}
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/20 hover:bg-amber-500/25 cursor-pointer transition"
  >
    <Zap className="w-2.5 h-2.5" /> {plan}+
  </button>
);

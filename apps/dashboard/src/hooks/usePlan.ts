import React from 'react';

export const ADMIN_EMAIL = 'dwain3991@gmail.com';

export type PlanId = 'free' | 'starter' | 'growth' | 'scale' | 'agency';
export const PLAN_ORDER: PlanId[] = ['free', 'starter', 'growth', 'scale', 'agency'];

export const PLAN_PRICES: Record<PlanId, string> = {
  free: '$0',
  starter: '$19',
  growth: '$49',
  scale: '$129',
  agency: '$299',
};

export interface PlanLimits {
  maxSites: number;
  maxCampaigns: number;
  maxViews: number;
  abTesting: boolean;
  advancedAnalytics: boolean;
  customWebhooks: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
  noWatermark: boolean;
  prioritySupport: boolean;
  geoTargeting: boolean;
}

const UNLIMITED: PlanLimits = {
  maxSites: Infinity,
  maxCampaigns: Infinity,
  maxViews: Infinity,
  abTesting: true,
  advancedAnalytics: true,
  customWebhooks: true,
  apiAccess: true,
  whiteLabel: true,
  noWatermark: true,
  prioritySupport: true,
  geoTargeting: true,
};

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    maxSites: 1,
    maxCampaigns: 1,
    maxViews: 1_000,
    abTesting: false,
    advancedAnalytics: false,
    customWebhooks: false,
    apiAccess: false,
    whiteLabel: false,
    noWatermark: false,
    prioritySupport: false,
    geoTargeting: false,
  },
  starter: {
    maxSites: 3,
    maxCampaigns: 5,
    maxViews: 25_000,
    abTesting: false,
    advancedAnalytics: false,
    customWebhooks: false,
    apiAccess: false,
    whiteLabel: false,
    noWatermark: true,
    prioritySupport: true,
    geoTargeting: false,
  },
  growth: {
    maxSites: 10,
    maxCampaigns: 20,
    maxViews: 150_000,
    abTesting: true,
    advancedAnalytics: true,
    customWebhooks: true,
    apiAccess: false,
    whiteLabel: false,
    noWatermark: true,
    prioritySupport: true,
    geoTargeting: true,
  },
  scale: {
    maxSites: Infinity,
    maxCampaigns: Infinity,
    maxViews: 500_000,
    abTesting: true,
    advancedAnalytics: true,
    customWebhooks: true,
    apiAccess: false,
    whiteLabel: false,
    noWatermark: true,
    prioritySupport: true,
    geoTargeting: true,
  },
  agency: {
    maxSites: Infinity,
    maxCampaigns: Infinity,
    maxViews: 2_000_000,
    abTesting: true,
    advancedAnalytics: true,
    customWebhooks: true,
    apiAccess: true,
    whiteLabel: true,
    noWatermark: true,
    prioritySupport: true,
    geoTargeting: true,
  },
};

function detectAdmin(): boolean {
  try {
    const isDesktop = typeof window !== 'undefined' && !!(window as any).electronAPI?.isDesktop;
    if (isDesktop) return true; // Desktop users are always admin locally

    const desktopUser = localStorage.getItem('desktop_user');
    if (desktopUser) {
      const u = JSON.parse(desktopUser) as { role?: string; email?: string };
      if (u.role === 'admin') return true;
      if (u.email === ADMIN_EMAIL) return true;
    }
    const profile = localStorage.getItem('_sp_profile');
    if (profile) {
      const p = JSON.parse(profile) as { email?: string };
      if (p.email === ADMIN_EMAIL) return true;
    }
  } catch {}
  return false;
}

function detectPlan(): PlanId {
  try {
    const settings = localStorage.getItem('_sp_settings');
    if (settings) {
      const s = JSON.parse(settings) as { plan?: string };
      if (s.plan && (PLAN_ORDER as string[]).includes(s.plan)) return s.plan as PlanId;
    }
  } catch {}
  return 'free';
}

export function usePlan() {
  const [plan, setPlan] = React.useState<PlanId>(detectPlan);
  const [isAdmin, setIsAdmin] = React.useState(detectAdmin);

  React.useEffect(() => {
    const onStorage = () => {
      setPlan(detectPlan());
      setIsAdmin(detectAdmin());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const limits: PlanLimits = isAdmin ? UNLIMITED : PLAN_LIMITS[plan];

  const hasFeature = (key: keyof Omit<PlanLimits, 'maxSites' | 'maxCampaigns' | 'maxViews'>): boolean =>
    isAdmin || limits[key];

  const withinLimit = (type: 'maxSites' | 'maxCampaigns', current: number): boolean =>
    isAdmin || current < limits[type];

  const planRank = (p: PlanId) => PLAN_ORDER.indexOf(p);
  const meetsMinPlan = (required: PlanId): boolean => isAdmin || planRank(plan) >= planRank(required);

  return { plan, isAdmin, limits, hasFeature, withinLimit, meetsMinPlan };
}

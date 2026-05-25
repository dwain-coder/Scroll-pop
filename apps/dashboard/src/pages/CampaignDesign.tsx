import React from 'react';
import { ArrowLeft, Save, Eye, Sparkles } from 'lucide-react';
import { useOne, useApiUrl, useCustom, useCustomMutation } from '@refinedev/core';

interface CampaignDesignProps {
  campaignId: string;
  onNavigate: (path: string) => void;
}

const DEFAULT_DESIGN = {
  kind: 'modal',
  config: {
    headline: 'Special Limited Offer! 🍿',
    subheadline: 'Get exclusive access to our premium affiliate deals.',
    bodyText: '',
    ctaText: 'Claim Your Deal Now',
    backgroundColor: '#ffffff',
    textColor: '#111111',
    accentColor: '#6366f1',
    borderRadius: 12,
    showCloseButton: true,
    animation: 'slide_up',
  },
  affiliateSlots: [],
};

const POPUP_KINDS = [
  { id: 'modal', label: 'Modal' },
  { id: 'slide_in', label: 'Slide-in' },
  { id: 'banner', label: 'Banner' },
  { id: 'amazon_card', label: 'Amazon Card' },
];

const ANIMATIONS = ['slide_up', 'slide_in_right', 'fade', 'bounce_in', 'scale'];

export const CampaignDesign: React.FC<CampaignDesignProps> = ({ campaignId, onNavigate }) => {
  const { data: campaignData, isLoading: isCampaignLoading } = useOne({
    resource: 'campaigns',
    id: campaignId,
  });

  const apiUrl = useApiUrl();
  const { data: designData, isLoading: isDesignLoading } = useCustom({
    url: `${apiUrl}/campaigns/${campaignId}/design`,
    method: 'get',
  });
  const { mutate } = useCustomMutation();

  const [design, setDesign] = React.useState<any>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saved' | 'error'>('idle');

  React.useEffect(() => {
    if (designData?.data) {
      setDesign(designData.data);
    } else if (!isDesignLoading) {
      setDesign(DEFAULT_DESIGN);
    }
  }, [designData, isDesignLoading]);

  const handleSave = () => {
    setIsSaving(true);
    setSaveStatus('idle');
    mutate(
      {
        url: `${apiUrl}/campaigns/${campaignId}/design`,
        method: 'put',
        values: design,
      },
      {
        onSuccess: () => {
          setSaveStatus('saved');
          setIsSaving(false);
          setTimeout(() => setSaveStatus('idle'), 2500);
        },
        onError: () => {
          setSaveStatus('error');
          setIsSaving(false);
        }
      }
    );
  };

  const updateConfig = (key: string, value: any) =>
    setDesign((prev: any) => ({ ...prev, config: { ...prev.config, [key]: value } }));

  const campaign = campaignData?.data;

  if (isCampaignLoading || isDesignLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-medium text-sm">Loading design editor...</p>
      </div>
    );
  }

  const cfg = design?.config ?? {};

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/campaigns')}
            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> Design Editor
            </h1>
            <p className="text-slate-400 text-sm">{campaign?.name || 'Campaign'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate(`/campaigns/detail/${campaignId}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 text-sm font-semibold transition cursor-pointer"
          >
            <Eye className="w-4 h-4" /> Analytics
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition shadow-lg cursor-pointer disabled:opacity-60 ${
              saveStatus === 'saved'
                ? 'bg-emerald-600 text-white'
                : saveStatus === 'error'
                ? 'bg-rose-600 text-white'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white'
            }`}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error — Retry' : 'Save Design'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: editor panels */}
        <div className="space-y-6">
          {/* Popup Type */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">Popup Type</h3>
            <div className="grid grid-cols-2 gap-3">
              {POPUP_KINDS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setDesign((d: any) => ({ ...d, kind: id }))}
                  className={`py-2.5 px-4 rounded-xl border text-sm font-semibold transition cursor-pointer ${
                    design?.kind === id
                      ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300'
                      : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Copy */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">Copy & Messaging</h3>
            {[
              { label: 'Headline', key: 'headline' },
              { label: 'Subheadline', key: 'subheadline' },
              { label: 'CTA Button Text', key: 'ctaText' },
            ].map(({ label, key }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{label}</label>
                <input
                  type="text"
                  value={cfg[key] ?? ''}
                  onChange={(e) => updateConfig(key, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition"
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Body Text</label>
              <textarea
                value={cfg.bodyText ?? ''}
                onChange={(e) => updateConfig('bodyText', e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition resize-none"
              />
            </div>
          </div>

          {/* Colors */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">Colors</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Background', key: 'backgroundColor' },
                { label: 'Text', key: 'textColor' },
                { label: 'Accent', key: 'accentColor' },
              ].map(({ label, key }) => (
                <div key={key} className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cfg[key] ?? '#000000'}
                      onChange={(e) => updateConfig(key, e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-700 bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-400">{cfg[key] ?? '#000000'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">Options</h3>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={cfg.showCloseButton ?? true}
                onChange={(e) => updateConfig('showCloseButton', e.target.checked)}
                className="w-4 h-4 accent-indigo-500 cursor-pointer"
              />
              <span className="text-sm text-slate-300 font-medium group-hover:text-slate-200 transition">Show close button</span>
            </label>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Animation</label>
              <select
                value={cfg.animation ?? 'slide_up'}
                onChange={(e) => updateConfig('animation', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition"
              >
                {ANIMATIONS.map((a) => (
                  <option key={a} value={a}>
                    {a.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="lg:sticky lg:top-6 space-y-4 self-start">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">Live Preview</h3>
            <div className="bg-slate-950 rounded-xl p-6 min-h-[320px] flex items-center justify-center border border-slate-800/60">
              {design?.kind === 'banner' ? (
                <div
                  className="w-full p-4 rounded-lg flex items-center justify-between gap-4"
                  style={{
                    backgroundColor: cfg.backgroundColor || '#1e1b4b',
                    color: cfg.textColor || '#e0e7ff',
                    backgroundImage: cfg.backgroundImage ? `url(${cfg.backgroundImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div>
                    <div className="font-bold text-sm">{cfg.headline || 'Headline'}</div>
                    <div className="text-xs opacity-70 mt-0.5">{cfg.subheadline}</div>
                  </div>
                  <button
                    className="px-4 py-1.5 rounded-lg text-sm font-bold shrink-0 text-white"
                    style={{ backgroundColor: cfg.accentColor || '#6366f1' }}
                  >
                    {cfg.ctaText || 'Click'}
                  </button>
                </div>
              ) : (
                <div
                  className="w-full max-w-xs rounded-2xl p-6 shadow-2xl space-y-4"
                  style={{
                    backgroundColor: cfg.backgroundColor || '#ffffff',
                    color: cfg.textColor || '#111111',
                    borderRadius: `${cfg.borderRadius || 12}px`,
                    backgroundImage: cfg.backgroundImage ? `url(${cfg.backgroundImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div>
                    <h4 className="font-extrabold text-base leading-snug">{cfg.headline || 'Headline'}</h4>
                    {cfg.subheadline && <p className="text-xs mt-1 opacity-70">{cfg.subheadline}</p>}
                  </div>
                  {cfg.bodyText && <p className="text-xs opacity-60 leading-relaxed">{cfg.bodyText}</p>}
                  <button
                    className="w-full py-2.5 rounded-xl text-white text-sm font-bold"
                    style={{ backgroundColor: cfg.accentColor || '#6366f1' }}
                  >
                    {cfg.ctaText || 'CTA Button'}
                  </button>
                  {cfg.showCloseButton && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-xs font-bold opacity-60">
                      ×
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 text-center">Actual rendering uses Shadow DOM — this is a close approximation.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

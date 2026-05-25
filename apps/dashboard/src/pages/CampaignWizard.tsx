import React from 'react';
import { ChevronRight, ChevronLeft, Check, Sparkles, Globe, Shield, ToggleLeft, Laptop, Megaphone } from 'lucide-react';
import { useList, useCreate } from '@refinedev/core';

interface CampaignWizardProps {
  onNavigate: (path: string) => void;
}

export const CampaignWizard: React.FC<CampaignWizardProps> = ({ onNavigate }) => {
  const { data: sitesData } = useList({ resource: 'sites' });
  const { mutate: createCampaign } = useCreate();
  const { mutate: createDesign } = useCreate();
  const { mutate: createTrigger } = useCreate();
  const { mutate: createTargeting } = useCreate();

  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState({
    siteId: '',
    name: '',
    kind: 'modal',
    headline: 'Special Limited Offer! 🍿',
    subheadline: 'Get 50% off our premium affiliate deal today only.',
    bodyText: 'Unlock exclusive access to state-of-the-art software at heavily discounted prices. Cancel anytime.',
    backgroundColor: '#ffffff',
    textColor: '#111111',
    accentColor: '#6366f1',
    borderRadius: 12,
    overlayEnabled: true,
    overlayOpacity: 0.5,
    ctaText: 'Claim Your Deal Now',
    ctaStyle: 'button',
    showCloseButton: true,
    closeButtonPosition: 'top-right',
    showDismissText: false,
    dismissText: 'No thanks, I prefer paying full price',
    animation: 'slide_up',
    showPoweredBy: true,
    // Trigger
    triggerType: 'scroll_pct',
    triggerParams: { pct: 50, seconds: 30, sensitivity: 20, selector: '#my-button' },
    // Targeting
    device: 'all',
    urlPattern: '',
    frequency: 'once_per_session',
    // Affiliate creative
    productName: 'Premium Membership',
    productUrl: 'https://affiliate.link',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
  });

  const templates = [
    { id: 'modal', name: 'High-Converting Modal', desc: 'Centered overlay box with high visual capture.', kind: 'modal', colors: { bg: '#ffffff', text: '#111111', accent: '#6366f1' } },
    { id: 'slide_in', name: 'Slide-In Creative', desc: 'Bottom-right slide-in that allows reading host content.', kind: 'slide_in', colors: { bg: '#0f172a', text: '#f8fafc', accent: '#f43f5e' } },
    { id: 'banner', name: 'Ambient Banner Bar', desc: 'Top full-width stripe ideal for quick notices.', kind: 'banner', colors: { bg: '#1e1b4b', text: '#e0e7ff', accent: '#a5b4fc' } },
    { 
      id: 'amazon_card', 
      name: 'Amazon Affiliate Card', 
      desc: 'Clean Amazon product details card with live orange buy CTA.', 
      kind: 'slide_in', 
      colors: { bg: '#ffffff', text: '#0f1111', accent: '#ff9900' },
      customFields: {
        headline: 'Recommended for You on Amazon 📦',
        subheadline: 'Best Seller • 4.8 ★★★★☆ (2,410 reviews)',
        bodyText: 'Limited time Deal: Save 20% on this highly-rated item. Shipped and sold by Amazon.com.',
        ctaText: 'Shop Deal on Amazon',
        productName: 'Amazon Echo Dot (5th Gen)',
        productUrl: 'https://www.amazon.com/dp/B09B8V1LZ3',
        imageUrl: 'https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=400&q=80',
        borderRadius: 8,
      }
    },
    { 
      id: 'rakuten_card', 
      name: 'Rakuten Cash Back Bar', 
      desc: 'Premium Rakuten affiliate ribbon with double cash back alert.', 
      kind: 'banner', 
      colors: { bg: '#7a1954', text: '#ffffff', accent: '#e6005c' },
      customFields: {
        headline: 'Earn Double Cash Back at Rakuten! 🛍️',
        subheadline: 'Up to 15% Cash Back at 3,500+ stores.',
        bodyText: 'Join millions of members earning cash back today. Free $10 welcome bonus when you spend $25.',
        ctaText: 'Activate Cash Back Now',
        productName: 'Rakuten Cash Back Activation',
        productUrl: 'https://www.rakuten.com/r/YOUR_REF',
        imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=400&q=80',
        borderRadius: 0,
      }
    },
  ];

  const handleTemplateSelect = (tmpl: any) => {
    setFormData({
      ...formData,
      kind: tmpl.kind,
      backgroundColor: tmpl.colors.bg,
      textColor: tmpl.colors.text,
      accentColor: tmpl.colors.accent,
      ...(tmpl.customFields || {}),
    });
    setStep(3);
  };

  const handleLaunch = async () => {
    if (!formData.siteId || !formData.name) {
      alert('Please fill out the Campaign Name and Site selection.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Campaign
      createCampaign({
        resource: 'campaigns',
        values: {
          siteId: formData.siteId,
          name: formData.name,
        },
      }, {
        onSuccess: (campaignRes: any) => {
          const campaignId = campaignRes.data.id;
          const tenantId = campaignRes.data.tenantId;

          // 2. Create Design (with affiliate slots)
          createDesign({
            resource: `campaigns/${campaignId}/design`,
            values: {
              kind: formData.kind,
              config: {
                kind: formData.kind,
                position: formData.kind === 'modal' ? 'center' : formData.kind === 'slide_in' ? 'bottom-right' : 'top',
                size: 'md',
                backgroundColor: formData.backgroundColor,
                textColor: formData.textColor,
                accentColor: formData.accentColor,
                borderRadius: formData.borderRadius,
                overlayEnabled: formData.overlayEnabled,
                overlayOpacity: formData.overlayOpacity,
                headline: formData.headline,
                subheadline: formData.subheadline,
                bodyText: formData.bodyText,
                ctaText: formData.ctaText,
                ctaStyle: formData.ctaStyle,
                showCloseButton: formData.showCloseButton,
                closeButtonPosition: formData.closeButtonPosition,
                showDismissText: formData.showDismissText,
                dismissText: formData.dismissText,
                animation: formData.animation,
                showPoweredBy: formData.showPoweredBy,
              },
              affiliate_slots: [{
                id: crypto.randomUUID(),
                product_name: formData.productName,
                product_url: formData.productUrl,
                image_url: formData.imageUrl,
                click_tracker_url: formData.productUrl,
                cta_text: formData.ctaText,
                weight: 100,
              }],
            },
          }, {
            onSuccess: () => {
              // 3. Create Trigger
              createTrigger({
                resource: `campaigns/${campaignId}/triggers`,
                values: {
                  type: formData.triggerType,
                  params: formData.triggerType === 'scroll_pct' 
                    ? { pct: formData.triggerParams.pct } 
                    : formData.triggerType === 'dwell_time' 
                    ? { seconds: formData.triggerParams.seconds } 
                    : { seconds: formData.triggerParams.seconds },
                },
              }, {
                onSuccess: () => {
                  // 4. Create Targeting Rules
                  createTargeting({
                    resource: `campaigns/${campaignId}/targeting`,
                    values: {
                      kind: 'device',
                      operator: 'include',
                      value: { device: formData.device },
                    },
                  }, {
                    onSuccess: () => {
                      setLoading(false);
                      onNavigate('/campaigns');
                    },
                  });
                },
              });
            },
          });
        },
      });
    } catch (err) {
      console.error(err);
      alert('An error occurred during campaign setup.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Wizard Steps indicator */}
      <div className="flex items-center justify-between max-w-2xl mx-auto border-b border-slate-900 pb-4">
        {[
          { num: 1, label: 'Metadata' },
          { num: 2, label: 'Template' },
          { num: 3, label: 'Design' },
          { num: 4, label: 'Trigger' },
          { num: 5, label: 'Targeting' },
          { num: 6, label: 'Launch' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
              step === s.num
                ? 'bg-indigo-600 border-indigo-600 text-white shadow shadow-indigo-500/20'
                : step > s.num
                ? 'bg-indigo-500/20 border-indigo-500/20 text-indigo-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}>
              {step > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span className={`text-xs font-semibold hidden sm:inline ${step === s.num ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Step Configurations */}
        <div className="lg:col-span-7 space-y-6">
          {step === 1 && (
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="space-y-1">
                <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-indigo-400" /> Campaign Details
                </h3>
                <p className="text-slate-400 text-sm">Specify a internal reference name and select which domain delivers the campaign.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Campaign Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q2 Software Promo Pop"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Website</label>
                  <select
                    required
                    value={formData.siteId}
                    onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
                  >
                    <option value="">Select a registered site...</option>
                    {sitesData?.data?.map((site: any) => (
                      <option key={site.id} value={site.id}>{site.name} ({site.domain})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="space-y-1">
                <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" /> Choose Starter Layout
                </h3>
                <p className="text-slate-400 text-sm">Select an layout skeleton. Styling can be fully modified in the next step.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {templates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => handleTemplateSelect(tmpl)}
                    className="glass-card glass-card-hover rounded-xl p-5 flex items-center justify-between cursor-pointer border border-slate-800 hover:border-indigo-500/50"
                  >
                    <div className="space-y-1">
                      <span className="font-bold text-slate-200 block">{tmpl.name}</span>
                      <p className="text-xs text-slate-400">{tmpl.desc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="space-y-1">
                <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" /> Styling & Creative Contents
                </h3>
                <p className="text-slate-400 text-sm">Edit the visual copy, background colors, and affiliate creative slot.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Background Color</label>
                    <input
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 h-11 cursor-pointer transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Text Color</label>
                    <input
                      type="color"
                      value={formData.textColor}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 h-11 cursor-pointer transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Accent Color</label>
                  <input
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 h-11 cursor-pointer transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Headline Copy</label>
                  <input
                    type="text"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CTA Button Text</label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
                  />
                </div>

                <div className="border-t border-slate-800/80 pt-4 space-y-4">
                  <h4 className="font-bold text-sm text-indigo-400">Affiliate Product Details</h4>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Product Name</label>
                    <input
                      type="text"
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Destination URL</label>
                    <input
                      type="text"
                      value={formData.productUrl}
                      onChange={(e) => setFormData({ ...formData, productUrl: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="space-y-1">
                <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-400" /> Trigger Rules
                </h3>
                <p className="text-slate-400 text-sm">Determine what events trigger the popup. Back-button hijacking is strictly prohibited.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  {[
                    { id: 'scroll_pct', title: 'Scroll Depth Trigger', desc: 'Fires when visitor scrolls past N% of the page.' },
                    { id: 'dwell_time', title: 'Time on Page Trigger', desc: 'Fires after N seconds of browsing.' },
                    { id: 'inactivity', title: 'Inactivity Trigger', desc: 'Fires if visitor does not move or scroll for N seconds.' },
                  ].map((trigger) => (
                    <label
                      key={trigger.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border transition cursor-pointer ${
                        formData.triggerType === trigger.id
                          ? 'bg-indigo-500/10 border-indigo-500 text-slate-200'
                          : 'bg-slate-950 border-slate-850 hover:bg-slate-900/60 text-slate-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="triggerType"
                        checked={formData.triggerType === trigger.id}
                        onChange={() => setFormData({ ...formData, triggerType: trigger.id })}
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <span className="font-bold block text-sm">{trigger.title}</span>
                        <p className="text-xs leading-relaxed">{trigger.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {formData.triggerType === 'scroll_pct' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scroll Percentage (1 - 100%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.triggerParams.pct}
                      onChange={(e) => setFormData({
                        ...formData,
                        triggerParams: { ...formData.triggerParams, pct: parseInt(e.target.value) || 50 },
                      })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
                    />
                  </div>
                )}

                {formData.triggerType !== 'scroll_pct' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Threshold Time (Seconds)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.triggerParams.seconds}
                      onChange={(e) => setFormData({
                        ...formData,
                        triggerParams: { ...formData.triggerParams, seconds: parseInt(e.target.value) || 30 },
                      })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="space-y-1">
                <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" /> Targeting & Frequency Caps
                </h3>
                <p className="text-slate-400 text-sm">Control device target constraints and display limits.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Devices</label>
                  <select
                    value={formData.device}
                    onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
                  >
                    <option value="all">Deliver on All Devices</option>
                    <option value="mobile">Deliver on Mobile Devices Only</option>
                    <option value="desktop">Deliver on Desktop Devices Only</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Frequency Capping</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
                  >
                    <option value="once_per_session">Enforce: Once Per Browser Session</option>
                    <option value="once_per_day">Enforce: Once Per Day (24 hours)</option>
                    <option value="once_per_visitor">Enforce: Once Per Unique Visitor</option>
                    <option value="always">Always Display (No cap - Dev testing)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="space-y-1.5 text-center py-6">
                <span className="text-5xl block mb-2">🚀</span>
                <h3 className="font-extrabold text-xl text-slate-100">Ready to Launch!</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  Click Launch below to persist your styling details, and register rules onto the edge queue.
                </p>
              </div>

              <div className="divide-y divide-slate-800/60 text-sm">
                <div className="flex justify-between py-3">
                  <span className="text-slate-400">Campaign Name</span>
                  <span className="font-semibold text-slate-200">{formData.name}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-slate-400">Creative Layout</span>
                  <span className="font-semibold text-slate-200 capitalize">{formData.kind.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-slate-400">Trigger Rule</span>
                  <span className="font-semibold text-slate-200">
                    {formData.triggerType === 'scroll_pct' 
                      ? `Scroll past ${formData.triggerParams.pct}%` 
                      : `${formData.triggerParams.seconds}s on page`}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-slate-400">Frequency Cap</span>
                  <span className="font-semibold text-slate-200 capitalize">{formData.frequency.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Stepper buttons */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : onNavigate('/campaigns')}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold text-sm transition cursor-pointer"
            >
              <ChevronLeft className="w-4.5 h-4.5" /> Back
            </button>

            {step < 6 ? (
              <button
                onClick={() => {
                  if (step === 1 && (!formData.siteId || !formData.name)) {
                    alert('Please specify a campaign name and select a site.');
                    return;
                  }
                  setStep(step + 1);
                }}
                className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow shadow-indigo-500/20 cursor-pointer"
              >
                Next <ChevronRight className="w-4.5 h-4.5" />
              </button>
            ) : (
              <button
                onClick={handleLaunch}
                disabled={loading}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Creating...' : 'Launch Campaign 🚀'}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Live Premium Interactive Visual Preview */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Live Responsive Mock Preview</span>
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Mock browser header */}
            <div className="bg-slate-950 border-b border-slate-900 px-4 py-3.5 flex items-center justify-between">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              </div>
              <div className="bg-slate-900/60 px-3 py-1 rounded-md text-[10px] text-slate-500 font-mono flex items-center gap-1">
                <Laptop className="w-3.5 h-3.5" /> preview_host.com
              </div>
              <div className="w-12"></div>
            </div>

            {/* Mock website viewport */}
            <div className="p-6 h-[400px] bg-slate-950 relative overflow-hidden flex flex-col justify-between">
              {/* Dummy page content mock */}
              <div className="space-y-3 opacity-15 pointer-events-none">
                <div className="h-6 w-1/3 bg-slate-400 rounded-md"></div>
                <div className="h-4 w-5/6 bg-slate-500 rounded-md"></div>
                <div className="h-4 w-4/6 bg-slate-500 rounded-md"></div>
                <div className="h-32 w-full bg-slate-800 rounded-md"></div>
              </div>

              {/* Dynamic Mockup Overlay based on config */}
              {formData.overlayEnabled && formData.kind === 'modal' && (
                <div 
                  className="absolute inset-0 z-40 flex items-center justify-center transition-all duration-300"
                  style={{ backgroundColor: `rgba(0, 0, 0, ${formData.overlayOpacity})` }}
                ></div>
              )}

              {/* Dynamic Popup Preview Container */}
              <div 
                className={`z-50 transition-all duration-300 ${
                  formData.kind === 'modal'
                    ? 'absolute inset-0 flex items-center justify-center p-4'
                    : formData.kind === 'slide_in'
                    ? 'absolute bottom-4 right-4 max-w-[280px] w-full'
                    : 'absolute top-0 left-0 right-0 w-full'
                }`}
              >
                <div
                  className="shadow-2xl overflow-hidden w-full transition-all duration-300"
                  style={{
                    backgroundColor: formData.backgroundColor,
                    color: formData.textColor,
                    borderRadius: formData.kind === 'banner' ? '0' : `${formData.borderRadius}px`,
                    maxWidth: formData.kind === 'modal' ? '300px' : 'none',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="p-5 space-y-4 relative">
                    {formData.showCloseButton && (
                      <span className="absolute top-3 right-3 text-xs opacity-40 cursor-pointer">✕</span>
                    )}

                    <h5 className="font-bold text-sm leading-snug" style={{ color: formData.textColor }}>
                      {formData.headline}
                    </h5>

                    {formData.kind !== 'banner' && (
                      <>
                        <p className="text-[11px] opacity-75 leading-relaxed">
                          {formData.subheadline}
                        </p>
                        {formData.imageUrl && (
                          <img 
                            src={formData.imageUrl} 
                            alt="Preview creative" 
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        )}
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          className="block text-center text-xs font-bold py-2.5 rounded-lg text-white shadow-sm transition-all hover:opacity-90"
                          style={{ backgroundColor: formData.accentColor }}
                        >
                          {formData.ctaText}
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

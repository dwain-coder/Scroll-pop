import { useState } from 'react';
import { Clipboard, Check, RefreshCw, Smartphone, Laptop, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DASHBOARD_URL = 'https://dashboard.scrollpop.online';

// Real ScrollPop popup templates (matching the actual app categories)
const TEMPLATES = [
  {
    id: 'welcome',
    label: 'Welcome Offer',
    tag: '🎁 FIRST ORDER',
    title: 'Welcome! Get 10% Off',
    body: 'Sign up and we\'ll send your exclusive coupon instantly. No spam, unsubscribe any time.',
    cta: 'Claim My 10% Off',
    bg: '#ffffff',
    accent: '#6366f1',
    text: '#111827',
    radius: 24,
    position: 'center' as const,
    trigger: 'Scroll 30%',
  },
  {
    id: 'exit',
    label: 'Exit Intent',
    tag: '⏳ LAST CHANCE',
    title: 'Wait — 20% off just for you',
    body: 'We don\'t do this often. This offer expires when you close the window.',
    cta: 'Claim 20% Off Now',
    bg: '#0f172a',
    accent: '#f59e0b',
    text: '#ffffff',
    radius: 16,
    position: 'center' as const,
    trigger: 'Exit intent',
  },
  {
    id: 'email',
    label: 'Email Capture',
    tag: '📧 FREE COURSE',
    title: 'Double Your Conversion Rate',
    body: 'Join 12,000+ marketers. Get instant access to the free 5-day email course.',
    cta: 'Send Me The Course',
    bg: '#eff6ff',
    accent: '#2563eb',
    text: '#1e3a5f',
    radius: 16,
    position: 'center' as const,
    trigger: 'Dwell 10s',
  },
  {
    id: 'coupon',
    label: 'Flash Sale',
    tag: '⚡ FLASH SALE',
    title: '40% Off Everything',
    body: 'Ends tonight at midnight. Use code FLASH40 at checkout.',
    cta: 'Shop The Flash Sale',
    bg: '#7f1d1d',
    accent: '#fbbf24',
    text: '#ffffff',
    radius: 16,
    position: 'center' as const,
    trigger: 'Scroll 50%',
  },
];

const INSTALL_SNIPPETS = {
  html: `<!-- ScrollPop — paste inside <head> -->
<script>
(function(w,d,s,p){
  p=w.__sp=w.__sp||{};
  if(p.loaded)return; p.loaded=true;
  var el=d.createElement(s); el.async=true; el.defer=true;
  el.src='https://cdn.scrollpop.online/v1/YOUR_PUBLIC_KEY/p.js';
  d.head.appendChild(el);
})(window,document,'script');
</script>`,
  shopify: `{%- comment -%} ScrollPop — App Embed Block {%- endcomment -%}
{% if block.settings.public_key != blank %}
<script>
(function(w,d,s,p){
  p=w.__sp=w.__sp||{};
  if(p.loaded)return; p.loaded=true;
  var el=d.createElement(s); el.async=true; el.defer=true;
  el.src='https://cdn.scrollpop.online/v1/{{ block.settings.public_key }}/p.js';
  d.head.appendChild(el);
})(window,document,'script');
</script>
{% endif %}`,
  wordpress: `<?php
// ScrollPop WordPress Plugin
// Add to your theme's functions.php, or use the ScrollPop plugin
function scrollpop_inject() {
  $key = get_option('scrollpop_public_key');
  if (!$key) return;
  echo "<script async defer src='https://cdn.scrollpop.online/v1/{$key}/p.js'></script>";
}
add_action('wp_head', 'scrollpop_inject');`,
};

export default function ScrollPopDemo() {
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [activeTab, setActiveTab] = useState<'preview' | 'install'>('preview');
  const [installPlatform, setInstallPlatform] = useState<'html' | 'shopify' | 'wordpress'>('html');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(true);

  const tpl = TEMPLATES[activeTemplate];

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const replayPopup = () => {
    setVisible(false);
    setTimeout(() => setVisible(true), 300);
  };

  return (
    <div className="w-full bg-white border border-[#E9E4D9] rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">

      {/* LEFT: Template picker + controls */}
      <div className="lg:col-span-5 border-r border-[#E9E4D9] p-8 flex flex-col gap-6 bg-[#FAF9F5]">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#C05621] uppercase block mb-1">LIVE DEMO</span>
          <h3 className="font-serif text-2xl font-bold text-[#1A1A1A]">See it in action</h3>
          <p className="text-zinc-500 text-sm mt-1">
            Real popup templates from the ScrollPop library. Build these in minutes with the visual editor.
          </p>
        </div>

        {/* Template selector */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Campaign type</label>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((t, i) => (
              <button
                key={t.id}
                onClick={() => { setActiveTemplate(i); replayPopup(); }}
                className={`text-left p-3 border rounded-lg transition-all cursor-pointer ${
                  activeTemplate === i
                    ? 'border-[#C05621] ring-1 ring-[#C05621] bg-white'
                    : 'border-[#E9E4D9] bg-white hover:border-neutral-400'
                }`}
              >
                <span className="text-xs font-semibold text-[#1A1A1A] block">{t.label}</span>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="h-3 w-3 rounded-sm border border-zinc-200" style={{ backgroundColor: t.bg }} />
                  <span className="h-3 w-3 rounded-sm border border-zinc-200" style={{ backgroundColor: t.accent }} />
                  <span className="text-[10px] text-zinc-400 font-mono">{t.trigger}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Preview vs Install */}
        <div className="flex gap-1 border border-[#E9E4D9] rounded-lg p-1 bg-white">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider rounded-md transition-all cursor-pointer ${
              activeTab === 'preview' ? 'bg-[#1A1A1A] text-white' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('install')}
            className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider rounded-md transition-all cursor-pointer ${
              activeTab === 'install' ? 'bg-[#1A1A1A] text-white' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Install snippet
          </button>
        </div>

        {activeTab === 'preview' ? (
          <>
            {/* Device toggle */}
            <div className="flex items-center gap-2">
              <button onClick={() => setDeviceMode('desktop')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-md cursor-pointer transition-all ${deviceMode === 'desktop' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-[#E9E4D9] text-neutral-500 hover:bg-neutral-50'}`}>
                <Laptop className="h-3 w-3" /> Desktop
              </button>
              <button onClick={() => setDeviceMode('mobile')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-md cursor-pointer transition-all ${deviceMode === 'mobile' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-[#E9E4D9] text-neutral-500 hover:bg-neutral-50'}`}>
                <Smartphone className="h-3 w-3" /> Mobile
              </button>
            </div>

            {/* Replay button */}
            <button
              onClick={replayPopup}
              className="flex items-center justify-center gap-2 h-10 border border-neutral-300 rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-neutral-50 transition-all cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Replay popup
            </button>

            {/* CTA */}
            <div className="mt-auto pt-4 border-t border-[#E9E4D9]">
              <p className="text-xs text-neutral-500 mb-3">Build this in the visual editor — free to start.</p>
              <a
                href={`${DASHBOARD_URL}/sign-up`}
                className="w-full h-10 bg-[#1A1A1A] text-white rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all"
              >
                Start Building Free <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </>
        ) : (
          <>
            {/* Install platform picker */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Your platform</label>
              <div className="grid grid-cols-3 gap-2">
                {(['html', 'shopify', 'wordpress'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setInstallPlatform(p)}
                    className={`py-2 px-3 text-xs font-mono uppercase border rounded-md cursor-pointer transition-all ${
                      installPlatform === p ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'border-[#E9E4D9] text-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    {p === 'html' ? 'HTML' : p === 'shopify' ? 'Shopify' : 'WordPress'}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                {installPlatform === 'html' && 'Paste once in your <head>. Works on any CMS.'}
                {installPlatform === 'shopify' && 'Use the App Embed Block in Theme Customizer — no code editing.'}
                {installPlatform === 'wordpress' && 'Or just install the ScrollPop plugin from your dashboard.'}
              </p>
            </div>

            <div className="mt-auto pt-4 border-t border-[#E9E4D9]">
              <a
                href={`${DASHBOARD_URL}/sign-up`}
                className="w-full h-10 bg-[#1A1A1A] text-white rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all"
              >
                Get Your Public Key Free <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </>
        )}
      </div>

      {/* RIGHT: Live popup preview or install snippet */}
      <div className="lg:col-span-7 bg-[#111111] flex flex-col min-h-[520px] relative overflow-hidden">

        {activeTab === 'preview' ? (
          /* Popup preview */
          <div className={`flex-1 flex items-center justify-center p-8 ${deviceMode === 'mobile' ? 'p-4' : ''}`}>
            {/* Fake page background */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-8 bg-white/20 mb-3" />
              <div className="mx-8 space-y-2">
                {[80, 60, 90, 50, 70].map((w, i) => (
                  <div key={i} className="h-2 bg-white/20 rounded" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* The popup */}
            <AnimatePresence>
              {visible && (
                <motion.div
                  key={tpl.id}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10 shadow-2xl overflow-hidden"
                  style={{
                    backgroundColor: tpl.bg,
                    borderRadius: `${tpl.radius}px`,
                    width: deviceMode === 'mobile' ? '280px' : '380px',
                    maxWidth: '100%',
                  }}
                >
                  {/* Close button */}
                  <button
                    onClick={() => setVisible(false)}
                    className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all"
                    style={{ background: `${tpl.text}15`, color: tpl.text }}
                  >
                    ✕
                  </button>

                  <div className="p-6">
                    {/* Tag */}
                    <div
                      className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-3"
                      style={{ background: `${tpl.accent}20`, color: tpl.accent }}
                    >
                      {tpl.tag}
                    </div>

                    {/* Title */}
                    <h3
                      className="text-lg font-bold leading-tight mb-2"
                      style={{ color: tpl.text, fontFamily: 'serif' }}
                    >
                      {tpl.title}
                    </h3>

                    {/* Body */}
                    <p
                      className="text-xs leading-relaxed mb-4 opacity-75"
                      style={{ color: tpl.text }}
                    >
                      {tpl.body}
                    </p>

                    {/* Email input */}
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="w-full text-xs px-3 py-2 border rounded-lg mb-3 outline-none"
                      style={{
                        borderColor: `${tpl.accent}40`,
                        borderRadius: `${Math.min(tpl.radius / 2, 8)}px`,
                        backgroundColor: `${tpl.text}08`,
                        color: tpl.text,
                      }}
                    />

                    {/* CTA */}
                    <button
                      className="w-full py-2.5 text-xs font-bold text-white transition-all"
                      style={{
                        backgroundColor: tpl.accent,
                        borderRadius: `${Math.min(tpl.radius / 2, 8)}px`,
                      }}
                    >
                      {tpl.cta}
                    </button>

                    {/* Dismiss */}
                    <p
                      className="text-center text-[10px] mt-3 opacity-40 cursor-pointer hover:opacity-70"
                      style={{ color: tpl.text }}
                      onClick={() => setVisible(false)}
                    >
                      No thanks
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!visible && (
              <button
                onClick={replayPopup}
                className="relative z-10 text-white/50 text-xs font-mono flex items-center gap-2 hover:text-white transition-all cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Click to replay
              </button>
            )}
          </div>
        ) : (
          /* Install snippet */
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                {installPlatform === 'html' ? 'HTML / Any CMS' : installPlatform === 'shopify' ? 'Shopify App Embed Liquid' : 'WordPress functions.php'}
              </span>
              <button
                onClick={() => copyCode(INSTALL_SNIPPETS[installPlatform])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-[10px] font-mono text-neutral-300 transition-all cursor-pointer"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Clipboard className="h-3 w-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="flex-1 p-5 text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed whitespace-pre-wrap">
              {INSTALL_SNIPPETS[installPlatform]}
            </pre>
            <div className="px-5 py-4 border-t border-neutral-800 text-[11px] text-neutral-500 font-mono">
              Replace <span className="text-[#C05621]">YOUR_PUBLIC_KEY</span> with the key from your dashboard → Sites → your site.
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="px-5 py-3 border-t border-neutral-800 flex items-center justify-between">
          <div className="flex gap-1">
            {TEMPLATES.map((t, i) => (
              <button
                key={t.id}
                onClick={() => { setActiveTemplate(i); replayPopup(); }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${activeTemplate === i ? 'w-6 bg-[#C05621]' : 'w-1.5 bg-neutral-600 hover:bg-neutral-400'}`}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-wider">
            {TEMPLATES[activeTemplate].label} · {TEMPLATES[activeTemplate].trigger}
          </span>
        </div>
      </div>
    </div>
  );
}

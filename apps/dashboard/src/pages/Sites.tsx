import React from 'react';
import { Plus, Globe, CheckCircle2, AlertCircle, Copy, Check, Trash2, Edit, Lock } from 'lucide-react';
import { useList, useCreate, useDelete, useUpdate } from '@refinedev/core';
import { usePlan } from '../hooks/usePlan';
import { LimitBanner } from '../components/PlanGate';

export const Sites: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const { data: sitesData, refetch } = useList({ resource: 'sites' });
  const { mutate: createSite } = useCreate();
  const { mutate: deleteSite } = useDelete();
  const { mutate: updateSite } = useUpdate();
  const { withinLimit, limits, isAdmin } = usePlan();

  const siteCount = sitesData?.data?.length ?? 0;
  const atSiteLimit = !isAdmin && siteCount >= limits.maxSites;

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [newSite, setNewSite] = React.useState({ name: '', domain: '', platform: 'html' });
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [selectedSnippet, setSelectedSnippet] = React.useState<any | null>(null);
  const [embedMode, setEmbedMode] = React.useState<'cdn' | 'dev'>('cdn');
  const [devUrl, setDevUrl] = React.useState('https://whole-ends-divide.loca.lt');
  
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editSite, setEditSite] = React.useState({ id: '', name: '', platform: 'html' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createSite({
      resource: 'sites',
      values: newSite,
      successNotification: () => ({
        message: 'Site registered successfully!',
        type: 'success',
      }),
    }, {
      onSuccess: (data: any) => {
        setIsAddOpen(false);
        setNewSite({ name: '', domain: '', platform: 'html' });
        refetch();
        setSelectedSnippet(data.data);
      },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this site? All associated campaigns will be archived.')) {
      deleteSite({
        resource: 'sites',
        id,
      }, {
        onSuccess: () => refetch(),
      });
    }
  };

  const [verifyingId, setVerifyingId] = React.useState<string | null>(null);

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    const isDesktop = !!(window as any).electronAPI?.isDesktop;

    if (isDesktop) {
      try {
        const token = localStorage.getItem('desktop_token');
        const apiBase = (window as any).electronAPI.getLocalApiUrl();
        const res = await fetch(`${apiBase}/api/v1/sites/${id}/verify`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) refetch();
        else alert('Verification failed. Please restart the app if the issue persists.');
      } catch {
        alert('Cannot reach local server. Please restart the app.');
      } finally {
        setVerifyingId(null);
      }
    } else {
      // Demo / web mode: patch verifiedAt directly through the data provider
      updateSite({
        resource: 'sites',
        id,
        values: { verifiedAt: new Date().toISOString() },
      }, {
        onSuccess: () => { refetch(); setVerifyingId(null); },
        onError: () => { setVerifyingId(null); alert('Verification request failed.'); },
      });
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getSnippetHTML = (publicKey: string, mode: 'cdn' | 'dev', tunnelUrl: string) => {
    if (mode === 'cdn') {
      return `<!-- ScrollPop Embed Stub -->
<script>
(function(w,d,s){
  var p=w.__sp=w.__sp||{q:[],identify:function(v){p.q.push(['identify',v])},loaded:false};
  if(p.loaded)return; p.loaded=true;
  var el=d.createElement(s); el.async=true; el.defer=true;
  el.src='https://cdn.scrollpop.io/v1/${publicKey}/p.js';
  d.head.appendChild(el);
})(window,document,'script');
</script>
<!-- End ScrollPop Embed -->`;
    } else {
      const cleanUrl = (tunnelUrl || '').replace(/\/$/, '');
      return `<!-- ScrollPop Embed Stub (Local Dev Tunnel Mode) -->
<script>
(function(w,d,s){
  w.__SP_EDGE_URL = '${cleanUrl}';
  var p=w.__sp=w.__sp||{q:[],identify:function(v){p.q.push(['identify',v])},loaded:false};
  if(p.loaded)return; p.loaded=true;
  var el=d.createElement(s); el.async=true; el.defer=true;
  el.src='${cleanUrl}/v1/${publicKey}/p.js';
  d.head.appendChild(el);
})(window,document,'script');
</script>
<!-- End ScrollPop Embed -->`;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Registered Sites</h1>
          <p className="text-slate-400 text-sm">Add and verify your domains to deliver popups on them.</p>
        </div>
        <button
          onClick={() => {
            if (atSiteLimit) { onNavigate?.('/billing'); return; }
            setSelectedSnippet(null);
            setIsAddOpen(true);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            atSiteLimit
              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 cursor-pointer'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/20 cursor-pointer'
          }`}
        >
          {atSiteLimit ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {atSiteLimit ? `Limit Reached (${siteCount}/${limits.maxSites})` : 'Add New Site'}
        </button>
      </div>

      {atSiteLimit && (
        <LimitBanner type="site" current={siteCount} max={limits.maxSites} onNavigate={onNavigate} />
      )}

      {/* Snippet modal helper after add */}
      {selectedSnippet && (
        <div className="glass-card rounded-2xl p-6 border-l-4 border-indigo-500 glow-indigo space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
              🚀 Copy Snippet for {selectedSnippet.name}
            </h3>
            <button
              onClick={() => setSelectedSnippet(null)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Installer Environment</label>
            <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800 max-w-sm">
              <button
                type="button"
                onClick={() => setEmbedMode('cdn')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex-1 ${
                  embedMode === 'cdn'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Production CDN
              </button>
              <button
                type="button"
                onClick={() => setEmbedMode('dev')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex-1 ${
                  embedMode === 'dev'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Local Dev / Tunnel
              </button>
            </div>
          </div>

          {embedMode === 'dev' && (
            <div className="flex flex-col gap-2 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 space-y-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Dev / Tunnel URL</label>
                <input
                  type="text"
                  placeholder="e.g. https://whole-ends-divide.loca.lt"
                  value={devUrl}
                  onChange={(e) => setDevUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none transition font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                👉 Paste your active localtunnel HTTPS URL (e.g. <code>https://whole-ends-divide.loca.lt</code>) or local dev host (e.g. <code>http://localhost:3001</code>). The embed code will update dynamically!
              </p>
            </div>
          )}

          <p className="text-slate-400 text-sm">
            Paste this optimized async inline loader inside the {"<head>"} tag of your host site HTML.
          </p>
          
          <div className="relative">
            <pre className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-[13px] font-mono text-indigo-300 overflow-x-auto select-all max-h-56 leading-relaxed">
              {getSnippetHTML(selectedSnippet.publicKey, embedMode, devUrl)}
            </pre>
            <button
              onClick={() => copyToClipboard(getSnippetHTML(selectedSnippet.publicKey, embedMode, devUrl), 'snippet')}
              className="absolute top-3 right-3 p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition cursor-pointer"
            >
              {copiedKey === 'snippet' ? <Check className="w-4.5 h-4.5 text-emerald-400" /> : <Copy className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Sites Listing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sitesData?.data && sitesData.data.length > 0 ? (
          sitesData.data.map((site: any) => (
            <div key={site.id} className="glass-card rounded-2xl p-6 flex flex-col justify-between gap-6 relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400">
                    <Globe className="w-5.5 h-5.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-200">{site.name}</h4>
                    <span className="text-xs text-slate-400 font-mono block">{site.domain}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium capitalize">
                    {site.platform}
                  </span>
                  
                  {site.verifiedAt ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4.5 h-4.5" /> Verified
                    </span>
                  ) : (
                    <button
                      onClick={() => handleVerify(site.id)}
                      disabled={verifyingId === site.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold cursor-pointer transition select-none disabled:opacity-50 text-xs"
                      title="Click to verify this domain locally"
                    >
                      <AlertCircle className="w-4 h-4" /> 
                      {verifyingId === site.id ? 'Verifying...' : 'Verify Domain'}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
                <button
                  onClick={() => setSelectedSnippet(site)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                >
                  Get Embed Code
                </button>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditSite({ id: site.id, name: site.name, platform: site.platform });
                      setIsEditOpen(true);
                    }}
                    className="p-2 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition cursor-pointer"
                    title="Edit Site Details"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(site.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                    title="Remove Site"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full glass-card rounded-2xl py-16 flex flex-col items-center justify-center gap-4 text-center">
            <span className="text-4xl">🌐</span>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-200">No Sites Registered</h3>
              <p className="text-slate-400 text-sm max-w-sm">Register your WordPress or custom HTML domains to publish popup campaigns.</p>
            </div>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow transition cursor-pointer"
            >
              Register First Site
            </button>
          </div>
        )}
      </div>

      {/* Add Site Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-50 px-4">
          <div className="glass-card rounded-2xl max-w-md w-full p-6 space-y-6 glow-indigo relative z-10">
            <div className="space-y-1">
              <h3 className="font-extrabold text-xl text-slate-100">Register New Site</h3>
              <p className="text-slate-400 text-sm">Add a website domain to unlock snippets and campaign target rules.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Site Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Affiliate Blog"
                  value={newSite.name}
                  onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Domain Url</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. mydomain.com"
                  value={newSite.domain}
                  onChange={(e) => setNewSite({ ...newSite, domain: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Platform</label>
                <select
                  value={newSite.platform}
                  onChange={(e) => setNewSite({ ...newSite, platform: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
                >
                  <option value="html">Custom HTML / JS</option>
                  <option value="wordpress">WordPress</option>
                  <option value="shopify">Shopify</option>
                  <option value="donorbox">Donorbox</option>
                  <option value="gofundme">GoFundMe</option>
                  <option value="other">Other CMS</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4.5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition shadow-lg cursor-pointer"
                >
                  Register Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Site Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-50 px-4">
          <div className="glass-card rounded-2xl max-w-md w-full p-6 space-y-6 glow-indigo relative z-10">
            <div className="space-y-1">
              <h3 className="font-extrabold text-xl text-slate-100">Edit Site Details</h3>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed">Modify the reference name and platform category for this registered domain.</p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                updateSite({
                  resource: 'sites',
                  id: editSite.id,
                  values: { name: editSite.name, platform: editSite.platform },
                  successNotification: () => ({
                    message: 'Site details updated successfully!',
                    type: 'success',
                  })
                }, {
                  onSuccess: () => {
                    refetch();
                    setIsEditOpen(false);
                  }
                });
              }} 
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Site Name</label>
                <input
                  type="text"
                  required
                  value={editSite.name}
                  onChange={(e) => setEditSite({ ...editSite, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Platform</label>
                <select
                  value={editSite.platform}
                  onChange={(e) => setEditSite({ ...editSite, platform: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none transition"
                >
                  <option value="html">Custom HTML / JS</option>
                  <option value="wordpress">WordPress</option>
                  <option value="shopify">Shopify</option>
                  <option value="donorbox">Donorbox</option>
                  <option value="gofundme">GoFundMe</option>
                  <option value="other">Other CMS</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4.5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition shadow-lg cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { FileText, Save, CheckCircle } from 'lucide-react';

export const FormsPage: React.FC = () => {
  const [formData, setFormData] = React.useState({
    name: 'Victoria Campel',
    email: 'info@contact.com',
    site: 'www.companyname.com',
    company: 'CompanyName',
    plan: 'Premium',
  });

  const [isSaved, setIsSaved] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">System Forms</h1>
        <p className="text-slate-400 text-sm font-medium">Recreation of the sleek dark-glass input forms from the Glazzed theme reference.</p>
      </div>

      <div className="glass-card rounded-3xl max-w-2xl mx-auto overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-slate-950/20">
          <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" /> Member Configuration Form
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20 uppercase">Settings</span>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-white/5 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none transition font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-white/5 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none transition font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Website URL</label>
            <input
              type="text"
              required
              value={formData.site}
              onChange={(e) => setFormData({ ...formData, site: e.target.value })}
              className="w-full bg-slate-950 border border-white/5 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none transition font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Company Name</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full bg-slate-950 border border-white/5 focus:border-indigo-500 text-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none transition font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Subscription Plan</label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                className="w-full bg-slate-950 border border-white/5 focus:border-indigo-500 text-slate-300 rounded-xl px-4 py-3 text-xs focus:outline-none transition font-semibold"
              >
                <option value="Basic">Basic Plan</option>
                <option value="Premium">Premium Plan</option>
                <option value="Enterprise">Enterprise Plan</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 justify-end border-t border-white/5">
            {isSaved && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mr-auto">
                <CheckCircle className="w-4.5 h-4.5" /> Details saved successfully!
              </span>
            )}
            
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-500/20 cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

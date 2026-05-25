import React from 'react';
import { SignUp as ClerkSignUp } from '@clerk/clerk-react';

interface SignUpProps {
  isDemo?: boolean;
  onSignUp?: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ isDemo = false, onSignUp }) => {
  const [email, setEmail] = React.useState('demo@scrollpop.local');
  const [password, setPassword] = React.useState('••••••••');
  const [orgName, setOrgName] = React.useState('Demo Local Org');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSignUp) onSignUp();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>

      <div className="w-full max-w-[400px] relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-4xl animate-bounce block">🍿</span>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            ScrollPop
          </h1>
          <p className="text-sm text-slate-400">
            {isDemo 
              ? 'Create a quick playground account.' 
              : 'Create an account to deploy your first popups in minutes.'}
          </p>
        </div>

        {isDemo ? (
          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 shadow-xl rounded-2xl p-6 text-slate-200 space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-100">Offline Demo Sign Up</h2>
              <p className="text-xs text-slate-400 mt-1">
                Zero external dependencies. Runs locally on TimescaleDB.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  required
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-2.5 rounded-lg transition duration-200 shadow-lg shadow-indigo-500/20 text-sm mt-2 cursor-pointer"
              >
                Create Account & Enter
              </button>
            </form>

            <div className="text-center text-xs text-slate-500 border-t border-slate-800/80 pt-4">
              Switch to production keys in <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-400 font-mono">apps/dashboard/.env</code> to enable live Clerk auth.
            </div>
          </div>
        ) : (
          <ClerkSignUp
            signInUrl="/sign-in"
            afterSignUpUrl="/dashboard"
            appearance={{
              elements: {
                card: 'bg-slate-900/80 backdrop-blur border border-slate-800 shadow-xl rounded-2xl p-6 text-slate-200',
                headerTitle: 'text-slate-100 font-bold',
                headerSubtitle: 'text-slate-400',
                socialButtonsBlockButton: 'bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium py-2 rounded-lg transition',
                formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg transition shadow-md shadow-indigo-500/20',
                footerActionLink: 'text-indigo-400 hover:text-indigo-300 font-medium transition',
                formFieldInput: 'bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 rounded-lg',
                formFieldLabel: 'text-slate-400 text-xs font-semibold uppercase tracking-wider',
              },
            }}
          />
        )}
      </div>
    </div>
  );
};

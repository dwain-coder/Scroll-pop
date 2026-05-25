import React from 'react';
import {
  LayoutDashboard,
  Globe,
  Megaphone,
  BarChart2,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Sliders,
  Calendar,
  Image,
  MessageSquare,
  User,
  Crown,
} from 'lucide-react';
import { UserButton, OrganizationSwitcher } from '@clerk/clerk-react';
import { usePlan } from '../hooks/usePlan';

interface LayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  isDemo?: boolean;
}

function getProfileInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function loadProfileFromStorage() {
  try {
    const raw = localStorage.getItem('desktop_user') || localStorage.getItem('_sp_profile');
    if (raw) return JSON.parse(raw) as { name?: string; email?: string; avatar?: string; avatarUrl?: string };
  } catch {}
  return null;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPath, onNavigate, onLogout, isDemo = false }) => {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState(() => loadProfileFromStorage());
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const { isAdmin } = usePlan();

  // Sync profile changes from Settings/Profile pages
  React.useEffect(() => {
    const onStorage = () => setUserProfile(loadProfileFromStorage());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Active top segmented navigation items (Support Chat moved to user dropdown)
  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Sites', path: '/sites', icon: Globe },
    { name: 'Campaigns', path: '/campaigns', icon: Megaphone },
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Gallery', path: '/gallery', icon: Image },
    { name: 'Billing', path: '/billing', icon: CreditCard },
    { name: 'Settings', path: '/settings', icon: Settings },
    ...(isAdmin ? [{ name: 'Admin', path: '/admin', icon: Crown }] : []),
  ];

  // 8-Bit Interactive Glitch Canvas Background Effect
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const mouse = { x: -1000, y: -1000, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    interface Particle {
      x: number;
      y: number;
      size: number;
      vx: number;
      vy: number;
      alpha: number;
      color: string;
      glitch: boolean;
    }
    const particles: Particle[] = [];

    const draw = () => {
      // High contrast background lowlight
      ctx.fillStyle = '#020308';
      ctx.fillRect(0, 0, width, height);

      // Draw 8-bit tech grid network
      const gridSize = 45;
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.025)';
      ctx.lineWidth = 1;
      
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Glow nodes that react & warp towards mouse movement
      if (mouse.active) {
        ctx.fillStyle = 'rgba(20, 184, 166, 0.16)';
        for (let x = 0; x < width; x += gridSize) {
          for (let y = 0; y < height; y += gridSize) {
            const dx = mouse.x - x;
            const dy = mouse.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
              const factor = (200 - dist) / 200;
              const offsetX = dx * factor * 0.14;
              const offsetY = dy * factor * 0.14;
              
              ctx.fillRect(x + offsetX - 1.5, y + offsetY - 1.5, 3, 3);
            }
          }
        }
      }

      // Spawning glitching digital 8-bit blocks
      if (mouse.active && Math.random() < 0.4) {
        particles.push({
          x: mouse.x + (Math.random() - 0.5) * 35,
          y: mouse.y + (Math.random() - 0.5) * 35,
          size: Math.random() > 0.75 ? 8 : 4,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5 - 0.6,
          alpha: 1.0,
          color: Math.random() > 0.45 ? 'rgba(99, 102, 241, 0.85)' : 'rgba(244, 63, 94, 0.85)',
          glitch: Math.random() > 0.82
        });
      }

      // Update & render block particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]!;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color.replace('0.85', p.alpha.toString());
        
        if (p.glitch && Math.random() > 0.45) {
          ctx.fillRect(p.x - 12, p.y, p.size * 3.5, 2.5);
        } else {
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      }

      // Digital crosshairs tracking lines
      if (mouse.active) {
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.14)';
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 40, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(20, 184, 166, 0.05)';
        ctx.beginPath();
        ctx.moveTo(mouse.x, 0);
        ctx.lineTo(mouse.x, height);
        ctx.moveTo(0, mouse.y);
        ctx.lineTo(width, mouse.y);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden text-slate-100 relative font-sans">
      {/* HTML5 Interactive Cursor Glitch Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none z-0" 
      />

      {/* Main Container without Left Panel */}
      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        
        {/* Dynamic Horizontal Segmented Navigation */}
        <header className="flex items-center justify-between px-6 py-4 bg-[#08090c]/85 backdrop-blur-xl border-b border-white/8 z-20 shrink-0 relative">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-200 md:hidden cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo Brand Brand Area */}
          <div 
            onClick={() => onNavigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-fuchsia-500 via-indigo-500 to-teal-400 flex items-center justify-center shadow-lg shadow-fuchsia-500/25 transition-all group-hover:scale-105">
              <span className="text-sm font-bold text-white">🍿</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-tight text-white font-sans leading-none">
                ScrollPop
              </span>
              <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest leading-none mt-0.5">DEV CENTER</span>
            </div>
          </div>

          {/* Center: Segmented Navigation Header Pill */}
          <div className="hidden md:flex items-center gap-1.5 bg-[#0e1017] border border-white/8 rounded-full p-1 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-bold text-[10px] transition cursor-pointer select-none border border-transparent ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-white border-white/10 shadow-sm shadow-white/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right Area: Search & Account profile redirection */}
          <div className="flex items-center gap-3">
            <button className="p-2 bg-slate-900/50 border border-white/8 rounded-full hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition cursor-pointer">
              <Search className="w-4 h-4" />
            </button>

            {isDemo ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setIsUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 bg-[#0e1017] border border-white/8 px-3.5 py-1.5 rounded-full shadow-sm hover:border-white/15 hover:bg-white/5 transition cursor-pointer select-none"
                >
                  {userProfile?.avatarUrl || userProfile?.avatar ? (
                    <img
                      src={userProfile.avatarUrl || userProfile.avatar}
                      className="w-5 h-5 rounded-full object-cover shrink-0 border border-white/10"
                      alt="avatar"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-extrabold text-white">
                        {userProfile?.name ? getProfileInitials(userProfile.name) : 'DA'}
                      </span>
                    </div>
                  )}
                  <div className="flex-col text-left text-[10px] hidden lg:flex">
                    <span className="font-bold text-slate-200 leading-none">
                      {userProfile?.name ?? 'Dev Admin'}
                    </span>
                    <span className="text-[7.5px] text-indigo-400 font-extrabold uppercase mt-0.5 tracking-wider">Admin · Testing</span>
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#0e1017] border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-white/5">
                      <div className="text-xs font-bold text-slate-200">{userProfile?.name ?? 'Dev Admin'}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{userProfile?.email ?? 'admin@scrollpop.dev'}</div>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <button
                        onClick={() => { setIsUserMenuOpen(false); onNavigate('/profile'); }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5" /> Profile
                      </button>
                      <button
                        onClick={() => { setIsUserMenuOpen(false); onNavigate('/settings'); }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" /> Settings
                      </button>
                      <button
                        onClick={() => { setIsUserMenuOpen(false); onNavigate('/chat'); }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Support Chat
                      </button>
                      {isAdmin && (
                        <>
                          <div className="h-px bg-white/5 my-1" />
                          <button
                            onClick={() => { setIsUserMenuOpen(false); onNavigate('/admin'); }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-semibold text-amber-400 hover:bg-amber-500/10 transition cursor-pointer"
                          >
                            <Crown className="w-3.5 h-3.5" /> Master Admin
                          </button>
                        </>
                      )}
                      <div className="h-px bg-white/5 my-1" />
                      <button
                        onClick={() => { setIsUserMenuOpen(false); onLogout(); }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[#0e1017] border border-white/8 px-2 py-1 rounded-full shadow-sm hover:bg-white/5 transition cursor-pointer">
                <UserButton afterSignOutUrl="/sign-in" />
                <button
                  onClick={() => onNavigate('/profile')}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                  title="Configure Profile"
                >
                  <User className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Main Area Content */}
        <main className="flex-1 overflow-y-auto px-6 py-8 relative">
          <div className="max-w-6xl mx-auto relative z-10">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-64 z-50 transform md:hidden transition-transform duration-300 ease-in-out glass-sidebar ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full text-slate-200">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <span className="font-extrabold text-lg text-white">Main Menu</span>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    onNavigate(item.path);
                    setIsMobileOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition font-semibold text-xs cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-white/5 shrink-0">
            <button
              onClick={onLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl font-bold text-xs text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Sun, Moon, LayoutGrid, BrainCircuit, User, PlusCircle, Menu, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 group ${
          isActive
            ? 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
            {icon}
        </span>
        {label}
      </Link>
    );
  };

  const MobileNavLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex flex-col items-center justify-center w-full py-3 transition-all duration-200 ${
          isActive
            ? 'text-sky-600 dark:text-sky-400'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-sky-50 dark:bg-sky-500/10 mb-1' : 'mb-1'}`}>
            {icon}
        </div>
        <span className="text-[10px] font-medium">{label}</span>
      </Link>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
        <nav className="fixed top-0 w-full bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20 items-center">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="bg-sky-500 p-2 rounded-xl group-hover:scale-105 transition-transform duration-200 shadow-lg shadow-sky-500/20">
                  <BrainCircuit className="h-6 w-6 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                  Perspecti<span className="text-sky-500">Q</span>
                </span>
              </Link>
              <div className="flex items-center gap-4">
                <button onClick={toggleTheme} className="p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-white/5">
                  {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </button>
                <Link to="/login" className="hidden sm:block text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 px-6 py-3 rounded-full transition-all shadow-lg shadow-sky-500/20 hover:-translate-y-0.5">
                  Enter Simulation
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="pt-20">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden">
      
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 flex items-center justify-between px-4 z-[60]">
        <div className="flex items-center gap-2">
           <div className="bg-sky-500 p-1.5 rounded-lg">
              <BrainCircuit className="h-5 w-5 text-white" />
           </div>
           <span className="font-bold text-lg text-slate-900 dark:text-white">PerspectiQ</span>
        </div>
        <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-72 bg-white dark:bg-black border-r border-slate-100 dark:border-white/5 flex flex-col transition-transform duration-300 ease-in-out overflow-y-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:static lg:h-full lg:shrink-0
      `}>
        <div className="p-8 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 group" onClick={() => setIsMobileMenuOpen(false)}>
             <div className="bg-sky-500 p-2 rounded-xl group-hover:scale-105 transition-transform duration-200 shadow-lg shadow-sky-500/20">
                <BrainCircuit className="h-6 w-6 text-white" />
             </div>
             <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              Perspecti<span className="text-sky-500">Q</span>
            </span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 space-y-2 flex-1">
          <NavLink to="/dashboard" icon={<LayoutGrid className="w-5 h-5" />} label="Dashboard" />
          <NavLink to="/setup" icon={<PlusCircle className="w-5 h-5" />} label="New Simulation" />
        </div>

        <div className="p-6 border-t border-slate-50 dark:border-white/5">
          <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-black flex items-center justify-center text-sky-500 shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{useAuth().username || 'User'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{useAuth().role || 'Guest'}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center gap-2 p-3 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all"
            >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
            >
                <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[65] lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 min-w-0 h-full overflow-y-auto relative scroll-smooth pb-24 lg:pb-0 pt-16 lg:pt-0">
        <div className="max-w-[1600px] mx-auto p-4 md:p-8 lg:p-10 animate-fade-in">
          {children}
        </div>
      </main>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 pb-safe z-50">
        <div className="flex items-center justify-around px-2">
            <MobileNavLink to="/dashboard" icon={<LayoutGrid className="w-6 h-6" />} label="Home" />
            <div className="-mt-8">
                <Link to="/setup" className="flex items-center justify-center w-14 h-14 bg-sky-500 text-white rounded-full shadow-lg shadow-sky-500/30 hover:scale-105 transition-transform">
                    <PlusCircle className="w-7 h-7" />
                </Link>
            </div>
            <MobileNavLink to="/" icon={<BrainCircuit className="w-6 h-6" />} label="Landing" />
        </div>
      </div>

    </div>
  );
};

export default Layout;
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import Toast from './Toast';
import {
  LayoutDashboard, Code2, Compass, Trophy, User, LogOut, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/problems', label: 'Problems', icon: Code2 },
  { to: '/recommendations', label: 'Explore', icon: Compass },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/profile', label: 'Profile', icon: User }
];

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { skillUnlockToast, dismissToast } = useSocket();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen flex bg-[#0F0F1A]">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-56 bg-[#0F0F1A] border-r border-[#1E1E35] fixed h-full z-30">
        <div className="px-4 py-5 border-b border-[#1E1E35]">
          <span className="text-sm font-semibold tracking-tight">
            <span className="text-[#6C63FF]">Cognitive</span>
            <span className="text-[#E8E8F0]"> Campus</span>
          </span>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'text-white bg-[#1A1A2E] border-l-2 border-[#6C63FF]'
                    : 'text-[#8888A0] hover:text-white hover:bg-[#1A1A2E]'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[#1E1E35]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-md bg-[#6C63FF]/20 flex items-center justify-center text-xs font-semibold text-[#6C63FF]">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[#E8E8F0] truncate">{user?.name}</p>
              <p className="text-[10px] font-mono text-[#8888A0]">LVL {user?.level}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-[#8888A0] hover:text-[#FF4757] transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-56">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-[#0F0F1A]/90 backdrop-blur-sm border-b border-[#1E1E35] px-4 lg:px-6 py-2.5">
          <div className="flex items-center justify-between">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-[#8888A0]">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="lg:hidden text-sm font-semibold text-[#6C63FF]">CC</span>
            <div className="flex items-center gap-4 ml-auto">
              <span className="font-mono text-sm font-semibold text-[#FFA726]">{user?.xp || 0} <span className="text-[#8888A0] font-normal text-xs">XP</span></span>
              <span className="font-mono text-xs px-2 py-0.5 bg-[#1A1A2E] border border-[#2A2A4A] rounded text-[#6C63FF]">[LVL {user?.level || 1}]</span>
              <span className="text-xs text-[#8888A0]">🔥 {user?.streak || 0}d</span>
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-[#0F0F1A]/98 pt-14">
            <nav className="p-4 space-y-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm ${isActive ? 'text-white bg-[#1A1A2E]' : 'text-[#8888A0]'}`}>
                  <Icon className="w-4 h-4" />{label}
                </NavLink>
              ))}
              <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#FF4757] w-full">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </nav>
          </div>
        )}

        <main className="p-4 lg:p-6"><Outlet /></main>
      </div>

      {skillUnlockToast && (
        <Toast message={`Skill Unlocked: ${skillUnlockToast.skillName}`} type="success" onDismiss={dismissToast} duration={4000} />
      )}
    </div>
  );
};

export default Layout;

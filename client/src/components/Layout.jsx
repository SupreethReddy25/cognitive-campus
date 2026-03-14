import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import Toast from './Toast';
import {
  LayoutDashboard,
  Code2,
  Compass,
  Trophy,
  User,
  LogOut,
  Zap,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/problems', label: 'Problems', icon: Code2 },
  { to: '/recommendations', label: 'Recommendations', icon: Compass },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/profile', label: 'Profile', icon: User }
];

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { skillUnlockToast, dismissToast } = useSocket();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-secondary">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-surface/50 border-r border-gray-700/50 fixed h-full z-30">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700/50">
          <h1 className="text-xl font-bold">
            <span className="text-primary">Cognitive</span>
            <span className="text-gray-100"> Campus</span>
          </h1>
          <p className="text-xs text-muted mt-1">Adaptive DSA Learning</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted hover:text-gray-100 hover:bg-gray-700/30'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User card at bottom */}
        <div className="p-4 border-t border-gray-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-semibold text-sm">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted">Level {user?.level}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-muted hover:text-red-400 transition-colors w-full px-2 py-1.5"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-secondary/80 backdrop-blur-md border-b border-gray-700/50 px-4 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-muted hover:text-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="lg:hidden text-lg font-bold">
              <span className="text-primary">CC</span>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-1.5 text-sm">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-amber-400">{user?.xp || 0}</span>
                <span className="text-muted hidden sm:inline">XP</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full">
                <span className="text-xs text-primary font-semibold">LVL {user?.level || 1}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-sm">
                <span className="text-accent">🔥</span>
                <span className="text-gray-300">{user?.streak || 0}d</span>
              </div>
              <button
                onClick={handleLogout}
                className="hidden lg:flex items-center gap-1.5 text-sm text-muted hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-secondary/95 backdrop-blur-sm pt-16">
            <nav className="p-4 space-y-2">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted hover:text-gray-100'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-base text-red-400 w-full"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </nav>
          </div>
        )}

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Toast for skill unlock notifications */}
      {skillUnlockToast && (
        <Toast
          message={`🎉 Skill Unlocked: ${skillUnlockToast.skillName}!`}
          type="success"
          onDismiss={dismissToast}
          duration={4000}
        />
      )}
    </div>
  );
};

export default Layout;

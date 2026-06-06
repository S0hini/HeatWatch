import { NavLink, useNavigate } from 'react-router-dom';
import { Thermometer, Map, BarChart2, Lightbulb, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/dashboard',       label: 'Dashboard',       icon: Thermometer },
  { to: '/map',             label: 'Zone Map',        icon: Map },
  { to: '/analysis',        label: 'Analysis',        icon: BarChart2 },
  { to: '/recommendations', label: 'Recommendations', icon: Lightbulb },
];

export default function Navbar() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-surface-950/90 backdrop-blur-md border-b border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-heat-500 to-ember-600 flex items-center justify-center shadow-heat-sm">
              <Thermometer className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-heat-100 group-hover:text-heat-300 transition-colors">
              Heat<span className="text-heat-500">Watch</span>
            </span>
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-heat-600/20 text-heat-300 border border-heat-600/30'
                      : 'text-surface-400 hover:text-heat-300 hover:bg-surface-800'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-xs text-surface-500 border border-surface-700 rounded-full px-3 py-1">
              {user?.email?.split('@')[0]}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-surface-400 hover:text-ember-400 transition-colors px-3 py-2 rounded-lg hover:bg-surface-800"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-surface-400 hover:text-heat-300 hover:bg-surface-800 transition-colors"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-surface-800 bg-surface-950/95 backdrop-blur-md">
          <div className="px-4 py-3 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-heat-600/20 text-heat-300' : 'text-surface-400 hover:text-heat-200 hover:bg-surface-800'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-surface-400 hover:text-ember-400 hover:bg-surface-800 transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

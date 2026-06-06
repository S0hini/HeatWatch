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

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'HW';

  return (
    <nav className="sticky top-0 z-50 bg-surface-950/90 backdrop-blur-md border-b border-surface-700/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-heat-500 to-ember-600 flex items-center justify-center">
              <Thermometer className="w-3.5 h-3.5 text-white" />
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  className="font-medium text-xl tracking-tight text-heat-100 group-hover:text-heat-300 transition-colors">
              Heat<span className="text-heat-500 italic">Watch</span>
            </span>
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'text-heat-300 bg-heat-600/15'
                      : 'text-surface-400 hover:text-heat-300 hover:bg-surface-800/60'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Date chip */}
            <span className="font-mono text-[10px] uppercase tracking-widest text-surface-500
                             bg-surface-800 px-3 py-1.5 rounded-full border border-surface-700/60">
              {new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }).toUpperCase()}
            </span>

            {/* User avatar */}
            <div className="w-7 h-7 rounded-full bg-heat-600/80 text-white
                            font-mono text-[10px] font-medium flex items-center justify-center
                            border border-heat-500/30">
              {initials}
            </div>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-[13px] text-surface-500
                         hover:text-ember-400 transition-colors px-2 py-1.5 rounded-lg
                         hover:bg-surface-800/60"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-surface-400 hover:text-heat-300
                       hover:bg-surface-800 transition-colors"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-surface-800 bg-surface-950/95 backdrop-blur-md">
          <div className="px-4 py-3 space-y-0.5">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                    isActive ? 'bg-heat-600/15 text-heat-300' : 'text-surface-400 hover:text-heat-200 hover:bg-surface-800'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm
                         text-surface-400 hover:text-ember-400 hover:bg-surface-800
                         transition-colors w-full"
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
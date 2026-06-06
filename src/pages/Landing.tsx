import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Thermometer, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Landing() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        navigate('/dashboard');
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Account created! You can now sign in.');
        setMode('login');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface-950 flex overflow-hidden">
      {/* Left panel — hero */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative flex-col justify-between p-12">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-surface-900 to-heat-950/20" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-heat-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-ember-600/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-amber-500/6 rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-heat-500 to-ember-600 flex items-center justify-center shadow-heat">
              <Thermometer className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-heat-100">
              Heat<span className="text-heat-500">Watch</span>
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="font-display font-bold text-5xl xl:text-6xl leading-tight text-heat-50 mb-4">
              Monitor.<br />
              <span className="heat-text">Understand.</span><br />
              Act.
            </h1>
            <p className="text-surface-400 text-lg max-w-md leading-relaxed">
              Real-time Urban Heat Island monitoring for Kolkata. Identify hotspots, understand risk levels, and take data-driven action to protect your city.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '6', label: 'Zones Monitored' },
              { value: '+6.4°C', label: 'UHI Intensity' },
              { value: '24/7', label: 'Live Tracking' },
            ].map(({ value, label }) => (
              <div key={label} className="glass-card p-4">
                <div className="font-display font-bold text-2xl text-heat-400 mb-1">{value}</div>
                <div className="text-xs text-surface-500">{label}</div>
              </div>
            ))}
          </div>

          {/* Zone pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { name: 'Howrah', temp: '42°C', color: 'text-red-400 border-red-600/30 bg-red-600/10' },
              { name: 'Esplanade', temp: '39°C', color: 'text-orange-400 border-orange-600/30 bg-orange-600/10' },
              { name: 'Park Street', temp: '38°C', color: 'text-orange-400 border-orange-600/30 bg-orange-600/10' },
              { name: 'Salt Lake', temp: '36°C', color: 'text-amber-400 border-amber-600/30 bg-amber-600/10' },
              { name: 'New Town', temp: '35°C', color: 'text-emerald-400 border-emerald-600/30 bg-emerald-600/10' },
            ].map(({ name, temp, color }) => (
              <span key={name} className={`text-xs font-medium px-3 py-1.5 rounded-full border ${color}`}>
                {name} · {temp}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-surface-600">
          Data updated every 30 minutes · Kolkata Metropolitan Area
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-10 bg-surface-900/50 border-l border-surface-800">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-heat-500 to-ember-600 flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-heat-100">
              Heat<span className="text-heat-500">Watch</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className="font-display font-bold text-3xl text-heat-50 mb-2">
              {mode === 'login' ? 'Welcome back' : 'Get started'}
            </h2>
            <p className="text-surface-400 text-sm">
              {mode === 'login'
                ? 'Sign in to access the Kolkata UHI dashboard'
                : 'Create your account to monitor heat zones'}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-surface-800 rounded-xl p-1 mb-8">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === m
                    ? 'bg-gradient-to-r from-heat-600 to-ember-600 text-white shadow-heat-sm'
                    : 'text-surface-400 hover:text-heat-300'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-ember-600/10 border border-ember-600/30 rounded-xl p-4 mb-6">
              <AlertCircle className="w-4 h-4 text-ember-400 mt-0.5 shrink-0" />
              <p className="text-sm text-ember-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-3 bg-emerald-600/10 border border-emerald-600/30 rounded-xl p-4 mb-6">
              <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-sm text-emerald-300">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-heat-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-surface-500">
            By continuing, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}

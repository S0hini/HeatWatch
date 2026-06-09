import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Thermometer, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Landing() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
      else navigate('/dashboard');
    } else {
      const { error } = await signUp(email, password, confirmPassword);
      if (error) {
        setError(error);
      } else {
        setSuccess('Account created! You can now sign in.');
        setMode('login');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) setError(error);
    else navigate('/dashboard');
    setLoading(false);
  };

  const handleModeSwitch = (m: 'login' | 'signup') => {
    setMode(m);
    setError('');
    setSuccess('');
    setConfirmPassword('');
  };

  return (
    <div className="relative min-h-screen flex overflow-hidden bg-[#070608]">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: "url('/bg.png')" }}
      />
      <div className="absolute inset-0 z-[1] bg-[#070608]/35" />
      <div className="relative z-[2] flex w-full">
      {/* Left panel — hero (unchanged) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative flex-col justify-between p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-surface-950/60 via-surface-900/40 to-heat-950/10" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-heat-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-ember-600/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-amber-500/6 rounded-full blur-2xl" />
        </div>

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


        </div>

        <div className="relative z-10 text-xs text-surface-600">
          Data updated every 30 minutes
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
          <div className="flex bg-surface-800 rounded-xl p-1 mb-6">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => handleModeSwitch(m)}
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

          {/* Error / Success banners */}
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

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-surface-700 bg-surface-800 hover:bg-surface-700 text-surface-200 text-sm font-medium transition-all duration-200 mb-4"
          >
            {/* Google SVG icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-surface-700" />
            <span className="text-xs text-surface-500">or continue with email</span>
            <div className="flex-1 h-px bg-surface-700" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Confirm Password — only on signup */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className={`input-field pr-12 ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-ember-500 focus:border-ember-400'
                        : confirmPassword && confirmPassword === password
                        ? 'border-emerald-500 focus:border-emerald-400'
                        : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-heat-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Inline password match feedback */}
                {confirmPassword && (
                  <p className={`text-xs mt-1.5 ${confirmPassword === password ? 'text-emerald-400' : 'text-ember-400'}`}>
                    {confirmPassword === password ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
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
    </div>
  );
}
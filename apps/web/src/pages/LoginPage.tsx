import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Return to intended page if directed by ProtectedRoute
  const destination = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please enter your email/username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(identifier.trim(), password);
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Background Japanese Shrine Atmosphere */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <img
          src="/assets/art/hero-torii-scenery.jpg"
          alt=""
          className="w-full h-full object-cover opacity-15 filter contrast-[1.2] blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#14191D] via-[#14191D]/90 to-[#14191D]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14191D] via-transparent to-[#14191D]" />
      </div>

      {/* Ambient Lighting Orbs */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />

      {/* Unified Full-Size Cinematic Auth Card */}
      <div className="relative z-10 max-w-4xl w-full bg-[#14191D] border border-[#252E37] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* Left Side: Full-Bleed Anime Art Showcase */}
        <div className="md:w-1/2 relative min-h-[260px] md:min-h-[560px] overflow-hidden bg-[#0D100F] group">
          <img
            src="/posters/onepiece.jpg"
            alt="One Piece"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter contrast-[1.05]"
          />
          {/* Atmospheric Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#14191D] via-transparent to-transparent opacity-90 md:opacity-85" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#14191D] hidden md:block opacity-60" />

          {/* Top Artwork Badge */}
          <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-white text-[11px] font-black uppercase tracking-wider shadow-lg">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>One Piece • Egghead Arc</span>
          </div>

          {/* Bottom Japanese Quote & Callout */}
          <div className="absolute bottom-6 left-6 right-6 z-20 text-left">
            <span className="text-[10px] font-japanese font-black px-2 py-0.5 rounded bg-indigo-600 text-white uppercase tracking-wider inline-block mb-2 shadow-sm">
              新時代へ
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white leading-snug drop-shadow-md">
              "Inherited will, the swelling of the era, and the dreams of its people."
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-1.5 drop-shadow-sm">
              Track your journey through 1,100+ episodes on Anisume.
            </p>
          </div>
        </div>

        {/* Right Side: Clean Form */}
        <div className="md:w-1/2 p-8 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            {/* Header: Logo & Title */}
            <div className="text-left mb-6">
              <Link to="/" className="mb-4 inline-block hover:scale-105 transition-transform">
                <img src="/anisume-logo.png" alt="Anisume" className="h-8 sm:h-9 w-auto object-contain" />
              </Link>
              <h1 className="text-2xl font-black text-white tracking-tight">Welcome Back</h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Sign in to access your library and personalized recommendations
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Email or Username
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0D100F] border border-[#252E37] text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-indigo-400 hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0D100F] border border-[#252E37] text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all duration-200 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              </button>
            </form>
          </div>

          {/* Bottom Switch Link */}
          <div className="mt-8 pt-5 border-t border-[#252E37] text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-black text-indigo-400 hover:underline ml-1">
              Sign up for free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

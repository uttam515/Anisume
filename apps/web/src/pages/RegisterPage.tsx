import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { UserPlus, AlertCircle, Check } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live password validation
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (!hasMinLength || !hasLetter || !hasNumber) {
      setError('Password must be at least 8 characters long and contain both letters and numbers.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register(username.trim(), email.trim(), password);
      navigate('/profile', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
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
      <div className="absolute top-1/3 left-8 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-8 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />

      {/* Unified Full-Size Cinematic Auth Card */}
      <div className="relative z-10 max-w-4xl w-full bg-[#14191D] border border-[#252E37] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* Left Side: Full-Bleed Anime Art Showcase */}
        <div className="md:w-1/2 relative min-h-[260px] md:min-h-[620px] overflow-hidden bg-[#0D100F] group">
          <img
            src="/posters/bleach.webp"
            alt="Bleach: Thousand-Year Blood War"
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 filter contrast-[1.05]"
          />
          {/* Atmospheric Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#14191D] via-transparent to-transparent opacity-90 md:opacity-85" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#14191D] hidden md:block opacity-60" />

          {/* Top Artwork Badge */}
          <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-white text-[11px] font-black uppercase tracking-wider shadow-lg">
            <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
            <span>Bleach • Thousand-Year Blood War</span>
          </div>

          {/* Bottom Japanese Quote & Callout */}
          <div className="absolute bottom-6 left-6 right-6 z-20 text-left">
            <span className="text-[10px] font-japanese font-black px-2 py-0.5 rounded bg-brand-orange text-white uppercase tracking-wider inline-block mb-2 shadow-sm">
              千年血戦篇
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white leading-snug drop-shadow-md">
              "Your destiny is in your own hands."
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-1.5 drop-shadow-sm">
              Discover anime crafted for your exact sensory taste.
            </p>
          </div>
        </div>

        {/* Right Side: Clean Form */}
        <div className="md:w-1/2 p-8 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            {/* Header: Logo & Title (Clean, NO unnecessary Japanese text) */}
            <div className="text-left mb-6">
              <Link to="/" className="mb-4 inline-block hover:scale-105 transition-transform">
                <img src="/anisume-logo.png" alt="Anisume" className="h-8 sm:h-9 w-auto object-contain" />
              </Link>
              <h1 className="text-2xl font-black text-white tracking-tight">Create Account</h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Build your personal library and unlock sensory taste matching
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0D100F] border border-[#252E37] text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0D100F] border border-[#252E37] text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0D100F] border border-[#252E37] text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all font-medium"
                />

                {/* Password Criteria */}
                {password.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px]">
                    <span className={`flex items-center space-x-1 ${hasMinLength ? 'text-brand-emerald' : 'text-slate-500'}`}>
                      <Check className="w-3 h-3" />
                      <span>8+ chars</span>
                    </span>
                    <span className={`flex items-center space-x-1 ${hasLetter ? 'text-brand-emerald' : 'text-slate-500'}`}>
                      <Check className="w-3 h-3" />
                      <span>Letters</span>
                    </span>
                    <span className={`flex items-center space-x-1 ${hasNumber ? 'text-brand-emerald' : 'text-slate-500'}`}>
                      <Check className="w-3 h-3" />
                      <span>Numbers</span>
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0D100F] border border-[#252E37] text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all font-medium"
                />
                {confirmPassword.length > 0 && (
                  <div className="mt-1 text-[10px]">
                    {passwordsMatch ? (
                      <span className="text-brand-emerald flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Passwords match</span>
                      </span>
                    ) : (
                      <span className="text-rose-400">Passwords do not match</span>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 inline-flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/25 transition-all duration-200 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              </button>
            </form>
          </div>

          {/* Bottom Switch Link */}
          <div className="mt-6 pt-5 border-t border-[#252E37] text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-black text-emerald-400 hover:underline ml-1">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

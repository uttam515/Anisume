import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/authClient.js';
import { KeyRound, ArrowLeft, CheckCircle2, AlertCircle, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await authApi.forgotPassword({ email: email.trim() });
      setMessage(res.message);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 relative overflow-hidden">
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

      {/* Ambient Lighting Orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-[#14191D]/95 backdrop-blur-xl border border-[#252E37] rounded-3xl p-8 sm:p-10 shadow-2xl overflow-hidden">
        {/* Top Vermilion Accent Bar */}
        <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-brand-red via-brand-yellow to-brand-orange rounded-full opacity-80" />

        <div className="text-center mb-7 flex flex-col items-center">
          <Link to="/" className="mb-4 inline-block hover:scale-105 transition-transform">
            <img src="/anisume-logo.png" alt="Anisume" className="h-9 w-auto object-contain" />
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-brand-red/15 border border-brand-red/30 text-brand-red flex items-center justify-center mx-auto mb-3 shadow-md">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Reset Password</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Enter your registered email address to receive recovery instructions
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-brand-red/10 border border-brand-red/30 text-rose-300 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-brand-red mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="text-center space-y-6">
            <div className="p-4 rounded-2xl bg-brand-emerald/10 border border-brand-emerald/30 text-brand-emerald text-xs flex items-start space-x-3 text-left font-bold leading-relaxed">
              <CheckCircle2 className="w-5 h-5 text-brand-emerald shrink-0 mt-0.5" />
              <span>
                {message ||
                  'If an account exists with this email address, a password reset link has been sent. Please check your inbox and spam folder.'}
              </span>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center space-x-2 text-xs font-bold text-brand-red hover:underline transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Sign In</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Registered Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0D100F] border border-[#252E37] text-slate-100 text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 transition-all font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-gradient-to-r from-brand-red to-red-600 hover:from-red-600 hover:to-brand-red text-white text-sm font-black shadow-lg shadow-brand-red/30 hover:shadow-brand-red/50 transition-all duration-200 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              <Mail className="w-4 h-4" />
              <span>{loading ? 'Sending Link...' : 'Send Reset Link'}</span>
            </button>

            <div className="mt-6 pt-5 border-t border-[#252E37] text-center">
              <Link
                to="/login"
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

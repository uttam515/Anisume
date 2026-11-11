import { useState, type FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api/authClient.js';
import { Lock, CheckCircle2, AlertCircle, ArrowRight, Check } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Missing password reset token. Please follow the link in your email.');
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
      await authApi.resetPassword({
        token,
        newPassword: password,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 relative overflow-hidden">
        <div className="max-w-md w-full bg-[#14191D]/95 backdrop-blur-xl border border-[#252E37] rounded-3xl p-8 text-center shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Invalid Reset Link</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed font-medium">
            No reset token found in this link. Please request a new password reset email.
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition"
          >
            <span>Request New Reset Link</span>
          </Link>
        </div>
      </div>
    );
  }

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

      <div className="relative z-10 max-w-md w-full bg-[#14191D]/95 backdrop-blur-xl border border-[#252E37] rounded-3xl p-8 sm:p-10 shadow-2xl overflow-hidden">
        {/* Top Vermilion Accent Bar */}
        <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full opacity-80" />

        <div className="text-center mb-7 flex flex-col items-center">
          <Link to="/" className="mb-4 inline-block hover:scale-105 transition-transform">
            <img src="/anisume-logo.png" alt="Anisume" className="h-9 w-auto object-contain" />
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Set New Password</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Choose a new, secure password for your Anisume account
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center space-y-6">
            <div className="p-4 rounded-2xl bg-brand-emerald/10 border border-brand-emerald/30 text-brand-emerald text-xs flex items-start space-x-3 text-left font-bold leading-relaxed">
              <CheckCircle2 className="w-5 h-5 text-brand-emerald shrink-0 mt-0.5" />
              <span>
                Your password has been reset successfully! All previous sessions have been logged
                out for your security. Please log in with your new password.
              </span>
            </div>

            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition cursor-pointer"
            >
              <span>Sign In with New Password</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0D100F] border border-[#252E37] text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
              />
              <div className="flex items-center space-x-3 mt-2 text-[10px] text-slate-400">
                <span className={`flex items-center space-x-1 ${hasMinLength ? 'text-brand-emerald font-bold' : ''}`}>
                  <Check className={`w-3 h-3 ${hasMinLength ? 'opacity-100' : 'opacity-40'}`} />
                  <span>8+ chars</span>
                </span>
                <span className={`flex items-center space-x-1 ${hasLetter ? 'text-brand-emerald font-bold' : ''}`}>
                  <Check className={`w-3 h-3 ${hasLetter ? 'opacity-100' : 'opacity-40'}`} />
                  <span>Letter</span>
                </span>
                <span className={`flex items-center space-x-1 ${hasNumber ? 'text-brand-emerald font-bold' : ''}`}>
                  <Check className={`w-3 h-3 ${hasNumber ? 'opacity-100' : 'opacity-40'}`} />
                  <span>Number</span>
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl bg-[#0D100F] border text-slate-100 text-sm focus:outline-none transition-all font-medium ${
                  confirmPassword.length > 0 && !passwordsMatch
                    ? 'border-rose-500'
                    : 'border-[#252E37] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all duration-200 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

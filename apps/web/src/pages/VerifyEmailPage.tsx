import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api/authClient.js';
import { useAuth } from '../context/AuthContext.js';
import { CheckCircle2, AlertCircle, Mail, ArrowRight } from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { refreshUser, resendVerification } = useAuth();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resend form state for fallback
  const [resendEmail, setResendEmail] = useState('');
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('No verification token provided. Please check the link in your email.');
      return;
    }

    authApi
      .verifyEmail({ token })
      .then(async () => {
        setSuccess(true);
        await refreshUser();
      })
      .catch((err) => {
        setError(err.message || 'Verification token is invalid or expired.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResending(true);
    setResendMsg(null);
    try {
      const msg = await resendVerification(resendEmail.trim());
      setResendMsg(msg);
    } catch (err: any) {
      setResendMsg(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 relative">
      <div className="max-w-md w-full bg-[#171D1B] border border-[#202825] rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative z-10 overflow-hidden">
        <div className="mb-6 flex justify-center">
          <Link to="/" className="inline-block hover:scale-105 transition-transform">
            <img src="/anisume-logo.png" alt="Anisume" className="h-8 w-auto object-contain" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 space-y-4">
            <div className="w-12 h-12 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-white">Verifying Email Address...</h2>
            <p className="text-xs text-slate-400">Please wait while we confirm your account token.</p>
          </div>
        ) : success ? (
          <div>
            <div className="w-16 h-16 rounded-2xl bg-brand-emerald/10 border border-brand-emerald/30 text-brand-emerald flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-emerald/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Email Verified!</h1>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed font-medium">
              Your email address has been successfully verified. You now have unrestricted access to all
              Anisume features.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/profile"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition"
              >
                <span>View Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/discover"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-200 text-xs font-bold border border-dark-700 transition"
              >
                <span>Explore Anime</span>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Verification Failed</h1>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed font-medium">{error}</p>

            {/* Resend verification box */}
            <div className="bg-dark-950 border border-dark-800 rounded-2xl p-5 text-left mb-6">
              <div className="text-xs font-bold text-slate-200 mb-1 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>Request a new verification link</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Tokens expire after 24 hours. Enter your account email to receive a fresh link:
              </p>

              {resendMsg ? (
                <div className="p-3 bg-brand-emerald/10 border border-brand-emerald/30 rounded-xl text-brand-emerald text-xs font-bold">
                  {resendMsg}
                </div>
              ) : (
                <form onSubmit={handleResend} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-dark-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={resending}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50 cursor-pointer"
                  >
                    {resending ? 'Sending...' : 'Send New Link'}
                  </button>
                </form>
              )}
            </div>

            <Link
              to="/login"
              className="text-xs font-bold text-emerald-400 hover:underline transition"
            >
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

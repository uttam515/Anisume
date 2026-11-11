import { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';

export default function VerificationBanner() {
  const { user, resendVerification } = useAuth();
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!user || user.isEmailVerified) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    setFeedback(null);
    try {
      const msg = await resendVerification();
      setFeedback(msg);
    } catch (err: any) {
      setFeedback(err.message || 'Failed to resend verification link.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-amber-950/40 border-b border-amber-900/50 px-4 py-2.5 text-xs text-amber-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Your email (<span className="font-semibold text-white">{user.email}</span>) is
            unverified. Please check your inbox or spam folder.
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {feedback ? (
            <span className="flex items-center space-x-1 text-emerald-400 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{feedback}</span>
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={sending}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold transition disabled:opacity-50"
            >
              <Mail className="w-3 h-3" />
              <span>{sending ? 'Sending...' : 'Resend Email'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


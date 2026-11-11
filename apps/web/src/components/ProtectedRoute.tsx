import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Mail, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireVerified?: boolean;
}

export default function ProtectedRoute({ children, requireVerified = false }: ProtectedRouteProps) {
  const { user, loading, resendVerification } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireVerified && !user.isEmailVerified) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-dark-900 border border-dark-800 rounded-2xl text-center shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Email Verification Required</h2>
        <p className="text-sm text-slate-400 mb-6">
          This feature requires a verified email address. Please check your inbox for the
          verification link sent to <span className="text-brand-300 font-medium">{user.email}</span>.
        </p>
        <button
          onClick={async () => {
            try {
              const msg = await resendVerification();
              alert(msg);
            } catch (err: any) {
              alert(err.message || 'Failed to resend verification email.');
            }
          }}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition-colors"
        >
          <Mail className="w-4 h-4" />
          <span>Resend Verification Email</span>
        </button>
      </div>
    );
  }

  return <>{children}</>;
}


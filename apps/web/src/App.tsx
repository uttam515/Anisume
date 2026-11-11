import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import Navbar from './components/Navbar.js';
import Footer from './components/Footer.js';
import VerificationBanner from './components/VerificationBanner.js';
import ProtectedRoute from './components/ProtectedRoute.js';

// Pages
import HomePage from './pages/HomePage.js';
import DiscoverPage from './pages/DiscoverPage.js';
import SearchPage from './pages/SearchPage.js';
import AnimeDetailPage from './pages/AnimeDetailPage.js';
import LoginPage from './pages/LoginPage.js';
import RegisterPage from './pages/RegisterPage.js';
import UserProfilePage from './pages/UserProfilePage.js';
import MyListPage from './pages/MyListPage.js';
import VerifyEmailPage from './pages/VerifyEmailPage.js';
import ForgotPasswordPage from './pages/ForgotPasswordPage.js';
import ResetPasswordPage from './pages/ResetPasswordPage.js';
import RecommendationsPage from './pages/RecommendationsPage.js';
import QuestionnairePage from './pages/QuestionnairePage.js';

import { Compass, Home, AlertCircle } from 'lucide-react';

/**
 * ScrollToTop helper that resets scroll coordinates to (0, 0) on every route change.
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

/**
 * 404 Not Found Page with cinematic styling
 */
function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full text-center bg-dark-900 border border-dark-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400 mb-2">
          404
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-3">Lost in the Anime Void?</h1>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          The page or anime you are searching for might have drifted into another dimension or does
          not exist.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/25 transition duration-200"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
          <Link
            to="/discover"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-200 text-sm font-medium border border-dark-700 transition duration-200"
          >
            <Compass className="w-4 h-4" />
            <span>Browse Anime</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans selection:bg-brand-600/30 selection:text-brand-200 antialiased">
          {/* Sticky Global Navigation */}
          <Navbar />

          {/* Pending Email Verification Notice Banner */}
          <VerificationBanner />

          {/* Dynamic Route Content */}
          <main className="flex-1">
            <Routes>
              {/* Anime Discovery Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/movies" element={<DiscoverPage initialType="movie" />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/anime/:mal_id" element={<AnimeDetailPage />} />

              {/* Authentication & User Account Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-list"
                element={
                  <ProtectedRoute>
                    <MyListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recommendations"
                element={
                  <ProtectedRoute>
                    <RecommendationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/questionnaire"
                element={
                  <ProtectedRoute>
                    <QuestionnairePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <QuestionnairePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/users/:username" element={<UserProfilePage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Catch-all 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>

          {/* Global Footer */}
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

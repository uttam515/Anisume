import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Flame, Search, Compass, Home, Menu, X, LogIn, LogOut, Bookmark, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Home, kanji: '家' },
    { name: 'Discover', path: '/discover', icon: Compass, kanji: '探' },
    ...(user
      ? [
          { name: 'For You', path: '/recommendations', icon: Flame, kanji: '推' },
          { name: 'My List', path: '/my-list', icon: Bookmark, kanji: '録' },
        ]
      : []),
    { name: 'Search', path: '/search', icon: Search, kanji: '索' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-brand-ink/90 backdrop-blur-xl border-b border-dark-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Restored Original Logo */}
          <Link
            to="/"
            className="flex items-center space-x-3 group shrink-0 py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <img
              src="/anisume-logo.png"
              alt="Anisume"
              className="h-8 sm:h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-red text-white shadow-md shadow-brand-red/30'
                        : 'text-slate-300 hover:text-white hover:bg-dark-850'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 opacity-90" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Section: Quick Search + Auth Actions + Mobile Hamburger */}
          <div className="flex items-center space-x-3">
            {/* Quick Search Form */}
            <form onSubmit={handleQuickSearch} className="relative hidden lg:block w-48 xl:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search anime, genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-900 border border-dark-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
              />
            </form>

            {/* Auth Buttons / Profile Indicator */}
            <div className="hidden sm:flex items-center space-x-2">
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-dark-850 animate-pulse" />
              ) : user ? (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-dark-900 hover:bg-dark-850 border border-dark-800 text-xs font-bold text-slate-200 transition"
                  >
                    <div className="w-6 h-6 rounded-lg overflow-hidden bg-brand-red flex items-center justify-center text-white text-[11px] font-black">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        user.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="max-w-[100px] truncate">{user.username}</span>
                  </Link>

                  <button
                    onClick={() => logout()}
                    title="Sign Out"
                    className="p-2 rounded-xl text-slate-400 hover:text-brand-red hover:bg-dark-900 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-[#1C2329] hover:bg-[#252E37] border border-[#2E3842] hover:border-slate-400/40 transition-all duration-200 active:scale-95 flex items-center space-x-1.5 shadow-sm"
                  >
                    <LogIn className="w-3.5 h-3.5 text-slate-400" />
                    <span>Log In</span>
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-brand-red to-red-600 hover:from-red-600 hover:to-brand-red border border-brand-red/60 shadow-lg shadow-brand-red/30 hover:shadow-brand-red/50 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center space-x-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Sign Up</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-dark-850 md:hidden focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-dark-800 bg-brand-ink/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleQuickSearch} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search anime, genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-900 border border-dark-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-red"
            />
          </form>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold ${
                      isActive
                        ? 'bg-brand-red text-white'
                        : 'text-slate-300 hover:text-white hover:bg-dark-850'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-japanese text-xs opacity-60">{item.kanji}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="pt-3 border-t border-dark-800 space-y-2">
            {user ? (
              <div className="flex items-center justify-between px-2">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 text-sm font-bold text-slate-200"
                >
                  <div className="w-7 h-7 rounded-lg bg-brand-red flex items-center justify-center text-white text-xs font-black">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.username}</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-1 text-xs font-bold text-brand-red hover:underline"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1C2329] border border-[#2E3842] text-slate-200 hover:bg-[#252E37] transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-brand-red to-red-600 text-white shadow-md shadow-brand-red/25"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

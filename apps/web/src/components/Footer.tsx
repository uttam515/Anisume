import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import AnisumeLogo from './AnisumeLogo';

export default function Footer() {
  return (
    <footer className="bg-brand-ink border-t border-dark-800 text-slate-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="inline-block hover:opacity-95 transition-opacity">
              <AnisumeLogo size="md" />
            </Link>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Anisume is an intelligent, high-energy anime recommendation portal crafted with Japanese street aesthetics and sensory taste modeling.
            </p>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
              <span>Catalog: 12,997 Verified Anime Series & Films</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center space-x-1.5">
              <span>Navigation</span>
              <span className="font-japanese text-[10px] text-brand-red">案内</span>
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/discover" className="hover:text-white transition-colors">Discover Universe</Link>
              </li>
              <li>
                <Link to="/recommendations" className="hover:text-white transition-colors">Personalized Recommendations</Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-white transition-colors">Deep Search</Link>
              </li>
              <li>
                <Link to="/questionnaire" className="hover:text-white transition-colors">Taste Questionnaire</Link>
              </li>
            </ul>
          </div>

          {/* Genres & Themes */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center space-x-1.5">
              <span>Curated Themes</span>
              <span className="font-japanese text-[10px] text-brand-orange">主題</span>
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link to="/search?q=Action" className="hover:text-white transition-colors">Shounen & Action</Link>
              </li>
              <li>
                <Link to="/search?q=Psychological" className="hover:text-white transition-colors">Psychological & Thriller</Link>
              </li>
              <li>
                <Link to="/search?q=Cyberpunk" className="hover:text-white transition-colors">Cyberpunk & Sci-Fi</Link>
              </li>
              <li>
                <Link to="/search?q=Slice+of+Life" className="hover:text-white transition-colors">Slice of Life & Iyashikei</Link>
              </li>
              <li>
                <Link to="/search?q=Romance" className="hover:text-white transition-colors">Heartfelt Romance</Link>
              </li>
            </ul>
          </div>

          {/* Legendary Studios */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center space-x-1.5">
              <span>Animation Studios</span>
              <span className="font-japanese text-[10px] text-brand-sky">制作</span>
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link to="/search?q=MAPPA" className="hover:text-white transition-colors">MAPPA</Link>
              </li>
              <li>
                <Link to="/search?q=ufotable" className="hover:text-white transition-colors">Ufotable</Link>
              </li>
              <li>
                <Link to="/search?q=Studio+Ghibli" className="hover:text-white transition-colors">Studio Ghibli</Link>
              </li>
              <li>
                <Link to="/search?q=Bones" className="hover:text-white transition-colors">Bones</Link>
              </li>
              <li>
                <Link to="/search?q=Madhouse" className="hover:text-white transition-colors">Madhouse</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-dark-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center space-x-1">
            <span>© {new Date().getFullYear()} Anisume. Made with</span>
            <Heart className="w-3.5 h-3.5 fill-brand-red text-brand-red" />
            <span>for the global anime community.</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] font-semibold text-slate-400">
            <span>Data powered by MyAnimeList & Jikan API</span>
            <span>•</span>
            <span className="text-brand-yellow font-black">All Rights Reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

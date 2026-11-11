interface AnisumeLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showKanji?: boolean;
}

export default function AnisumeLogo({
  className = '',
  size = 'md',
  showKanji = true,
}: AnisumeLogoProps) {
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size];

  const textSizes = {
    sm: 'text-sm tracking-[0.2em]',
    md: 'text-base sm:text-lg tracking-[0.22em]',
    lg: 'text-xl sm:text-2xl tracking-[0.25em]',
  }[size];

  return (
    <div className={`inline-flex items-center space-x-2.5 select-none ${className}`}>
      {/* Symmetrical Japanese Torii / Anime Crest Emblem */}
      <div className={`relative ${iconSizes} shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          {/* Symmetrical Sun Disc in Background */}
          <circle cx="16" cy="14" r="7.5" fill="#E50914" fillOpacity="0.2" />
          <circle cx="16" cy="14" r="5" fill="#F4C95D" fillOpacity="0.9" />

          {/* Symmetrical Torii Gate Structure */}
          {/* Top curved main beam (Kasagi) */}
          <path
            d="M3 8.5C10 7 22 7 29 8.5"
            stroke="#E50914"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Secondary tie beam (Nuki) */}
          <line
            x1="6"
            y1="12"
            x2="26"
            y2="12"
            stroke="#E50914"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Left and Right symmetrical pillars (Traditional Black Lacquer / Urushi) */}
          <line
            x1="9.5"
            y1="8.5"
            x2="8.5"
            y2="27"
            stroke="#000000"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <line
            x1="22.5"
            y1="8.5"
            x2="23.5"
            y2="27"
            stroke="#000000"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Center symmetrical strut (Gakuzuka) */}
          <line
            x1="16"
            y1="8.5"
            x2="16"
            y2="12"
            stroke="#E50914"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Symmetrical Wordmark */}
      <div className="flex flex-col text-left">
        <div className="flex items-center space-x-1.5">
          <span className={`font-black font-display text-white uppercase leading-none ${textSizes}`}>
            ANISUME
          </span>
          {showKanji && (
            <span className="text-[10px] font-japanese font-black px-1.5 py-0.5 rounded bg-brand-red/20 text-brand-red border border-brand-red/40 leading-none">
              兄夢
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


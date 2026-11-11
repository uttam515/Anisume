import { Check, Film, Tv, Clock, Calendar, Layers } from 'lucide-react';
import type {
  AnimeFormatPreference,
  AnimeLengthPreference,
  AnimeEraPreference,
} from '@anisume/shared';

/**
 * 1. Genre Selector
 */
interface GenreSelectorProps {
  availableGenres: string[];
  selectedGenres: string[];
  onChange: (genres: string[]) => void;
}

export function GenreSelector({
  availableGenres,
  selectedGenres,
  onChange,
}: GenreSelectorProps) {
  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onChange(selectedGenres.filter((g) => g !== genre));
    } else {
      onChange([...selectedGenres, genre]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Select all genres that interest you ({selectedGenres.length} selected):</span>
        {selectedGenres.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-slate-400 hover:text-white transition-colors"
          >
            Clear selection
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {availableGenres.map((genre) => {
          const isSelected = selectedGenres.includes(genre);
          return (
            <button
              key={genre}
              type="button"
              onClick={() => toggleGenre(genre)}
              className={`px-3.5 py-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                isSelected
                  ? 'bg-brand-500/20 border-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'bg-dark-900 hover:bg-dark-850 border-dark-800 text-slate-300 hover:border-dark-700'
              }`}
            >
              <span className="truncate">{genre}</span>
              <div
                className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors shrink-0 ml-2 ${
                  isSelected ? 'bg-brand-500 text-white' : 'border border-dark-700 bg-dark-950'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 2. Format Selector
 */
interface FormatSelectorProps {
  selectedFormats: AnimeFormatPreference[];
  onChange: (formats: AnimeFormatPreference[]) => void;
}

export function FormatSelector({
  selectedFormats,
  onChange,
}: FormatSelectorProps) {
  const options: Array<{ id: AnimeFormatPreference; title: string; desc: string; icon: any }> = [
    {
      id: 'both',
      title: 'Both Formats (Default)',
      desc: 'Recommend both multi-episode TV series and feature films',
      icon: Layers,
    },
    {
      id: 'tv',
      title: 'TV Series Only',
      desc: 'Focus on episodic TV shows, seasons, and continuous story arcs',
      icon: Tv,
    },
    {
      id: 'movie',
      title: 'Movies Only',
      desc: 'Focus on self-contained feature films and theatrical releases',
      icon: Film,
    },
  ];

  return (
    <div className="space-y-3 max-w-xl mx-auto">
      {options.map((opt) => {
        const isSelected = selectedFormats.includes(opt.id);
        const Icon = opt.icon;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange([opt.id])}
            className={`w-full p-4 rounded-2xl border text-left flex items-start space-x-4 transition-all ${
              isSelected
                ? 'bg-brand-500/15 border-brand-500 shadow-xl shadow-brand-500/10'
                : 'bg-dark-900 hover:bg-dark-850 border-dark-800'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isSelected
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                  : 'bg-dark-850 text-slate-400 border border-dark-750'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">{opt.title}</h4>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    isSelected
                      ? 'bg-brand-500 text-white ring-4 ring-brand-500/20'
                      : 'border border-dark-700'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">{opt.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * 3. Length Selector
 */
interface LengthSelectorProps {
  selectedLength: AnimeLengthPreference[];
  onChange: (lengths: AnimeLengthPreference[]) => void;
}

export function LengthSelector({
  selectedLength,
  onChange,
}: LengthSelectorProps) {
  const options: Array<{ id: AnimeLengthPreference; title: string; count: string }> = [
    { id: 'any', title: 'Any Length', count: 'No preference' },
    { id: 'short', title: 'Short', count: '1–12 Episodes (or movies ≤90 min)' },
    { id: 'medium', title: 'Medium', count: '13–26 Episodes (or movies 90–140 min)' },
    { id: 'long', title: 'Long', count: '27–100 Episodes' },
    { id: 'very_long', title: 'Very Long', count: 'More than 100 Episodes' },
  ];

  const handleToggle = (id: AnimeLengthPreference) => {
    if (id === 'any') {
      onChange(['any']);
      return;
    }

    const withoutAny = selectedLength.filter((l) => l !== 'any');
    if (withoutAny.includes(id)) {
      const next = withoutAny.filter((l) => l !== id);
      onChange(next.length === 0 ? ['any'] : next);
    } else {
      onChange([...withoutAny, id]);
    }
  };

  return (
    <div className="space-y-3 max-w-xl mx-auto">
      {options.map((opt) => {
        const isSelected = selectedLength.includes(opt.id);

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => handleToggle(opt.id)}
            className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
              isSelected
                ? 'bg-brand-500/15 border-brand-500 shadow-md shadow-brand-500/15'
                : 'bg-dark-900 hover:bg-dark-850 border-dark-800'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Clock className={`w-4 h-4 ${isSelected ? 'text-brand-400' : 'text-slate-500'}`} />
              <div>
                <h4 className="text-xs font-bold text-white">{opt.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{opt.count}</p>
              </div>
            </div>

            <div
              className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-brand-500 text-white' : 'border border-dark-700 bg-dark-950'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * 4. Theme Selector
 */
interface ThemeSelectorProps {
  availableThemes: string[];
  selectedThemes: string[];
  onChange: (themes: string[]) => void;
}

export function ThemeSelector({
  availableThemes,
  selectedThemes,
  onChange,
}: ThemeSelectorProps) {
  const toggleTheme = (theme: string) => {
    if (selectedThemes.includes(theme)) {
      onChange(selectedThemes.filter((t) => t !== theme));
    } else {
      onChange([...selectedThemes, theme]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Select themes you enjoy ({selectedThemes.length} selected):</span>
        {selectedThemes.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-slate-400 hover:text-white transition-colors"
          >
            Clear selection
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {availableThemes.map((theme) => {
          const isSelected = selectedThemes.includes(theme);
          return (
            <button
              key={theme}
              type="button"
              onClick={() => toggleTheme(theme)}
              className={`px-3.5 py-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                isSelected
                  ? 'bg-brand-500/20 border-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'bg-dark-900 hover:bg-dark-850 border-dark-800 text-slate-300 hover:border-dark-700'
              }`}
            >
              <span className="truncate">{theme}</span>
              <div
                className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors shrink-0 ml-2 ${
                  isSelected ? 'bg-brand-500 text-white' : 'border border-dark-700 bg-dark-950'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 5. Era Selector
 */
interface EraSelectorProps {
  selectedEras: AnimeEraPreference[];
  onChange: (eras: AnimeEraPreference[]) => void;
}

export function EraSelector({
  selectedEras,
  onChange,
}: EraSelectorProps) {
  const options: Array<{ id: AnimeEraPreference; title: string; desc: string }> = [
    { id: 'any', title: 'No Preference', desc: 'Anime from all eras and decades' },
    { id: '2020_plus', title: 'Modern Era (2020+)', desc: 'Recent releases and current broadcast seasons' },
    { id: '2010_2019', title: '2010 – 2019', desc: 'The golden decade of modern digital animation' },
    { id: '2000_2009', title: '2000 – 2009', desc: '2000s classics and transition to digital' },
    { id: 'pre_2000', title: 'Classics (Before 2000)', desc: 'Cel-animated masterpieces and retro anime' },
  ];

  const handleToggle = (id: AnimeEraPreference) => {
    if (id === 'any') {
      onChange(['any']);
      return;
    }

    const withoutAny = selectedEras.filter((e) => e !== 'any');
    if (withoutAny.includes(id)) {
      const next = withoutAny.filter((e) => e !== id);
      onChange(next.length === 0 ? ['any'] : next);
    } else {
      onChange([...withoutAny, id]);
    }
  };

  return (
    <div className="space-y-3 max-w-xl mx-auto">
      {options.map((opt) => {
        const isSelected = selectedEras.includes(opt.id);

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => handleToggle(opt.id)}
            className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
              isSelected
                ? 'bg-brand-500/15 border-brand-500 shadow-md shadow-brand-500/15'
                : 'bg-dark-900 hover:bg-dark-850 border-dark-800'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Calendar className={`w-4 h-4 ${isSelected ? 'text-brand-400' : 'text-slate-500'}`} />
              <div>
                <h4 className="text-xs font-bold text-white">{opt.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</p>
              </div>
            </div>

            <div
              className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-brand-500 text-white' : 'border border-dark-700 bg-dark-950'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}


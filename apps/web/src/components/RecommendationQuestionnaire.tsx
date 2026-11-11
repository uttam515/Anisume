import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { recommendationClient } from '../api/recommendationClient';
import {
  GenreSelector,
  FormatSelector,
  LengthSelector,
  ThemeSelector,
  EraSelector,
} from './QuestionnaireStepSelectors';
import SpotifyAnimeSelector from './SpotifyAnimeSelector';
import type {
  AnimeFormatPreference,
  AnimeLengthPreference,
  AnimeEraPreference,
  Anime,
} from '@anisume/shared';

interface RecommendationQuestionnaireProps {
  onComplete?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export default function RecommendationQuestionnaire({
  onComplete,
  onCancel,
  isModal = false,
}: RecommendationQuestionnaireProps) {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Metadata from DB
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [availableThemes, setAvailableThemes] = useState<string[]>([]);
  const [starters, setStarters] = useState<Anime[]>([]);

  // Questionnaire responses
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [preferredFormats, setPreferredFormats] = useState<AnimeFormatPreference[]>(['both']);
  const [preferredLength, setPreferredLength] = useState<AnimeLengthPreference[]>(['any']);
  const [favoriteThemes, setFavoriteThemes] = useState<string[]>([]);
  const [preferredEras, setPreferredEras] = useState<AnimeEraPreference[]>(['any']);
  const [favoriteAnimeIds, setFavoriteAnimeIds] = useState<number[]>([]);

  // Load existing preferences and DB metadata
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      recommendationClient.getMetadata(),
      recommendationClient.getPreferences().catch(() => null),
    ])
      .then(([metadata, userPrefs]) => {
        if (!mounted) return;
        setAvailableGenres(metadata.genres || []);
        setAvailableThemes(metadata.themes || []);
        setStarters(metadata.starters || []);

        if (userPrefs) {
          if (userPrefs.favoriteGenres?.length) setFavoriteGenres(userPrefs.favoriteGenres);
          if (userPrefs.preferredFormats?.length) setPreferredFormats(userPrefs.preferredFormats);
          if (userPrefs.preferredLength?.length) setPreferredLength(userPrefs.preferredLength);
          if (userPrefs.favoriteThemes?.length) setFavoriteThemes(userPrefs.favoriteThemes);
          if (userPrefs.preferredEras?.length) setPreferredEras(userPrefs.preferredEras);
          if (userPrefs.favoriteAnimeIds?.length) setFavoriteAnimeIds(userPrefs.favoriteAnimeIds);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Failed to load questionnaire data');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const totalSteps = 6;
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  const saveCurrentProgress = async (completed = false) => {
    setSaving(true);
    setError(null);
    try {
      await recommendationClient.updatePreferences({
        favoriteGenres,
        preferredFormats,
        preferredLength,
        favoriteThemes,
        preferredEras,
        favoriteAnimeIds,
        questionnaireCompleted: completed,
      });

      if (completed) {
        if (onComplete) {
          onComplete();
        } else {
          navigate('/recommendations');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    try {
      await saveCurrentProgress(false);
      if (currentStep < totalSteps) {
        setCurrentStep((s) => s + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        await handleFinish();
      }
    } catch {
      // Error handled in saveCurrentProgress
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSkipQuestion = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkipAll = async () => {
    if (window.confirm('Skip the questionnaire for now? You can always complete or edit your preferences later from your profile.')) {
      await saveCurrentProgress(true); // Mark completed so user isn't prompted every visit
      if (onCancel) {
        onCancel();
      } else {
        navigate('/recommendations');
      }
    }
  };

  const handleFinish = async () => {
    await saveCurrentProgress(true);
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" />
        <p className="text-xs text-slate-400">Loading personalized taste questionnaire...</p>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-4xl mx-auto ${isModal ? '' : 'py-8 px-4 sm:px-6'}`}>
      <div className="bg-dark-900 border border-dark-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header & Progress */}
        <div className="p-6 border-b border-dark-800 bg-dark-950/60">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Anime Taste Questionnaire
                </h2>
                <p className="text-xs text-slate-400">
                  Step {currentStep} of {totalSteps} • Personalized Recommendation Engine V1
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSkipAll}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-dark-800 transition"
            >
              Skip Questionnaire
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-dark-850 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-brand-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-2.5 text-xs text-rose-400">
            {error}
          </div>
        )}

        {/* Step Body */}
        <div className="p-6 sm:p-8 flex-1">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">What anime genres do you enjoy?</h3>
                <p className="text-xs text-slate-400">
                  Pick as many as you like. We use actual genres from our database to score recommendations.
                </p>
              </div>
              <GenreSelector
                availableGenres={availableGenres}
                selectedGenres={favoriteGenres}
                onChange={setFavoriteGenres}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">What format do you prefer?</h3>
                <p className="text-xs text-slate-400">
                  Choose whether you are looking for TV anime series, feature films, or both.
                </p>
              </div>
              <FormatSelector
                selectedFormats={preferredFormats}
                onChange={setPreferredFormats}
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">What anime length fits your schedule?</h3>
                <p className="text-xs text-slate-400">
                  Select your ideal episode count or duration. You can select multiple or "Any Length".
                </p>
              </div>
              <LengthSelector
                selectedLength={preferredLength}
                onChange={setPreferredLength}
              />
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Which anime themes appeal to you?</h3>
                <p className="text-xs text-slate-400">
                  Themes capture the specific storylines, world settings, and subgenres you love.
                </p>
              </div>
              <ThemeSelector
                availableThemes={availableThemes}
                selectedThemes={favoriteThemes}
                onChange={setFavoriteThemes}
              />
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Do you have a preferred release era?</h3>
                <p className="text-xs text-slate-400">
                  Whether you love retro classics or the latest broadcast seasons, let us know!
                </p>
              </div>
              <EraSelector
                selectedEras={preferredEras}
                onChange={setPreferredEras}
              />
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>Spotify-Style Taste Selection: Pick Your Favorites</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Click on anime you love. Notice how each title expands new branches of similar titles! Select 5–15 titles to seed your taste.
                </p>
              </div>
              <SpotifyAnimeSelector
                selectedIds={favoriteAnimeIds}
                onChange={setFavoriteAnimeIds}
                starters={starters}
              />
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-dark-950/70 border-t border-dark-800 flex items-center justify-between">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-dark-850 hover:bg-dark-800 border border-dark-750 flex items-center space-x-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            ) : (
              <div />
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleSkipQuestion}
              disabled={saving}
              className="text-xs text-slate-400 hover:text-white px-3 py-2 transition"
            >
              Skip this question
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/25 flex items-center space-x-2 transition"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : currentStep === totalSteps ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Generate Recommendations</span>
                </>
              ) : (
                <>
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

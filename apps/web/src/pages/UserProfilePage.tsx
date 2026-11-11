import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { authApi } from '../api/authClient.js';
import { api, type GenreItem } from '../api/client.js';
import type { PublicUserProfile } from '@anisume/shared';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  X,
  LogOut,
  Mail,
  Heart,
  Flame,
} from 'lucide-react';

export default function UserProfilePage() {
  const { username: paramUsername } = useParams<{ username?: string }>();
  const { user: currentUser, logout, updateProfile } = useAuth();

  // If visiting /profile or visiting own username
  const isOwnProfile =
    !paramUsername || (currentUser && paramUsername.toLowerCase() === currentUser.username.toLowerCase());

  const [publicUser, setPublicUser] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [avatarInput, setAvatarInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [allGenres, setAllGenres] = useState<GenreItem[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load public profile if viewing someone else
  useEffect(() => {
    if (isOwnProfile) {
      if (currentUser) {
        setAvatarInput(currentUser.avatar || '');
        setBioInput(currentUser.bio || '');
        setSelectedGenres(currentUser.favoriteGenres || []);
      }
      setLoading(false);
    } else if (paramUsername) {
      setLoading(true);
      setError(null);
      authApi
        .getPublicProfile(paramUsername)
        .then((res) => {
          setPublicUser(res.user);
        })
        .catch((err) => {
          setError(err.message || 'User not found');
        })
        .finally(() => setLoading(false));
    }
  }, [isOwnProfile, paramUsername, currentUser]);

  // Load all available genres for favorite selection
  useEffect(() => {
    if (isOwnProfile) {
      api.getGenres().then(setAllGenres).catch(() => { });
    }
  }, [isOwnProfile]);

  const handleSave = async () => {
    setSaveLoading(true);
    setSaveMessage(null);
    setError(null);

    try {
      await updateProfile({
        avatar: avatarInput.trim() || null,
        bio: bioInput.trim(),
        favoriteGenres: selectedGenres,
      });
      setIsEditing(false);
      setSaveMessage('Profile and genre preferences updated successfully!');
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleToggleGenre = (name: string) => {
    if (selectedGenres.includes(name)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== name));
    } else {
      setSelectedGenres([...selectedGenres, name]);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-44 bg-[#171D1B] rounded-3xl" />
        <div className="h-64 bg-[#171D1B] rounded-2xl" />
      </div>
    );
  }

  if (error && !isOwnProfile) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-[#171D1B] border border-[#202825] rounded-3xl text-center shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-brand-600/15 border border-brand-500/30 text-brand-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#F3F0E8] mb-2 font-display uppercase">User Not Found</h2>
        <p className="text-xs text-[#A6A49F] mb-6">{error}</p>
        <Link
          to="/discover"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition"
        >
          <span>Discover Anime</span>
        </Link>
      </div>
    );
  }

  const profileData = isOwnProfile ? currentUser : publicUser;
  if (!profileData) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {saveMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-brand-emerald/10 border border-brand-emerald/30 text-brand-emerald text-xs flex items-center space-x-2 shadow-lg font-bold">
          <CheckCircle2 className="w-4 h-4 text-brand-emerald shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-brand-ink border border-dark-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 relative z-10">
          {/* Avatar display */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-dark-950 border-2 border-emerald-500/40 shrink-0 shadow-lg flex items-center justify-center">
            {profileData.avatar ? (
              <img
                src={profileData.avatar}
                alt={profileData.username}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-600 to-violet-600 text-white font-black text-3xl uppercase">
                {profileData.username.charAt(0)}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#F3F0E8] font-display uppercase tracking-wide flex items-center justify-center sm:justify-start space-x-2">
                  <span>{profileData.username}</span>
                  {isOwnProfile && currentUser?.isEmailVerified && (
                    <span
                      title="Verified Anime Explorer"
                      className="inline-flex items-center text-accent-emerald"
                    >
                      <CheckCircle2 className="w-5 h-5 fill-accent-emerald/10" />
                    </span>
                  )}
                </h1>

                {isOwnProfile && currentUser && (
                  <p className="text-xs text-[#A6A49F] mt-1 flex items-center justify-center sm:justify-start space-x-1.5 font-sans">
                    <Mail className="w-3.5 h-3.5 text-[#646A67]" />
                    <span>{currentUser.email}</span>
                    <span
                      className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${currentUser.isEmailVerified
                        ? 'bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30'
                        : 'bg-[#F4C95D]/15 text-[#F4C95D] border border-[#F4C95D]/30'
                        }`}
                    >
                      {currentUser.isEmailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </p>
                )}
              </div>

              {/* Action buttons */}
              {isOwnProfile && (
                <div className="flex items-center justify-center sm:justify-end space-x-2 pt-2 sm:pt-0">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#202825] hover:bg-[#101313] text-[#F3F0E8] text-xs font-bold uppercase tracking-wider border border-[#202825] transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#202825] hover:bg-[#101313] text-[#A6A49F] text-xs font-bold uppercase tracking-wider border border-[#202825] transition"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}

                  <button
                    onClick={logout}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-brand-600/15 hover:bg-brand-600/25 text-brand-400 text-xs font-bold uppercase tracking-wider border border-brand-500/30 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bio */}
            <p className="text-sm text-[#F3F0E8]/90 mt-4 leading-relaxed max-w-xl font-sans">
              {profileData.bio || (
                <span className="text-[#646A67] italic">No bio provided yet.</span>
              )}
            </p>

            <div className="flex items-center justify-center sm:justify-start space-x-4 mt-5 text-xs text-[#A6A49F] border-t border-[#202825] pt-4">
              <span className="flex items-center space-x-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Member since{' '}
                  {new Date(profileData.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Editing Mode Section */}
      {isOwnProfile && isEditing && (
        <div className="bg-[#171D1B] border border-[#202825] rounded-3xl p-6 sm:p-8 shadow-card-depth mb-8 space-y-6">
          <h2 className="text-lg font-black text-[#F3F0E8] font-display uppercase tracking-wide flex items-center space-x-2">
            <Edit3 className="w-5 h-5 text-brand-400" />
            <span>Customize Profile & Preferences</span>
          </h2>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#A6A49F] mb-1.5">
              Avatar Image URL
            </label>
            <input
              type="url"
              value={avatarInput}
              onChange={(e) => setAvatarInput(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-2.5 rounded-xl bg-[#101313] border border-[#202825] text-[#F3F0E8] text-xs placeholder-[#646A67] focus:outline-none focus:border-brand-500 transition-colors font-sans"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#A6A49F]">Bio</label>
              <span className="text-[11px] text-[#646A67]">{bioInput.length} / 500</span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              placeholder="Tell others about your favorite anime, tropes, or taste..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#101313] border border-[#202825] text-[#F3F0E8] text-xs placeholder-[#646A67] focus:outline-none focus:border-brand-500 transition-colors font-sans"
            />
          </div>

          {/* Favorite Anime Genres Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#A6A49F] flex items-center space-x-1.5">
                <Heart className="w-3.5 h-3.5 text-brand-400" />
                <span>Favorite Anime Genres (for future recommendations)</span>
              </label>
              <span className="text-[11px] text-brand-400 font-bold">
                {selectedGenres.length} selected
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-3 bg-[#101313] rounded-2xl border border-[#202825]">
              {allGenres.map((g) => {
                const isSelected = selectedGenres.includes(g.name);
                return (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() => handleToggleGenre(g.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-600/20 font-bold'
                        : 'bg-dark-900 border-dark-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#202825]">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-[#A6A49F] hover:text-[#F3F0E8]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saveLoading}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition disabled:opacity-50"
            >
              {saveLoading ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Favorite Genres Display Showcase */}
      <div className="bg-[#171D1B] border border-[#202825] rounded-3xl p-6 sm:p-8 shadow-card-depth">
        <h2 className="text-sm font-bold text-[#F3F0E8] uppercase tracking-wider flex items-center space-x-2 mb-4 font-display">
          <Heart className="w-4 h-4 text-rose-400" />
          <span>Favorite Genres Showcase</span>
        </h2>

        {profileData.favoriteGenres && profileData.favoriteGenres.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profileData.favoriteGenres.map((genre) => (
              <Link
                key={genre}
                to={`/discover?genres=${encodeURIComponent(genre)}`}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-200 hover:text-white text-xs font-bold border border-dark-750 hover:border-emerald-500/40 transition-colors"
              >
                <Flame className="w-3 h-3 text-brand-yellow" />
                <span>{genre}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#646A67] italic">
            {isOwnProfile
              ? 'You have not chosen any favorite genres yet. Click "Edit Profile" above to pick your favorites!'
              : 'This user has not selected any favorite genres yet.'}
          </p>
        )}
      </div>

      {/* Personalized Taste & Recommendation Card */}
      {isOwnProfile && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-dark-900 to-dark-900 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#F3F0E8] uppercase tracking-wider flex items-center space-x-2 font-display">
              <Flame className="w-4 h-4 text-brand-yellow" />
              <span>Personalized Recommendation Engine</span>
            </h3>
            <p className="text-xs text-[#A6A49F] max-w-xl font-sans">
              Calibrate your taste questionnaire, preferred length, franchise watch orders, and seed preferences.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <Link
              to="/questionnaire"
              className="px-4 py-2 rounded-xl bg-[#202825] hover:bg-[#101313] text-[#F3F0E8] text-xs font-bold uppercase tracking-wider border border-[#202825] transition"
            >
              Edit Questionnaire
            </Link>
            <Link
              to="/recommendations"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition"
            >
              View Recommendations
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

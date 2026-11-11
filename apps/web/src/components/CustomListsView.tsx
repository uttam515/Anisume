import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderPlus,
  Plus,
  Trash2,
  ChevronLeft,
  Loader2,
  Layers,
  BookOpen,
  Film,
  Star,
} from 'lucide-react';
import { customListClient } from '../api/customListClient';
import type { CustomList } from '@anisume/shared';

export default function CustomListsView() {
  const [lists, setLists] = useState<CustomList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [activeListDetails, setActiveListDetails] = useState<CustomList | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadLists = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const data = await customListClient.getLists();
      setLists(data);
    } catch (err: any) {
      setActionError(err.message || 'Failed to load personal custom lists');
    } finally {
      setLoading(false);
    }
  };

  const loadListDetails = async (id: string) => {
    setDetailsLoading(true);
    setActionError(null);
    try {
      const data = await customListClient.getListDetails(id);
      setActiveListDetails(data);
    } catch (err: any) {
      setActionError(err.message || 'Failed to load list details');
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    loadLists();
  }, []);

  useEffect(() => {
    if (activeListId) {
      loadListDetails(activeListId);
    } else {
      setActiveListDetails(null);
    }
  }, [activeListId]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim() || creating) return;

    setCreating(true);
    setActionError(null);
    try {
      const created = await customListClient.createList({
        name: newListName.trim(),
        description: newListDesc.trim(),
      });
      setLists((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setNewListName('');
      setNewListDesc('');
      setActiveListId(created._id);
    } catch (err: any) {
      setActionError(err.message || 'Failed to create list');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!window.confirm('Are you sure you want to delete this custom list?')) return;

    try {
      await customListClient.deleteList(listId);
      setLists((prev) => prev.filter((l) => l._id !== listId));
      if (activeListId === listId) {
        setActiveListId(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete custom list');
    }
  };

  const handleRemoveAnime = async (malId: number) => {
    if (!activeListId) return;

    try {
      await customListClient.removeAnimeFromList(activeListId, malId);
      setActiveListDetails((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          entriesCount: Math.max(0, prev.entriesCount - 1),
          entries: (prev.entries || []).filter((e) => e.mal_id !== malId),
        };
      });
      // Update count in lists overview
      setLists((prev) =>
        prev.map((l) =>
          l._id === activeListId ? { ...l, entriesCount: Math.max(0, l.entriesCount - 1) } : l
        )
      );
    } catch (err: any) {
      alert(err.message || 'Failed to remove anime from list');
    }
  };

  // If viewing a specific custom list
  if (activeListId && activeListDetails) {
    return (
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-dark-900 border border-dark-800 p-6 rounded-2xl">
          <div className="space-y-1">
            <button
              onClick={() => setActiveListId(null)}
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center space-x-1 mb-2 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to all custom lists</span>
            </button>
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <span>{activeListDetails.name}</span>
            </h2>
            {activeListDetails.description && (
              <p className="text-xs text-slate-400">{activeListDetails.description}</p>
            )}
            <div className="text-[11px] text-slate-500 pt-1">
              {activeListDetails.entriesCount} {activeListDetails.entriesCount === 1 ? 'anime' : 'anime titles'} in this list
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleDeleteList(activeListId)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 flex items-center space-x-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete List</span>
            </button>
          </div>
        </div>

        {/* Anime Items Grid */}
        {detailsLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" />
            <p className="text-xs text-slate-400 mt-2">Loading list items...</p>
          </div>
        ) : !activeListDetails.entries || activeListDetails.entries.length === 0 ? (
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-12 text-center space-y-4">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-slate-200">This custom list is empty</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Browse anime on Anisume and click "Add to Custom List..." on any anime details page to add titles here.
              </p>
            </div>
            <Link
              to="/discover"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition shadow-md shadow-brand-600/20"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Explore Anime</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {activeListDetails.entries.map((item) => (
              <div
                key={item.mal_id}
                className="group relative bg-dark-900 border border-dark-800 rounded-xl overflow-hidden hover:border-brand-500/40 transition-all flex flex-col"
              >
                <div className="aspect-[2/3] relative overflow-hidden bg-dark-950">
                  <img
                    src={item.image_url || '/placeholder.png'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <button
                    onClick={() => handleRemoveAnime(item.mal_id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/70 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
                    title="Remove from list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {item.score && (
                    <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm border border-white/10 text-[10px] font-bold text-amber-400 flex items-center space-x-1">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>{item.score.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between">
                  <Link
                    to={`/anime/${item.mal_id}`}
                    className="text-xs font-semibold text-slate-200 hover:text-brand-300 line-clamp-2 transition-colors"
                  >
                    {item.title}
                  </Link>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-dark-800/80 mt-2">
                    <span>{item.type}</span>
                    <span>{item.episodes ? `${item.episodes} eps` : 'Ongoing'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Overview of all custom lists
  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-dark-900 border border-dark-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Personal Custom Lists</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize anime into custom collections (e.g. "Favorites", "Peak Fiction", "Seasonal Rewatches").
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New List</span>
        </button>
      </div>

      {actionError && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-xs text-rose-400">
          {actionError}
        </div>
      )}

      {/* Lists Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-400" />
          <p className="text-xs text-slate-400 mt-2">Loading your custom lists...</p>
        </div>
      ) : lists.length === 0 ? (
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-12 text-center space-y-4">
          <FolderPlus className="w-12 h-12 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-200">No custom lists created yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Create your first personal list to curate custom collections of your favorite anime.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition shadow-md shadow-brand-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create List</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <div
              key={list._id}
              onClick={() => setActiveListId(list._id)}
              className="group bg-dark-900 border border-dark-800 hover:border-brand-500/50 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:shadow-brand-500/5 flex flex-col justify-between"
            >
              <div>
                {/* 4-Poster collage preview */}
                <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-dark-950 mb-4 border border-dark-800 grid grid-cols-4 gap-0.5">
                  {list.previewImages && list.previewImages.length > 0 ? (
                    list.previewImages.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ))
                  ) : (
                    <div className="col-span-4 flex items-center justify-center text-slate-600 text-xs font-medium">
                      Empty List
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                    {list.name}
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400 bg-dark-850 px-2.5 py-0.5 rounded-full border border-dark-750 shrink-0">
                    {list.entriesCount} {list.entriesCount === 1 ? 'title' : 'titles'}
                  </span>
                </div>

                {list.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1.5">
                    {list.description}
                  </p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-dark-800 flex items-center justify-between text-xs text-slate-500">
                <span>Updated recently</span>
                <span className="text-brand-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center space-x-1">
                  <span>Open List</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-dark-900 border border-dark-750 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <FolderPlus className="w-4 h-4 text-brand-400" />
                <span>Create New Custom List</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  List Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masterpieces, Top 10 Shounen..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-dark-950 border border-dark-750 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the theme or purpose of this list..."
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  maxLength={500}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-dark-950 border border-dark-750 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-dark-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newListName.trim()}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-brand-600/20 transition flex items-center space-x-1.5"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create List</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

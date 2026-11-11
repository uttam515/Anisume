import { useState, useEffect } from 'react';
import { X, Plus, Check, FolderPlus, Loader2, BookMarked } from 'lucide-react';
import { customListClient } from '../api/customListClient';
import type { CustomList } from '@anisume/shared';

interface AddToListModalProps {
  malId: number;
  animeTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddToListModal({
  malId,
  animeTitle,
  isOpen,
  onClose,
}: AddToListModalProps) {
  const [lists, setLists] = useState<CustomList[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);
    setError(null);
    setSuccessNotice(null);

    Promise.all([
      customListClient.getLists(),
      customListClient.checkAnimeInLists(malId),
    ])
      .then(([allLists, containingIds]) => {
        if (!mounted) return;
        setLists(allLists);
        setSelectedListIds(new Set(containingIds));
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Failed to load custom lists');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, malId]);

  if (!isOpen) return null;

  const handleToggleList = async (list: CustomList) => {
    if (togglingId) return;
    setTogglingId(list._id);
    setError(null);
    setSuccessNotice(null);

    const isInList = selectedListIds.has(list._id);

    try {
      if (isInList) {
        await customListClient.removeAnimeFromList(list._id, malId);
        setSelectedListIds((prev) => {
          const next = new Set(prev);
          next.delete(list._id);
          return next;
        });
        setSuccessNotice(`Removed from "${list.name}"`);
      } else {
        await customListClient.addAnimeToList(list._id, malId);
        setSelectedListIds((prev) => new Set(prev).add(list._id));
        setSuccessNotice(`Added to "${list.name}"!`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update custom list');
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateNewList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim() || creating) return;

    setCreating(true);
    setError(null);
    try {
      const created = await customListClient.createList({
        name: newListName.trim(),
      });

      // Automatically add this anime to the newly created list
      await customListClient.addAnimeToList(created._id, malId);

      setLists((prev) => [created, ...prev]);
      setSelectedListIds((prev) => new Set(prev).add(created._id));
      setNewListName('');
      setSuccessNotice(`Created "${created.name}" and added anime!`);
    } catch (err: any) {
      setError(err.message || 'Failed to create list');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-dark-900 border border-dark-750 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-dark-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <BookMarked className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Save to Custom List</h2>
              <p className="text-xs text-slate-400 truncate max-w-[260px]">{animeTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-dark-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notice */}
        {successNotice && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2 text-xs text-emerald-400 flex items-center space-x-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>{successNotice}</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-2 text-xs text-rose-400">
            {error}
          </div>
        )}

        {/* List of Custom Lists */}
        <div className="p-6 overflow-y-auto space-y-2 flex-1">
          {loading ? (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-400" />
              <p className="text-xs">Loading your personal lists...</p>
            </div>
          ) : lists.length === 0 ? (
            <div className="py-6 text-center text-slate-400 space-y-2 border border-dashed border-dark-800 rounded-xl p-4">
              <FolderPlus className="w-8 h-8 mx-auto text-slate-500" />
              <p className="text-sm font-semibold text-slate-300">No personal lists yet</p>
              <p className="text-xs text-slate-500">
                Create custom lists like "Favorites", "Peak Shounen", or "Rewatch Later" below.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Your Lists
              </p>
              {lists.map((list) => {
                const isSelected = selectedListIds.has(list._id);
                const isToggling = togglingId === list._id;

                return (
                  <button
                    key={list._id}
                    type="button"
                    onClick={() => handleToggleList(list)}
                    disabled={isToggling}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-brand-500/10 border-brand-500/40 text-white'
                        : 'bg-dark-850 hover:bg-dark-800 border-dark-750 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                            : 'border border-dark-700 bg-dark-900'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{list.name}</div>
                        {list.description && (
                          <div className="text-[11px] text-slate-500 truncate">{list.description}</div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center space-x-2 text-xs text-slate-500">
                      {isToggling && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />}
                      <span className="text-[11px] bg-dark-900 px-2 py-0.5 rounded-full border border-dark-800">
                        {list.entriesCount ?? 0} titles
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer: Create New List */}
        <div className="p-4 bg-dark-950/60 border-t border-dark-800">
          <form onSubmit={handleCreateNewList} className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
              <Plus className="w-3.5 h-3.5 text-brand-red" />
              <span>Create New Personal List</span>
            </p>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="e.g. Masterpieces, Top 10 Shounen..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                maxLength={100}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-dark-900 border border-dark-750 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
              <button
                type="submit"
                disabled={creating || !newListName.trim()}
                className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1 transition-colors shrink-0 shadow-lg shadow-brand-600/20"
              >
                {creating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


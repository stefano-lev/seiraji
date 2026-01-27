import { useEffect, useState, useMemo } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';

import { motion } from 'framer-motion';

import { defaultShows } from '@/data/shows';
import type { UserShowState } from '@/types/radio';
import { ShowCard } from '@/components/ShowCard';
import type { RadioShow } from '@/types/radio';

type SortMode = 'title' | 'host';

type EditableFieldProps = {
  label: string;
  value: React.ReactNode;
  isEditing: boolean;
  renderInput: () => React.ReactNode;
};

function EditableField({
  label,
  value,
  isEditing,
  renderInput,
}: EditableFieldProps) {
  return (
    <div className="mb-3">
      <label className="text-sm mb-1 block">{label}</label>
      {isEditing ? (
        renderInput()
      ) : (
        <div className="text-sm text-muted-foreground">{value}</div>
      )}
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('title');
  const [selectedShow, setSelectedShow] = useState<RadioShow | null>(null);
  const [editDraft, setEditDraft] = useState<RadioShow | null>(null);

  const isEditing = editDraft !== null;
  const showData = editDraft ?? selectedShow;

  const [shows, setShows] = useState<RadioShow[]>(() => {
    const stored = localStorage.getItem('shows');
    return stored ? JSON.parse(stored) : defaultShows;
  });

  useEffect(() => {
    localStorage.setItem('shows', JSON.stringify(shows));
  }, [shows]);

  const defaultState: UserShowState[] = [];

  const [userState, setUserState] = useState<UserShowState[]>(() => {
    const stored = localStorage.getItem('userState');
    return stored ? (JSON.parse(stored) as UserShowState[]) : defaultState;
  });

  useEffect(() => {
    localStorage.setItem('userState', JSON.stringify(userState));
  }, [userState]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    UserShowState['status'] | 'all'
  >('all');

  function updateShowState(updated: UserShowState) {
    setUserState((prev) =>
      prev.some((s) => s.showId === updated.showId)
        ? prev.map((s) => (s.showId === updated.showId ? updated : s))
        : [...prev, updated]
    );
  }

  function updateShow(updated: RadioShow) {
    setShows((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  function addShow(newShow: RadioShow) {
    setShows((prev) => [...prev, newShow]);
  }

  function deleteShow(id: string) {
    setShows((prev) => prev.filter((s) => s.id !== id));
  }

  const visibleShows = useMemo(() => {
    return [...shows]
      .filter((show) => {
        const query = searchQuery.toLowerCase();

        const matchesSearch =
          show.title.toLowerCase().includes(query) ||
          show.hosts.some((h) => h.toLowerCase().includes(query));

        if (!matchesSearch) return false;

        if (statusFilter === 'all') return true;

        const state = userState.find((s) => s.showId === show.id);
        return state?.status === statusFilter;
      })
      .sort((a, b) =>
        sortMode === 'title'
          ? a.title.localeCompare(b.title, 'ja')
          : a.hosts[0].localeCompare(b.hosts[0], 'ja')
      );
  }, [shows, userState, sortMode, searchQuery, statusFilter]);

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center gap-6">
        {/* Dark mode toggle */}
        <Button
          className="self-end"
          onClick={(e) => {
            e.stopPropagation();
            setDark(!dark);
          }}
        >
          Toggle {dark ? 'Light' : 'Dark'}
        </Button>

        {/* Header card + Sort buttons */}
        <div className="flex flex-col md:flex-row items-center gap-4">
          <Card className="max-w-md rounded-2xl shadow-md bg-background/90 backdrop-blur-sm">
            <CardContent className="p-4 space-y-2">
              <h1 className="text-xl font-semibold">Seiyuu Radio Tracker</h1>
              <p className="text-sm text-muted-foreground">
                Your episodes, progress, & backlog in one place.
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              variant={sortMode === 'title' ? 'default' : 'secondary'}
              onClick={(e) => {
                e.stopPropagation();
                setSortMode('title');
              }}
            >
              Sort by Title
            </Button>

            <Button
              variant={sortMode === 'host' ? 'default' : 'secondary'}
              onClick={(e) => {
                e.stopPropagation();
                setSortMode('host');
              }}
            >
              Sort by Host
            </Button>

            <Button
              onClick={() => {
                const newShow: RadioShow = {
                  id: crypto.randomUUID(),
                  title: 'New Show',
                  hosts: ['Unknown'],
                  startDate: '',
                  frequency: 'weekly',
                  bannerUrl: '',
                  totalEpisodes: 0,
                };
                addShow(newShow);
                setSelectedShow(newShow);
                setEditDraft(newShow);
              }}
            >
              + Add Show
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search shows..."
            className="rounded-md border p-2 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="rounded-md border p-2 bg-background"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as typeof statusFilter)
            }
          >
            <option value="all">All</option>
            <option value="listening">Listening</option>
            <option value="backlog">Backlog</option>
            <option value="completed">Completed</option>
            <option value="dropped">Dropped</option>
          </select>
        </div>

        {/* Sorting indicator */}
        <p className="text-sm text-muted-foreground">
          Sorted by {sortMode === 'title' ? 'Title' : 'Host'}
        </p>

        {/* Show cards */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl w-full">
          {visibleShows.map((show) => (
            <ShowCard
              show={show}
              userState={userState.find((s) => s.showId === show.id)}
              onUpdate={updateShowState}
              onOpen={(show) => {
                setEditDraft(null);
                setSelectedShow(show);
              }}
              onEdit={(show) => {
                setEditDraft(show);
                setSelectedShow(show);
              }}
            />
          ))}
        </div>

        {selectedShow && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedShow(null);
            }}
          >
            <motion.div
              className="max-w-lg w-full rounded-2xl bg-background p-6 shadow-xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <>
                <h2 className="text-xl font-semibold mb-4">
                  {showData!.title}
                </h2>

                <EditableField
                  label="Title"
                  value={showData!.title}
                  isEditing={isEditing}
                  renderInput={() => (
                    <input
                      className="w-full rounded-md border p-2 bg-background/90 text-foreground"
                      value={editDraft!.title}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft!, title: e.target.value })
                      }
                    />
                  )}
                />

                <EditableField
                  label="Hosts"
                  value={showData!.hosts.join(', ')}
                  isEditing={isEditing}
                  renderInput={() => (
                    <input
                      className="w-full rounded-md border p-2 bg-background/90 text-foreground"
                      value={editDraft!.hosts.join(', ')}
                      onChange={(e) =>
                        setEditDraft({
                          ...editDraft!,
                          hosts: e.target.value.split(',').map((h) => h.trim()),
                        })
                      }
                    />
                  )}
                />

                <EditableField
                  label="Start Date"
                  value={showData!.startDate || '—'}
                  isEditing={isEditing}
                  renderInput={() => (
                    <input
                      className="w-full rounded-md border p-2 bg-background/90 text-foreground"
                      value={editDraft!.startDate}
                      onChange={(e) =>
                        setEditDraft({
                          ...editDraft!,
                          startDate: e.target.value,
                        })
                      }
                    />
                  )}
                />

                <EditableField
                  label="Frequency"
                  value={showData!.frequency}
                  isEditing={isEditing}
                  renderInput={() => (
                    <select
                      className="w-full rounded-md border p-2 bg-background/90 text-foreground"
                      value={editDraft!.frequency}
                      onChange={(e) =>
                        setEditDraft({
                          ...editDraft!,
                          frequency: e.target.value as RadioShow['frequency'],
                        })
                      }
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Biweekly</option>
                      <option value="irregular">Irregular</option>
                    </select>
                  )}
                />

                <EditableField
                  label="Total Episodes"
                  value={showData!.totalEpisodes}
                  isEditing={isEditing}
                  renderInput={() => (
                    <input
                      type="number"
                      className="w-full rounded-md border p-2 bg-background/90 text-foreground"
                      value={editDraft!.totalEpisodes}
                      onChange={(e) =>
                        setEditDraft({
                          ...editDraft!,
                          totalEpisodes: Number(e.target.value),
                        })
                      }
                    />
                  )}
                />
              </>

              <div className="mt-6 flex justify-end gap-2">
                {isEditing ? (
                  <>
                    <button
                      className="px-4 py-2 rounded-md bg-secondary"
                      onClick={() => {
                        const confirmed = window.confirm(
                          `Delete "${selectedShow!.title}"?\nThis cannot be undone.`
                        );

                        if (!confirmed) return;

                        deleteShow(selectedShow!.id);
                        setEditDraft(null);
                        setSelectedShow(null);
                      }}
                    >
                      Delete
                    </button>
                    <button
                      className="px-4 py-2 rounded-md bg-secondary"
                      onClick={() => {
                        updateShow(editDraft!);
                        setEditDraft(null);
                      }}
                    >
                      Save
                    </button>

                    <button
                      className="px-4 py-2 rounded-md bg-muted"
                      onClick={() => setEditDraft(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="px-4 py-2 rounded-md bg-secondary"
                    onClick={() => setSelectedShow(null)}
                  >
                    Close
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

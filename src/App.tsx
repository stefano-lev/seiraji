import { useEffect, useState, useMemo } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';

import { motion } from 'framer-motion';

import { shows } from '@/data/shows';
import type { UserShowState } from '@/types/radio';
import { ShowCard } from '@/components/ShowCard';
import type { RadioShow } from '@/types/radio';

type SortMode = 'title' | 'host';

export default function App() {
  const [dark, setDark] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('title');
  const [selectedShow, setSelectedShow] = useState<RadioShow | null>(null);

  const sortedShows = useMemo(() => {
    return [...shows].sort((a, b) =>
      sortMode === 'title'
        ? a.title.localeCompare(b.title, 'ja')
        : a.hosts[0].localeCompare(b.hosts[0], 'ja')
    );
  }, [sortMode]);

  const defaultState: UserShowState[] = [];

  const [userState, setUserState] = useState<UserShowState[]>(() => {
    const stored = localStorage.getItem('userState');
    return stored ? (JSON.parse(stored) as UserShowState[]) : defaultState;
  });

  useEffect(() => {
    localStorage.setItem('userState', JSON.stringify(userState));
  }, [userState]);

  function updateShowState(updated: UserShowState) {
    setUserState((prev) =>
      prev.some((s) => s.showId === updated.showId)
        ? prev.map((s) => (s.showId === updated.showId ? updated : s))
        : [...prev, updated]
    );
  }

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

          {/* Sort buttons next to header on larger screens */}
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
          </div>
        </div>

        {/* Sorting indicator */}
        <p className="text-sm text-muted-foreground">
          Sorted by {sortMode === 'title' ? 'Title' : 'Host'}
        </p>

        {/* Show cards */}
        <motion.div
          layout
          className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl w-full"
        >
          {sortedShows.map((show) => (
            <motion.div key={show.id} layout>
              <ShowCard
                show={show}
                userState={userState.find((s) => s.showId === show.id)}
                onUpdate={updateShowState}
                onOpen={setSelectedShow}
              />
            </motion.div>
          ))}

          {selectedShow && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
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
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-semibold">{selectedShow.title}</h2>

                <p className="text-sm text-muted-foreground mb-4">
                  {selectedShow.hosts.join(', ')}
                </p>

                <div className="space-y-2 text-sm">
                  <p>Start date: {selectedShow.startDate}</p>
                  <p>Frequency: {selectedShow.frequency}</p>
                  <p>Total episodes: {selectedShow.totalEpisodes}</p>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    className="rounded-md px-4 py-2 bg-secondary hover:bg-secondary/80 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShow(null);
                    }}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

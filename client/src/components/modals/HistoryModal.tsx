import { motion } from 'framer-motion';

import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

import type { ActivityEvent } from '@/lib/storage';
import type { Program } from '@/types/media';

type HistoryModalProps = {
  open: boolean;
  onClose: () => void;

  history: ActivityEvent[];
  programs: Program[];

  now: number;

  timeAgo: (iso: string, nowMs: number) => string;

  onClearHistory: () => void;
};

export function HistoryModal({
  open,
  onClose,
  history,
  programs,
  now,
  timeAgo,
  onClearHistory,
}: HistoryModalProps) {
  if (!open) return null;

  const sortedHistory = [...history];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      onClick={onClose}
    >
      <motion.div
        className="
          w-full max-w-5xl
          h-[85vh]
          rounded-3xl
          border border-border/60
          bg-background
          shadow-2xl
          overflow-hidden
          flex flex-col
        "
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="border-b border-border/60 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">History</h2>

              <p className="text-sm text-muted-foreground mt-1">
                Recent listening activity
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  const ok = window.confirm(
                    'Clear your activity history?\n(This cannot be undone.)'
                  );

                  if (!ok) return;

                  onClearHistory();
                }}
              >
                Clear
              </Button>

              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          {sortedHistory.length === 0 ? (
            <div className="text-sm text-muted-foreground">No activity yet</div>
          ) : (
            <div className="space-y-4">
              {sortedHistory.map((ev) => {
                const program = programs.find((p) => p.id === ev.programId);

                if (!program) return null;

                const episode = program.episodes.find(
                  (e, i) => i + 1 === ev.episode
                );

                const deltaPositive = ev.delta > 0;

                const isCompleted = ev.episode >= program.episodes.length;

                return (
                  <div
                    key={ev.id}
                    className="
                      rounded-2xl
                      border border-border/60
                      p-4
                      hover:bg-muted/30
                      transition-colors
                    "
                  >
                    <div className="flex gap-4">
                      <img
                        src={
                          episode?.thumbnail ??
                          program.program.thumbnail ??
                          '/placeholders/show-placeholder.png'
                        }
                        className="
                          w-32 h-20
                          rounded-xl
                          object-cover
                          bg-muted
                          shrink-0
                        "
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium leading-snug">
                                {episode?.title ?? `Episode ${ev.episode}`}
                              </h3>

                              <Badge variant="secondary">
                                {program.platform}
                              </Badge>

                              <Badge
                                variant="outline"
                                className={
                                  deltaPositive
                                    ? 'text-green-400 border-green-500/30'
                                    : 'text-red-400 border-red-500/30'
                                }
                              >
                                {deltaPositive ? `+${ev.delta}` : ev.delta}
                              </Badge>

                              {isCompleted && (
                                <Badge className="bg-green-500/15 text-green-400 border border-green-500/30">
                                  Completed
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground mt-1">
                              {program.program.title}
                            </p>

                            <p className="text-xs text-muted-foreground mt-1">
                              {timeAgo(ev.ts, now)}
                            </p>
                          </div>

                          {episode?.durationSeconds && (
                            <Badge variant="outline">
                              {Math.floor(episode.durationSeconds / 60)}m
                            </Badge>
                          )}
                        </div>

                        {episode?.description && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                            {episode.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Badge variant="outline">Episode {ev.episode}</Badge>

                          {episode?.publishedAt && (
                            <Badge variant="outline">
                              {new Date(
                                episode.publishedAt
                              ).toLocaleDateString()}
                            </Badge>
                          )}

                          {episode?.tags?.slice(0, 4).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

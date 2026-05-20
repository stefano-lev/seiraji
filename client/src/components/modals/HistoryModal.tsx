import { Button } from '../ui/button';
import { motion } from 'framer-motion';

import type { ActivityEvent } from '@/lib/storage';

type HistoryModalProps = {
  open: boolean;
  onClose: () => void;

  history: ActivityEvent[];

  now: number;

  getShowTitle: (programId: string) => string;

  timeAgo: (iso: string, nowMs: number) => string;

  onClearHistory: () => void;
};

export function HistoryModal({
  open,
  onClose,
  history,
  now,
  getShowTitle,
  timeAgo,
  onClearHistory,
}: HistoryModalProps) {
  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="max-w-lg w-full rounded-2xl bg-background p-6 shadow-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">History</h2>

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
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet</p>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
            {history.map((ev) => {
              if (ev.type !== 'episode_progress') return null;

              const title = getShowTitle(ev.programId);

              const deltaLabel = ev.delta > 0 ? `+${ev.delta}` : `${ev.delta}`;

              return (
                <div
                  key={ev.id}
                  className="rounded-xl border border-border/60 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{title}</div>

                      <div className="text-sm text-muted-foreground">
                        Episode {ev.episode}
                        <span className="ml-2 font-medium text-foreground">
                          ({deltaLabel})
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {timeAgo(ev.ts, now)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

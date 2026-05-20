import { calculateStats } from '@/lib/stats';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';

type StatsModalProps = {
  open: boolean;
  onClose: () => void;

  stats: ReturnType<typeof calculateStats>;

  onDeleteAllTags: () => void;
  onDeleteAllData: () => void;
};

export function StatsModal({
  open,
  onClose,
  stats,
  onDeleteAllTags,
  onDeleteAllData,
}: StatsModalProps) {
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
        <h2 className="text-xl font-semibold mb-4">Stats</h2>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total programs</span>
            <span className="font-medium">{stats.totalPrograms}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Episodes listened</span>
            <span className="font-medium">{stats.totalEpisodesListened}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Approx time listened</span>
            <span className="font-medium">
              {Math.round(stats.totalListenedDuration / 3600)} hrs
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Completion (approx)</span>
            <span className="font-medium">{stats.completionPct}%</span>
          </div>

          <hr className="my-3 border-border/60" />

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border p-3">
              <div className="text-muted-foreground">Listening</div>
              <div className="text-lg font-semibold">
                {stats.statusCounts.listening}
              </div>
            </div>

            <div className="rounded-xl border p-3">
              <div className="text-muted-foreground">Backlog</div>
              <div className="text-lg font-semibold">
                {stats.statusCounts.backlog}
              </div>
            </div>

            <div className="rounded-xl border p-3">
              <div className="text-muted-foreground">Completed</div>
              <div className="text-lg font-semibold">
                {stats.statusCounts.completed}
              </div>
            </div>

            <div className="rounded-xl border p-3">
              <div className="text-muted-foreground">Dropped</div>
              <div className="text-lg font-semibold">
                {stats.statusCounts.dropped}
              </div>
            </div>
          </div>

          <hr className="my-3 border-border/60" />

          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Total Library Duration
            </span>

            <span className="font-medium">
              {Math.round(stats.totalLibraryDuration / 3600)} hrs
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Total Library Episode Count
            </span>

            <span className="font-medium">{stats.totalEpisodes}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="mt-6 flex justify-start">
            <details className="mt-4">
              <summary className="cursor-pointer text-red-600">
                ⚠️ Danger Zone ⚠️
              </summary>

              <Button
                className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                onClick={onDeleteAllTags}
              >
                Delete All Tags
              </Button>

              <Button
                className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                onClick={onDeleteAllData}
              >
                Delete All Data
              </Button>
            </details>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

import { motion } from 'framer-motion';

import {
  calculateProgramRuntime,
  getEpisodeDuration,
  calculateStats,
} from '@/lib/stats';
import type { Program } from '@/types/media';
import type { ActivityEvent } from '@/lib/storage';

import { Button } from '../ui/button';

type StatsModalProps = {
  open: boolean;
  onClose: () => void;

  stats: ReturnType<typeof calculateStats>;
  programs: Program[];
  activity: ActivityEvent[];

  onDeleteAllTags: () => void;
  onDeleteAllData: () => void;
};

export function StatsModal({
  open,
  onClose,
  stats,
  programs,
  activity,
  onDeleteAllTags,
  onDeleteAllData,
}: StatsModalProps) {
  if (!open) return null;

  const recentDays = buildRecentDailyStats(programs, activity, 7);
  const maxDailySeconds = Math.max(...recentDays.map((day) => day.seconds), 1);

  const topRuntimePrograms = [...programs]
    .map((program) => ({
      program,
      runtime: calculateProgramRuntime(program),
    }))
    .sort((a, b) => b.runtime - a.runtime)
    .slice(0, 5);

  const platformCounts = buildPlatformCounts(programs).slice(0, 6);

  const activeDays = recentDays.filter((day) => day.episodes > 0).length;

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
        className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl border border-border/60 bg-background shadow-2xl transform-gpu"
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border/60 px-6 py-5">
          <h2 className="text-xl font-semibold">Stats</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your listening progress, library size, and recent activity.
          </p>
        </div>

        <div className="max-h-[calc(85vh-140px)] overflow-y-auto p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Programs"
              value={stats.totalPrograms.toLocaleString()}
              detail={`${stats.statusCounts.listening} listening`}
            />

            <StatCard
              label="Episodes listened"
              value={stats.totalEpisodesListened.toLocaleString()}
              detail={`${stats.completionPct}% complete`}
            />

            <StatCard
              label="Time listened"
              value={formatDuration(stats.totalListenedDuration)}
              detail={`${formatDuration(stats.totalLibraryDuration)} total`}
            />

            <StatCard
              label="Active days"
              value={`${activeDays}/7`}
              detail="Based on recent progress"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <section className="rounded-2xl border border-border/60 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Recent activity</h3>
                  <p className="text-sm text-muted-foreground">
                    Episodes and time logged over the last 7 days.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {recentDays.map((day) => (
                  <div key={day.key}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-muted-foreground">{day.label}</span>
                      <span>
                        {day.episodes} ep · {formatDuration(day.seconds)}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.max(
                            4,
                            Math.round((day.seconds / maxDailySeconds) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border/60 p-4">
              <h3 className="font-semibold">Status breakdown</h3>
              <p className="text-sm text-muted-foreground">
                Current program states.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <StatusCard
                  label="Listening"
                  value={stats.statusCounts.listening}
                />
                <StatusCard
                  label="Backlog"
                  value={stats.statusCounts.backlog}
                />
                <StatusCard
                  label="Completed"
                  value={stats.statusCounts.completed}
                />
                <StatusCard
                  label="Dropped"
                  value={stats.statusCounts.dropped}
                />
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-border/60 p-4">
              <h3 className="font-semibold">Longest programs</h3>
              <p className="text-sm text-muted-foreground">
                Estimated runtime by known episode durations.
              </p>

              <div className="mt-4 space-y-3">
                {topRuntimePrograms.map(({ program, runtime }) => (
                  <div
                    key={program.id}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <span className="line-clamp-1">
                      {program.program.title}
                    </span>
                    <span className="shrink-0 font-medium">
                      {formatDuration(runtime)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border/60 p-4">
              <h3 className="font-semibold">Platform mix</h3>
              <p className="text-sm text-muted-foreground">
                Where your library comes from.
              </p>

              <div className="mt-4 space-y-3">
                {platformCounts.map((item) => (
                  <div key={item.platform}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{item.platform}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.round(
                            (item.count / Math.max(stats.totalPrograms, 1)) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <details className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
            <summary className="cursor-pointer text-sm font-medium text-red-500">
              Danger Zone
            </summary>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={onDeleteAllTags}
              >
                Delete All Tags
              </Button>

              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={onDeleteAllData}
              >
                Delete All Data
              </Button>
            </div>
          </details>
        </div>

        <div className="flex justify-end border-t border-border/60 px-6 py-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
    </div>
  );
}

function StatusCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function buildPlatformCounts(programs: Program[]) {
  const counts = new Map<string, number>();

  for (const program of programs) {
    counts.set(program.platform, (counts.get(program.platform) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);
}

function buildRecentDailyStats(
  programs: Program[],
  activity: ActivityEvent[],
  days: number
) {
  const programMap = new Map(programs.map((program) => [program.id, program]));

  const result = Array.from({ length: days }).map((_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1 - index));

    const key = date.toISOString().slice(0, 10);

    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      episodes: 0,
      seconds: 0,
    };
  });

  const resultMap = new Map(result.map((day) => [day.key, day]));

  for (const event of activity) {
    const key = new Date(event.ts).toISOString().slice(0, 10);
    const day = resultMap.get(key);

    if (!day) continue;
    if (event.delta <= 0) continue;

    const program = programMap.get(event.programId);

    if (!program) continue;

    day.episodes += event.delta;
    day.seconds += estimateActivityDuration(
      program,
      event.episode,
      event.delta
    );
  }

  return result;
}

function estimateActivityDuration(
  program: Program,
  nextEpisode: number,
  delta: number
) {
  const startIndex = Math.max(0, nextEpisode - delta);
  const endIndex = Math.min(program.episodes.length, nextEpisode);

  let seconds = 0;

  for (let i = startIndex; i < endIndex; i++) {
    seconds += getEpisodeDuration(program.episodes[i], program.platform);
  }

  return seconds;
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours <= 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

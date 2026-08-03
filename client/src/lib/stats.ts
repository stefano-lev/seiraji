import type { Episode, Program } from '@/types/media';
import type { UserProgramState } from '@/types/user';

const ONSEN_FALLBACK_DURATION = 45 * 60;

export function getEpisodeDuration(episode: Episode, platform?: string) {
  if (episode.durationSeconds) {
    return episode.durationSeconds;
  }

  if (platform === 'onsen') {
    return ONSEN_FALLBACK_DURATION;
  }

  return 0;
}

export function calculateStats(
  programs: Program[],
  userState: UserProgramState[]
) {
  let totalEpisodes = 0;
  let totalEpisodesListened = 0;

  let totalLibraryDuration = 0;
  let totalListenedDuration = 0;

  const statusCounts = {
    listening: 0,
    backlog: 0,
    completed: 0,
    dropped: 0,
  };

  for (const program of programs) {
    totalEpisodes += program.episodes.length;

    const state = userState.find((s) => s.programId === program.id);

    const status = state?.status ?? 'backlog';

    statusCounts[status]++;

    const listenedEpisodes = state?.lastListenedEpisode ?? 0;

    totalEpisodesListened += listenedEpisodes;

    for (const ep of program.episodes) {
      totalLibraryDuration += getEpisodeDuration(ep, program.platform);
    }

    for (let i = 0; i < listenedEpisodes; i++) {
      totalListenedDuration += getEpisodeDuration(
        program.episodes[i],
        program.platform
      );
    }
  }

  return {
    totalPrograms: programs.length,

    totalEpisodes,
    totalEpisodesListened,

    totalLibraryDuration,
    totalListenedDuration,

    statusCounts,

    completionPct:
      totalEpisodes > 0
        ? Math.round((totalEpisodesListened / totalEpisodes) * 100)
        : 0,
  };
}

export function calculateProgramRuntime(program: Program) {
  let programRuntime = 0;

  for (const ep of program.episodes) {
    programRuntime += getEpisodeDuration(ep, program.platform);
  }

  return programRuntime;
}

export function getLatestEpisodeTimestamp(program: Program): number {
  let latest = 0;

  for (const episode of program.episodes ?? []) {
    const ts = getEpisodeTimestamp(episode);

    if (ts > latest) {
      latest = ts;
    }
  }

  return latest;
}

export function getEpisodeTimestamp(episode: Episode): number {
  if (typeof episode.publishedAtUnix === 'number') {
    // Support both seconds and milliseconds
    return episode.publishedAtUnix > 1_000_000_000_000
      ? episode.publishedAtUnix
      : episode.publishedAtUnix * 1000;
  }

  if (episode.publishedAt) {
    const parsed = new Date(episode.publishedAt).getTime();

    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return 0;
}

export function formatEpisodeDate(timestamp: number): string {
  if (!timestamp) return 'Unknown';

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

import type { Program } from '@/types/media';
import type { UserProgramState } from '@/types/user';

const ONSEN_FALLBACK_DURATION = 45 * 60;

function getEpisodeDuration(program: Program, episodeIndex: number) {
  const ep = program.episodes[episodeIndex];

  if (!ep) return 0;

  if (ep.durationSeconds) {
    return ep.durationSeconds;
  }

  if (program.platform === 'onsen') {
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
      totalLibraryDuration +=
        ep.durationSeconds ??
        (program.platform === 'onsen' ? ONSEN_FALLBACK_DURATION : 0);
    }

    for (let i = 0; i < listenedEpisodes; i++) {
      totalListenedDuration += getEpisodeDuration(program, i);
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

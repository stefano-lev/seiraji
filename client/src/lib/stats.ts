import { Program } from '@/types/media';
import { UserProgramState } from '@/types/user';

export function calculateStats(
  programs: Program[],
  userState: UserProgramState[]
) {
  let totalEpisodes = 0;
  let totalDuration = 0;

  for (const program of programs) {
    totalEpisodes += program.episodes.length;

    for (const ep of program.episodes) {
      totalDuration += ep.durationSeconds ?? 0;
    }
  }

  return {
    totalPrograms: programs.length,
    totalEpisodes,
    totalHours: Math.round(totalDuration / 3600),
  };
}

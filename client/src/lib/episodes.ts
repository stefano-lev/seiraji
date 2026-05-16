import type { Program } from '@/types/media';

export function getEpisodeCount(program: Program) {
  return program.meta.episodeCount;
}

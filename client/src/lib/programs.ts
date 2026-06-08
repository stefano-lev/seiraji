import type { Program, Episode } from '@/types/media';

export type CreateManualProgramInput = {
  title: string;
  hosts?: string[];
  publishedAt?: string | null;
  schedule?: string | null;
  platform: string;

  episodeCount: number;

  description?: string;
  url?: string;
  thumbnail?: string;
};

export function createManualProgram(input: CreateManualProgramInput): Program {
  const episodes: Episode[] = Array.from(
    { length: input.episodeCount },
    (_, i) => ({
      id: crypto.randomUUID(),

      title: `Episode ${i + 1}`,

      description: null,

      publishedAt: null,

      publishedAtUnix: null,

      thumbnail: input.thumbnail ?? null,

      durationSeconds: null,

      tags: [],
    })
  );

  return {
    id: crypto.randomUUID(),

    platform: input.platform,

    platformId: crypto.randomUUID(),

    slug: undefined,

    url: '',

    source: 'manual',

    program: {
      title: input.title,

      description: input.description ?? null,

      thumbnail: input.thumbnail ?? null,

      hosts: input.hosts ?? [],

      schedule: null,

      categories: [],
    },

    episodes,

    meta: {
      cachedAt: new Date().toISOString(),

      episodeCount: episodes.length,
    },
  };
}

export function mergePrograms(
  libraryPrograms: Program[],
  localPrograms: Program[]
): Program[] {
  return [
    ...localPrograms.filter((p) => p.source === 'manual'),
    ...libraryPrograms.filter((p) => p.source === 'imported'),
  ];
}

export function updateProgramInLibrary(
  programs: Program[],
  updated: Program
): Program[] {
  return programs.map((p) => (p.id === updated.id ? updated : p));
}

export function deleteProgramFromLibrary(
  programs: Program[],
  programId: string
): Program[] {
  return programs.filter((p) => p.id !== programId);
}

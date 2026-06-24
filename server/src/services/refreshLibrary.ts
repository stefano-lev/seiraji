import { getAllCaches } from '../utils/cache';
import { refreshProgram } from './refreshProgram';

type RefreshFailure = {
  platform: string;
  title: string;
  id?: string;
  url?: string;
  error: string;
};

type PlatformRefreshSummary = {
  platform: string;
  totalPrograms: number;
  refreshedPrograms: number;
  failedPrograms: number;
  addedEpisodes: number;
  failures: RefreshFailure[];
};

type CachedProgram = {
  id?: string;
  url?: string;
  platform?: string;
  program?: {
    title?: string;
  };
};

type PlatformGroup = {
  platform: string;
  programs: CachedProgram[];
};

export async function refreshLibrary() {
  const startedAt = new Date().toISOString();

  const caches = await getAllCaches();

  const platformGroups: PlatformGroup[] = [
    {
      platform: 'audee',
      programs: Object.values(caches.audee),
    },
    {
      platform: 'youtube',
      programs: Object.values(caches.youtube),
    },
    {
      platform: 'onsen',
      programs: Object.values(caches.onsen),
    },
    {
      platform: 'qlover',
      programs: Object.values(caches.qlover),
    },
    {
      platform: 'nicochannel',
      programs: Object.values(caches.nicochannel),
    },
    {
      platform: 'openrec',
      programs: Object.values(caches.openrec),
    },
    {
      platform: 'nhk',
      programs: Object.values(caches.nhk),
    },
    {
      platform: 'tfm',
      programs: Object.values(caches.tfm),
    },
    {
      platform: 'allnightnippon',
      programs: Object.values(caches.allnightnippon),
    },
    {
      platform: 'koelink',
      programs: Object.values(caches.koelink),
    },
  ];

  const activeGroups = platformGroups.filter(
    (group) => group.programs.length > 0
  );

  console.log(
    `[REFRESH LIBRARY] Starting ${activeGroups.length} platform workers`
  );

  const platformResults = await Promise.all(
    activeGroups.map((group) => refreshPlatformGroup(group))
  );

  const refreshedPrograms = platformResults.reduce(
    (sum, result) => sum + result.refreshedPrograms,
    0
  );

  const failedPrograms = platformResults.reduce(
    (sum, result) => sum + result.failedPrograms,
    0
  );

  const addedEpisodes = platformResults.reduce(
    (sum, result) => sum + result.addedEpisodes,
    0
  );

  const totalPrograms = platformResults.reduce(
    (sum, result) => sum + result.totalPrograms,
    0
  );

  const failures = platformResults.flatMap((result) => result.failures);

  const finishedAt = new Date().toISOString();

  return {
    success: true,

    startedAt,
    finishedAt,

    totalPrograms,
    refreshedPrograms,
    failedPrograms,
    addedEpisodes,

    platforms: platformResults,

    failures,
  };
}

async function refreshPlatformGroup(
  group: PlatformGroup
): Promise<PlatformRefreshSummary> {
  let refreshedPrograms = 0;
  let failedPrograms = 0;
  let addedEpisodes = 0;

  const failures: RefreshFailure[] = [];

  console.log(
    `[REFRESH:${group.platform}] Starting ${group.programs.length} programs`
  );

  for (const [index, program] of group.programs.entries()) {
    const title = program.program?.title ?? program.id ?? 'Unknown Program';

    console.log(
      `[REFRESH:${group.platform}] [${index + 1}/${group.programs.length}] ${title}`
    );

    if (!program.url) {
      failedPrograms++;

      failures.push({
        platform: group.platform,
        title,
        id: program.id,
        url: program.url,
        error: 'Missing program URL',
      });

      console.warn(`[REFRESH:${group.platform}] Skipped missing URL: ${title}`);

      continue;
    }

    try {
      const result = await refreshProgram(program.url);

      refreshedPrograms++;
      addedEpisodes += result.addedEpisodes;

      console.log(
        `[REFRESH:${group.platform}] ${result.programTitle} (+${result.addedEpisodes})`
      );
    } catch (err) {
      failedPrograms++;

      const message = err instanceof Error ? err.message : String(err);

      failures.push({
        platform: group.platform,
        title,
        id: program.id,
        url: program.url,
        error: message,
      });

      console.error(`[REFRESH:${group.platform}] FAILED: ${title}`, err);
    }
  }

  console.log(
    `[REFRESH:${group.platform}] Finished: ${refreshedPrograms} refreshed, ${failedPrograms} failed, +${addedEpisodes} episodes`
  );

  return {
    platform: group.platform,

    totalPrograms: group.programs.length,

    refreshedPrograms,
    failedPrograms,
    addedEpisodes,

    failures,
  };
}

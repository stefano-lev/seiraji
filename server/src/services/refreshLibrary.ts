import path from 'node:path';
import fs from 'node:fs/promises';

import { getAllCaches } from '../utils/cache';
import { refreshProgram } from './refreshProgram';
import {
  createLogger,
  errorToLogString,
  safeTimestamp,
  type AppLogger,
} from '../utils/logger';

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
  const runId = safeTimestamp();

  const logger = createLogger({
    name: 'refresh-library',
    context: { runId },
  });

  logger.info('Starting refresh library run');

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
    {
      platform: 'applepodcasts',
      programs: Object.values(caches.applepodcasts),
    },
    {
      platform: 'radiko-podcast',
      programs: Object.values(caches.radikopodcasts),
    },
  ];

  const activeGroups = platformGroups.filter(
    (group) => group.programs.length > 0
  );

  logger.info('Starting %d platform workers', activeGroups.length);

  const platformResults = await Promise.all(
    activeGroups.map((group) =>
      refreshPlatformGroup(group, logger.child({ platform: group.platform }))
    )
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

  logger.info(
    'Finished refresh library run: %d/%d refreshed, %d failed, +%d episodes',
    refreshedPrograms,
    totalPrograms,
    failedPrograms,
    addedEpisodes
  );

  if (failures.length > 0) {
    logger.warn('Failures: %d', failures.length);

    for (const failure of failures) {
      logger.warn(
        '[%s] %s - %s',
        failure.platform,
        failure.title,
        failure.error
      );
    }
  }

  const logFile = await writeRefreshLibraryReport({
    directory: path.join(process.cwd(), 'logs', 'refresh-library'),
    runId,
    startedAt,
    finishedAt,
    totalPrograms,
    refreshedPrograms,
    failedPrograms,
    addedEpisodes,
    platformResults,
    failures,
    rawLines: logger.getLines(),
  });

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

    logFile,
  };
}

async function refreshPlatformGroup(
  group: PlatformGroup,
  logger: AppLogger
): Promise<PlatformRefreshSummary> {
  let refreshedPrograms = 0;
  let failedPrograms = 0;
  let addedEpisodes = 0;

  const failures: RefreshFailure[] = [];

  logger.info('Starting %d programs', group.programs.length);

  for (const [index, program] of group.programs.entries()) {
    const title = program.program?.title ?? program.id ?? 'Unknown Program';

    const programLogger = logger.child({
      title,
      id: program.id,
      url: program.url,
    });

    programLogger.info('[%d/%d] Refreshing', index + 1, group.programs.length);

    if (!program.url) {
      failedPrograms++;

      failures.push({
        platform: group.platform,
        title,
        id: program.id,
        url: program.url,
        error: 'Missing program URL',
      });

      programLogger.warn('Skipped: missing program URL');

      continue;
    }

    try {
      const startedAt = Date.now();

      const result = await refreshProgram(program.url, programLogger);

      const elapsedMs = Date.now() - startedAt;

      refreshedPrograms++;
      addedEpisodes += result.addedEpisodes;

      programLogger.info(
        'Success: +%d episodes, %d total episodes, %dms',
        result.addedEpisodes,
        result.totalEpisodes,
        elapsedMs
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

      programLogger.error('Failed: %s', errorToLogString(err));
    }
  }

  logger.info(
    'Finished: %d refreshed, %d failed, +%d episodes',
    refreshedPrograms,
    failedPrograms,
    addedEpisodes
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

async function writeRefreshLibraryReport({
  directory,
  runId,
  startedAt,
  finishedAt,
  totalPrograms,
  refreshedPrograms,
  failedPrograms,
  addedEpisodes,
  platformResults,
  failures,
  rawLines,
}: {
  directory: string;
  runId: string;
  startedAt: string;
  finishedAt: string;
  totalPrograms: number;
  refreshedPrograms: number;
  failedPrograms: number;
  addedEpisodes: number;
  platformResults: PlatformRefreshSummary[];
  failures: RefreshFailure[];
  rawLines: string[];
}) {
  await fs.mkdir(directory, { recursive: true });

  const filePath = path.join(directory, `${runId}.log`);

  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('SeiRaji Refresh Library Report');
  lines.push('='.repeat(80));
  lines.push(`Run ID:      ${runId}`);
  lines.push(`Started:     ${startedAt}`);
  lines.push(`Finished:    ${finishedAt}`);
  lines.push(`Duration:    ${formatDuration(startedAt, finishedAt)}`);
  lines.push('');
  lines.push(
    `Summary:     ${refreshedPrograms}/${totalPrograms} refreshed, ${failedPrograms} failed, +${addedEpisodes} episodes`
  );
  lines.push('');

  lines.push('-'.repeat(80));
  lines.push('Platform Summary');
  lines.push('-'.repeat(80));

  for (const result of platformResults) {
    const status = result.failedPrograms > 0 ? 'WARN' : 'OK';

    lines.push(
      `${status.padEnd(4)} ${result.platform.padEnd(18)} ` +
        `${String(result.refreshedPrograms).padStart(3)}/${String(
          result.totalPrograms
        ).padEnd(3)} refreshed  ` +
        `${String(result.failedPrograms).padStart(2)} failed  ` +
        `+${String(result.addedEpisodes).padEnd(3)} episodes`
    );
  }

  lines.push('');

  lines.push('-'.repeat(80));
  lines.push('Failures');
  lines.push('-'.repeat(80));

  if (failures.length === 0) {
    lines.push('No failures.');
  } else {
    for (const failure of failures) {
      lines.push(`[${failure.platform}] ${failure.title}`);
      lines.push(`  ID:    ${failure.id ?? 'unknown'}`);
      lines.push(`  URL:   ${failure.url || 'missing'}`);
      lines.push(`  Error: ${failure.error}`);
      lines.push('');
    }
  }

  lines.push('');

  lines.push('-'.repeat(80));
  lines.push('Grouped Platform Logs');
  lines.push('-'.repeat(80));

  for (const result of platformResults) {
    const platformLines = rawLines.filter((line) =>
      line.includes(`platform=${result.platform}`)
    );

    lines.push('');
    lines.push(`[${result.platform}]`);
    lines.push(
      `${result.refreshedPrograms}/${result.totalPrograms} refreshed, ` +
        `${result.failedPrograms} failed, +${result.addedEpisodes} episodes`
    );

    if (platformLines.length === 0) {
      lines.push('  No detailed lines found for this platform.');
      continue;
    }

    for (const line of platformLines) {
      lines.push(`  ${simplifyLogLine(line)}`);
    }
  }

  lines.push('');
  lines.push('-'.repeat(80));
  lines.push('Raw Chronological Timeline');
  lines.push('-'.repeat(80));
  lines.push(...rawLines);

  await fs.writeFile(filePath, `${lines.join('\n')}\n`, 'utf8');

  return filePath;
}

function formatDuration(startedAt: string, finishedAt: string) {
  const started = new Date(startedAt).getTime();
  const finished = new Date(finishedAt).getTime();

  if (!Number.isFinite(started) || !Number.isFinite(finished)) {
    return 'unknown';
  }

  const seconds = Math.round((finished - started) / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${minutes}m ${remainder}s`;
}

function simplifyLogLine(line: string) {
  return line
    .replace(/ run=[^ \]]+/g, '')
    .replace(/ refresh-library/g, '')
    .replace(/ id=[^ \]]+/g, '')
    .replace(/ title="([^"]+)"/g, ' "$1"')
    .trim();
}

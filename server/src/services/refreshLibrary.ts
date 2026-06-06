import { getAllCaches } from '../utils/cache';
import { refreshProgram } from './refreshProgram';

export async function refreshLibrary() {
  const caches = await getAllCaches();

  const programs = [
    ...Object.values(caches.audee),
    ...Object.values(caches.youtube),
    ...Object.values(caches.onsen),
    ...Object.values(caches.qlover),
    ...Object.values(caches.nicochannel),
    ...Object.values(caches.openrec),
    ...Object.values(caches.nhk),
    ...Object.values(caches.tfm),
    ...Object.values(caches.allnightnippon),
  ];

  let refreshedPrograms = 0;
  let failedPrograms = 0;
  let addedEpisodes = 0;

  const failures: string[] = [];

  for (const program of programs as any[]) {
    console.log(
      `[${refreshedPrograms + failedPrograms}/${programs.length}] ${program.program.title}`
    );

    try {
      const result = await refreshProgram(program.url);

      refreshedPrograms++;
      addedEpisodes += result.addedEpisodes;

      console.log(
        `[REFRESH] ${result.programTitle} (+${result.addedEpisodes})`
      );
    } catch (err) {
      failedPrograms++;

      failures.push(program.program?.title ?? program.id);

      console.error(`[REFRESH FAILED] ${program.program?.title}`, err);
    }
  }

  return {
    success: true,

    refreshedPrograms,
    failedPrograms,
    addedEpisodes,

    failures,
  };
}

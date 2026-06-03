import { readCache, writeCache } from '../utils/cache';
import { normalizeHosts } from '../utils/normalizeHosts';
import { validateHosts } from '../utils/validateImport';

export async function getCachedOrImport(
  cacheFile: string,
  cacheKey: string,
  scraper: () => Promise<any>,
  hostOverride?: string
) {
  const cache = await readCache(cacheFile);

  let data;

  if (cache[cacheKey]) {
    console.log(`[CACHE HIT] ${cacheFile} -> ${cacheKey}`);

    data = cache[cacheKey];
  } else {
    console.log(`[CACHE MISS] ${cacheFile} -> ${cacheKey}`);

    data = await scraper();

    if (hostOverride?.trim()) {
      data = structuredClone(data);

      data.program.hosts = normalizeHosts(hostOverride);
    }

    validateHosts(data.program?.hosts, hostOverride);

    cache[cacheKey] = data;

    await writeCache(cacheFile, cache);

    return data;
  }
}

export async function ensureNotCached(cacheFile: string, cacheKey: string) {
  const cache = await readCache(cacheFile);

  if (cache[cacheKey]) {
    throw new Error(
      'Program already exists in library. Use api/refresh/ if you want to initiate a manual cache refresh.'
    );
  }
}

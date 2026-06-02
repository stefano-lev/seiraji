import { readCache, writeCache } from '../utils/cache';
import { normalizeHosts } from '../utils/normalizeHosts';

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

    cache[cacheKey] = data;

    await writeCache(cacheFile, cache);
  }

  if (hostOverride?.trim()) {
    data = structuredClone(data);

    if (data.program) {
      data.program.hosts = normalizeHosts(hostOverride);
    }

    cache[cacheKey] = data;

    await writeCache(cacheFile, cache);

    console.log(
      `[HOST OVERRIDE] ${cacheFile} -> ${cacheKey} (${hostOverride})`
    );
  }

  return data;
}

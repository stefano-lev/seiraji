import { readCache, writeCache } from '../utils/cache';

export async function getCachedOrImport(
  cacheFile: string,
  cacheKey: string,
  scraper: () => Promise<any>
) {
  const cache = await readCache(cacheFile);

  if (cache[cacheKey]) {
    console.log(`[CACHE HIT] ${cacheFile} -> ${cacheKey}`);

    return cache[cacheKey];
  }

  console.log(`[CACHE MISS] ${cacheFile} -> ${cacheKey}`);

  const data = await scraper();

  cache[cacheKey] = data;

  await writeCache(cacheFile, cache);

  return data;
}

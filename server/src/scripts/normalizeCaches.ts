import fs from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'cache');

const CACHE_FILES = [
  'audee-programs.json',
  'youtube-playlists.json',
  'onsen-programs.json',
  'qlover-programs.json',
  'nicochannel-programs.json',
  'openrec-programs.json',
  'nhk-programs.json',
  'tfm-programs.json',
  'allnightnippon-programs.json',
  'koelink-programs.json',
  'applepodcasts-programs.json',
  'radiko-podcasts.json',
  'radiko-radio.json',
];

async function main() {
  for (const filename of CACHE_FILES) {
    const filePath = path.join(CACHE_DIR, filename);

    let cache: Record<string, any>;

    try {
      cache = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    } catch {
      continue;
    }

    let changed = false;

    for (const program of Object.values(cache)) {
      if (!program?.program) continue;

      const programInfo = program.program;

      if ('category' in programInfo) {
        const legacyCategory = programInfo.category;

        if (!Array.isArray(programInfo.categories)) {
          programInfo.categories = normalizeCategories(legacyCategory);
        }

        delete programInfo.category;
        changed = true;
      }

      if ('categories' in programInfo) {
        programInfo.categories = normalizeCategories(programInfo.categories);
        changed = true;
      }

      if ('twitter' in programInfo) {
        programInfo.twitter =
          typeof programInfo.twitter === 'string' && programInfo.twitter.trim()
            ? programInfo.twitter.trim()
            : null;

        changed = true;
      }
    }

    if (changed) {
      await fs.writeFile(filePath, JSON.stringify(cache, null, 2));
      console.log(`Normalized ${filename}`);
    }
  }
}

function normalizeCategories(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[,\s、#]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

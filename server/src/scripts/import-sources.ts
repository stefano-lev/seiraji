import fs from 'fs';

import { scrapeAudee } from '../services/scrapeAudee';
import { scrapeOnsen } from '../services/scrapeOnsen';
import { scrapeQlover } from '../services/scrapeQlover';
import { scrapeYoutubePlaylist } from '../services/scrapeYoutubePlaylist';

function detectSource(url: string) {
  if (url.includes('youtube.com')) return 'youtube';
  if (url.includes('onsen.ag')) return 'onsen';
  if (url.includes('qlover.jp')) return 'qlover';
  if (url.includes('audee')) return 'audee';

  return 'unknown';
}

async function main() {
  const text = fs.readFileSync('./data/seed-urls.txt', 'utf8');

  const urls = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  for (const url of urls) {
    const source = detectSource(url);

    console.log(`\nImporting: ${url}`);
    console.log(`Detected source: ${source}`);

    try {
      switch (source) {
        case 'audee':
          await scrapeAudee(url);
          break;

        case 'onsen':
          await scrapeOnsen(url);
          break;

        case 'qlover':
          await scrapeQlover(url);
          break;

        case 'youtube':
          await scrapeYoutubePlaylist(url);
          break;

        default:
          console.warn(`Unknown source for URL: ${url}`);
      }

      console.log('Done.');
    } catch (err) {
      console.error(`Failed importing ${url}`);
      console.error(err);
    }
  }

  console.log('\nAll imports complete.');
}

main();

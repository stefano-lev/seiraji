import * as cheerio from 'cheerio';

function getOnsenRows($: cheerio.CheerioAPI) {
  const scroll = $('.scroll-table tr.wrap-content');
  if (scroll.length) return scroll;

  return $('table tr').filter((_, el) => {
    return $(el).find('.pro-title-content').length > 0;
  });
}

export async function scrapeOnsen(url: string) {
  const response = await fetch(url);

  const html = await response.text();

  const $ = cheerio.load(html);

  const slug = url.split('/program/')[1];

  const title = $('meta[name="twitter:title"]').attr('content') || '';

  const description =
    $('meta[name="twitter:description"]').attr('content') || '';

  const hosts = $('.single-categories.performer a').text().trim();

  const liveperiod = $('.live-period-mb').text().trim();

  const thumbnail =
    $('meta[name="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    null;

  const episodes: any[] = [];

  const rows = getOnsenRows($);

  rows.each((_, element) => {
    const row = $(element);

    const title = row.find('.pro-title-content').text().trim();

    if (!title) return;

    if (title.includes('おまけ')) return;

    const date = row.find('td').eq(1).text().trim();

    const tags: string[] = [];

    if (row.find('.tag-guest').length) {
      tags.push('GUEST');
    }

    episodes.push({
      id: `${slug}-${date}-${title}`,
      title,
      publishedAt: null,
      publishedAtUnix: null,
      thumbnail: null,
      durationSeconds: null,
      tags,
      platformMetadata: {
        displayDate: date,
      },
    });
  });

  return {
    id: `onsen:${slug}`,

    source: 'imported',

    platform: 'onsen',

    platformId: slug,

    slug,

    url,

    program: {
      title,

      description,

      thumbnail,

      hosts,

      categories: null,

      schedule: liveperiod,
    },

    episodes: episodes.reverse(),

    meta: {
      cachedAt: new Date().toISOString(),

      episodeCount: episodes.length,
    },
  };
}

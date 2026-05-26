export async function fetchNicochannelEpisodes(fanclubId: number) {
  const episodes: any[] = [];
  let page = 1;

  while (true) {
    const url = `https://api.nicochannel.jp/fc/v2/fanclub_sites/${fanclubId}/video_pages?sort=-display_date&vod_type=0&per_page=12&page=${page}`;

    console.log('FETCHING:', url);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',

        Accept: 'application/json, text/plain, */*',

        Origin: 'https://nicochannel.jp/',

        Referer: 'https://nicochannel.jp/',

        fc_site_id: String(fanclubId),

        fc_use_device: 'null',
      },
    });

    console.log('STATUS:', res.status);

    const json = await res.json();

    const list = json?.data?.video_pages?.list ?? [];

    if (list.length === 0) {
      break;
    }

    episodes.push(...list);

    page++;
  }

  return episodes;
}

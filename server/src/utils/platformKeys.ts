export function getAudeeSlug(url: string): string {
  const slug = new URL(url).pathname.split('/').filter(Boolean)[0];

  if (!slug) {
    throw new Error('Invalid Audee URL');
  }

  return slug;
}

export function getOnsenSlug(url: string): string {
  const slug = url.split('/program/')[1];

  if (!slug) {
    throw new Error('Invalid Onsen URL');
  }

  return slug;
}

export function getYoutubePlaylistId(url: string): string {
  const playlistId = new URL(url).searchParams.get('list');

  if (!playlistId) {
    throw new Error('Invalid YouTube playlist URL');
  }

  return playlistId;
}

export function getQloverSlug(url: string): string {
  const slug = new URL(url).pathname.split('/').filter(Boolean)[0];

  if (!slug) {
    throw new Error('Invalid Qlover URL');
  }

  return slug;
}

export function getOpenrecSlug(url: string): string {
  const slug = new URL(url).pathname.split('/').filter(Boolean)[1];

  if (!slug) {
    throw new Error('Invalid OpenRec URL');
  }

  return slug;
}

export function getNicochannelSlug(url: string): string {
  const slug = new URL(url).pathname.split('/').filter(Boolean)[0];

  if (!slug) {
    throw new Error('Invalid NicoChannel URL');
  }

  return slug;
}

export function getNHKSeriesId(url: string): string {
  const match = url.match(/\/rs\/([^/]+)\/?/);

  if (!match) {
    throw new Error('Invalid NHK URL');
  }

  return match[1];
}

export function getTokyoFMSlug(url: string): string {
  const parts = new URL(url).pathname.split('/').filter(Boolean);

  const slug = parts[1];

  if (!slug) {
    throw new Error('Invalid TokyoFM podcast URL');
  }

  return slug;
}

export function getANNSlug(url: string): string {
  const slug = new URL(url).pathname.split('/').filter(Boolean)[0];

  if (!slug) {
    throw new Error('Invalid ANN Podcast URL');
  }

  return slug;
}

export function getKoelinkSlug(url: string): string {
  const parts = new URL(url).pathname.split('/').filter(Boolean);

  const programsIndex = parts.indexOf('programs');

  const slug =
    programsIndex >= 0 ? parts[programsIndex + 1] : parts[parts.length - 1];

  if (!slug) {
    throw new Error('Invalid Koelink program URL');
  }

  return slug;
}

export function getApplePodcastId(url: string): string {
  const parsed = new URL(url);

  const match = parsed.pathname.match(/\/id(\d+)/);

  if (!match) {
    throw new Error('Invalid Apple Podcasts URL');
  }

  return match[1];
}

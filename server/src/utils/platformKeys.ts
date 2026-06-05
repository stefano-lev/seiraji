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

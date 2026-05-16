const API_BASE = 'http://localhost:3001/api';

export async function importAudee(url: string) {
  const res = await fetch(`${API_BASE}/audee/import`, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    throw new Error('Failed to import Audee program');
  }

  return res.json();
}

export async function importOnsen(url: string) {
  const res = await fetch(`${API_BASE}/onsen/import`, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    throw new Error('Failed to import Onsen program');
  }

  return res.json();
}

export async function importYoutubePlaylist(url: string) {
  const res = await fetch(`${API_BASE}/youtube/import`, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    throw new Error('Failed to import Youtube program');
  }

  return res.json();
}

export async function getLibrary() {
  const res = await fetch(`${API_BASE}/library/all`);

  if (!res.ok) {
    throw new Error('Failed to load library');
  }

  return res.json();
}

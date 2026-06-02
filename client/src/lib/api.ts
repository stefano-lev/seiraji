const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001/api';

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

export async function createBackup(payload: unknown) {
  const res = await fetch(`${API_BASE}/backup/create`, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      payload,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to create backup');
  }

  return res.json();
}

export async function restoreBackup(backupId: string, passkey: string) {
  const res = await fetch(`${API_BASE}/backup/restore`, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      backupId,
      passkey,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to restore backup');
  }

  return res.json();
}

export async function updateBackup(
  backupId: string,
  passkey: string,
  payload: unknown
) {
  const res = await fetch(`${API_BASE}/backup/update`, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      backupId,
      passkey,
      payload,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to update backup');
  }

  return res.json();
}

export async function importProgram(url: string, hostOverride?: string) {
  const res = await fetch(`${API_BASE}/import`, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      url,
      hostOverride,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to import program');
  }

  return res.json();
}

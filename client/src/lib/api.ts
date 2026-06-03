const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001/api';

import type { ProgramPreview } from '@/types/media';

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
    const error = await res.text();

    throw new Error(`Import failed (${res.status}): ${error}`);
  }

  return res.json();
}

export async function previewProgram(
  url: string,
  hostOverride?: string
): Promise<ProgramPreview> {
  const res = await fetch(`${API_BASE}/import/preview`, {
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
    throw new Error('Failed to generate preview');
  }

  return res.json();
}

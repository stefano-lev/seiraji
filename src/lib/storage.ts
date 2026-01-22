import type { UserShowState } from '@/types/radio';

const KEY = 'seiraji:user-state';

export function loadUserState(): UserShowState[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUserState(state: UserShowState[]) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function upsertShowState(
  all: UserShowState[],
  updated: UserShowState
): UserShowState[] {
  const existingIndex = all.findIndex((s) => s.showId === updated.showId);

  if (existingIndex === -1) {
    return [...all, updated];
  }

  const copy = [...all];
  copy[existingIndex] = updated;
  return copy;
}

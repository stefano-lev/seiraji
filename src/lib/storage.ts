import type { RadioShow, UserShowState } from '@/types/radio';

const KEY = 'seiraji:user-state';
const ACTIVITY_KEY = 'seiraji:activity';

export type ActivityEvent = {
  id: string;
  ts: string;
  type: 'episode_progress';
  showId: string;
  episode: number;
  delta: number;
};

export function loadActivity(): ActivityEvent[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    return raw ? (JSON.parse(raw) as ActivityEvent[]) : [];
  } catch {
    return [];
  }
}

export function saveActivity(events: ActivityEvent[]) {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(events));
}

export function appendActivityEvent(
  events: ActivityEvent[],
  event: ActivityEvent,
  max = 200
): ActivityEvent[] {
  const next = [event, ...events]; // newest first
  return next.slice(0, max);
}

export type ExportPayload = {
  version: 1;
  exportedAt: string;
  shows: RadioShow[];
  userState: UserShowState[];
};

export function buildExportPayload(
  shows: RadioShow[],
  userState: UserShowState[]
): ExportPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    shows,
    userState,
  };
}

export function downloadJson(filename: string, data: unknown) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

export async function readJsonFile(file: File): Promise<unknown> {
  const text = await file.text();
  return JSON.parse(text);
}

export function isExportPayload(data: unknown): data is ExportPayload {
  if (data === null || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;

  return (
    obj.version === 1 &&
    Array.isArray(obj.shows) &&
    Array.isArray(obj.userState)
  );
}

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

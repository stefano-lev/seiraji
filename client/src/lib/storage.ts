//import type { RadioShow, UserShowState } from '@/types/radio';
import type { Program } from '@/types/media';
import type { UserProgramState } from '@/types/user';

const KEY = 'seiraji:user-state';
const ACTIVITY_KEY = 'seiraji:activity';
const TAGS_KEY = 'seiraji:tags';
const PREFS_KEY = 'seiraji:prefs';

export type ActivityEvent = {
  id: string;
  ts: string;
  type: 'episode_progress';
  programId: string;
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

export type Preferences = {
  showTagsOnCard: boolean;
  showStatusOnCard: boolean;
  showLastEpisodeOnCard: boolean;
};

export const defaultPrefs: Preferences = {
  showTagsOnCard: true,
  showStatusOnCard: true,
  showLastEpisodeOnCard: true,
};

export function loadPrefs(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...defaultPrefs, ...JSON.parse(raw) } : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
}

export function savePrefs(prefs: Preferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export type ExportPayload = {
  version: 2;
  exportedAt: string;
  programs: Program[];
  userState: UserProgramState[];
  tags: string[];
};

export function buildExportPayload(
  programs: Program[],
  userState: UserProgramState[],
  tags: string[]
): ExportPayload {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    programs,
    userState,
    tags,
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

  const baseOk =
    (obj.version === 1 || obj.version === 2) &&
    Array.isArray(obj.programs) &&
    Array.isArray(obj.userState);

  if (!baseOk) return false;

  // version 2.0 and up should have tags present
  if (obj.version === 2 && !Array.isArray(obj.tags)) return false;

  return true;
}

export function loadUserState(): UserProgramState[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUserState(state: UserProgramState[]) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function upsertShowState(
  all: UserProgramState[],
  updated: UserProgramState
): UserProgramState[] {
  const existingIndex = all.findIndex((s) => s.programId === updated.programId);

  if (existingIndex === -1) {
    return [...all, updated];
  }

  const copy = [...all];
  copy[existingIndex] = updated;
  return copy;
}

// prevent duplicated tags by standardizing them
export function normalizeTag(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function loadTags(): string[] {
  try {
    const raw = localStorage.getItem(TAGS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveTags(tags: string[]) {
  localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
}

export function upsertTag(tags: string[], tag: string): string[] {
  const t = normalizeTag(tag);
  if (!t) return tags;
  if (tags.includes(t)) return tags;
  return [...tags, t].sort((a, b) => a.localeCompare(b));
}

export function removeTag(tags: string[], tag: string): string[] {
  const t = normalizeTag(tag);
  return tags.filter((x) => x !== t);
}

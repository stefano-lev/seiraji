import type { RadioShow } from '@/types/radio';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// weeks between start and now
function weeksBetween(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  if (ms <= 0) return 0;
  return ms / (1000 * 60 * 60 * 24 * 7);
}

export function estimateTotalEpisodes(show: RadioShow, nowMs: number) {
  if (!show.startDate) return 0;
  if (show.isEnded) return 0;
  if (show.isHiatus) return 0;

  if (show.frequency === 'irregular') return 0;

  const start = new Date(show.startDate);
  if (Number.isNaN(start.getTime())) return 0;

  const now = new Date(nowMs);

  const w = weeksBetween(start, now);

  let estimated = 0;

  if (show.frequency === 'weekly') {
    estimated = Math.floor(w) + 1; // include week 1
  } else if (show.frequency === 'biweekly') {
    estimated = Math.floor(w / 2) + 1;
  }

  // clamp just to prevent unrealistic values
  estimated = clamp(estimated, 0, 10_000);

  return estimated;
}

export function getEffectiveTotalEpisodes(show: RadioShow, nowMs: number) {
  const manual = show.manualTotalEpisodes;

  if (typeof manual === 'number' && manual >= 0) {
    return manual;
  }

  return estimateTotalEpisodes(show, nowMs);
}

import type { Program } from '@/types/media';
import type { Preferences } from '@/lib/storage';
import type { UserProgramState } from '@/types/user';
import type { SortMode } from '@/types/sort';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { isRadikoBroadcastSnapshot } from '@/lib/platformDetection';
import {
  calculateProgramRuntime,
  getLatestEpisodeTimestamp,
  formatEpisodeDate,
} from '@/lib/stats';
import React from 'react';

type Props = {
  program: Program;
  userState?: UserProgramState;
  sortMode: SortMode;
  now: number;

  onUpdate: (state: UserProgramState) => void;
  onUpdateEpisode: (programId: string, nextEpisode: number) => void;
  onOpen?: (program: Program) => void;
  onEdit?: (program: Program) => void;
  onTogglePinned: (programId: string) => void;

  prefs: Preferences;
};

export const ShowCard = React.memo(function ShowCard({
  program,
  userState,
  sortMode,
  now,
  onUpdate,
  onUpdateEpisode,
  onOpen,
  onTogglePinned,
  prefs,
}: Props) {
  const state: UserProgramState = userState ?? {
    programId: program.id,
    status: 'backlog',
    lastListenedEpisode: 0,
    isPinned: false,
    tags: [],
  };

  const thumbnail =
    program.program.thumbnail ?? '/placeholders/show-placeholder.png';

  const totalEpisodes = program.episodes.length;

  const lastEp = state.lastListenedEpisode ?? 0;

  const isBroadcastSnapshot = isRadikoBroadcastSnapshot(program);
  const isBroadcastLogged = lastEp > 0;

  const progressPct = isBroadcastSnapshot
    ? isBroadcastLogged
      ? 100
      : 0
    : totalEpisodes > 0
      ? Math.min(100, (lastEp / totalEpisodes) * 100)
      : 0;

  const latestEpisode = program.episodes[program.episodes.length - 1];

  const latestEpisodeTime = getLatestEpisodeTimestamp(program);

  const hasRecentEpisode =
    latestEpisodeTime > 0 &&
    latestEpisodeTime <= now &&
    now - latestEpisodeTime <= NEW_EPISODE_WINDOW_MS;

  const rawHosts = program.program.hosts;

  const hostsArray = Array.isArray(rawHosts)
    ? rawHosts
    : typeof rawHosts === 'string'
      ? rawHosts.split('\n')
      : [];

  const hostsText =
    hostsArray
      .map((h: string) => h.trim())
      .filter(Boolean)
      .join(', ') || 'Unknown host';

  const sortBadge = getSortContextBadge({
    sortMode,
    program,
    lastEp,
    totalEpisodes,
    progressPct,
    isBroadcastSnapshot,
    isBroadcastLogged,
  });

  function clamp(n: number) {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(Math.floor(n), totalEpisodes));
  }

  return (
    <Card
      data-tour="program-card"
      onClick={() => onOpen?.(program)}
      className={`
    relative group overflow-hidden transition-shadow hover:shadow-xl
    flex flex-col h-full
    ${prefs.compactCards ? 'p-2' : ''}
  `}
    >
      {!prefs.disablePinToTop && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePinned(program.id);
          }}
          className={`
          absolute top-2 left-2 z-10
          text-yellow-500 text-lg
          transition-opacity
    ${state.isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
  `}
          title={state.isPinned ? 'Remove from favorites' : 'Add to favorites'}
          aria-label={
            state.isPinned
              ? `Remove ${program.program.title} from favorites`
              : `Add ${program.program.title} to favorites`
          }
        >
          {state.isPinned ? '★' : '☆'}
        </button>
      )}

      <CardHeader
        className={
          prefs.compactCards
            ? 'p-3 pb-2 flex-shrink-0'
            : 'p-4 pb-3 flex-shrink-0'
        }
      >
        <div className={prefs.compactCards ? 'flex gap-2' : 'flex gap-4'}>
          <div
            className={`
              relative shrink-0 overflow-hidden rounded-xl bg-muted
              ${prefs.compactCards ? 'h-12 w-[72px]' : 'h-16 w-24'}
            `}
          >
            <img src={thumbnail} className="h-full w-full object-cover" />

            {!prefs.hideTagsOnCard && (
              <Badge
                variant="secondary"
                className="
                  absolute bottom-1 left-1
                  max-w-[calc(100%-0.5rem)]
                  truncate
                  px-1.5 py-0
                  text-[10px]
                  leading-4
                  shadow
                "
              >
                {isBroadcastSnapshot ? 'radiko-radio' : program.platform}
              </Badge>
            )}
          </div>

          <div className="min-w-0 flex-1 mr-6">
            <h3 className="font-semibold text-base leading-tight line-clamp-2">
              {program.program.title}
            </h3>

            <p className="mt-1 min-h-[1.25rem] text-sm text-muted-foreground line-clamp-1">
              {hostsText}
            </p>

            {sortBadge && (
              <div className="mt-2 flex min-h-[1.25rem] overflow-hidden">
                <Badge
                  variant="outline"
                  className="
                    max-w-full
                    truncate
                    px-2
                    py-0
                    text-[11px]
                    font-normal
                    leading-5
                    text-muted-foreground
                  "
                  title={sortBadge.title}
                >
                  <span className="text-foreground/80">{sortBadge.label}</span>
                  <span className="mx-1 text-muted-foreground">·</span>
                  <span>{sortBadge.value}</span>
                </Badge>
              </div>
            )}

            {/* {!prefs.hideTagsOnCard && program.program.categories?.[0] && (
              <div className="mt-2 flex min-h-[1.25rem] gap-1 overflow-hidden">
                <Badge variant="outline" className="truncate">
                  {program.program.categories[0]}
                </Badge>
              </div>
            )} */}
          </div>
        </div>
      </CardHeader>

      <CardContent
        className={
          prefs.compactCards
            ? 'p-3 pt-0 flex flex-col flex-1 h-full'
            : 'p-4 pt-0 flex flex-col flex-1 h-full'
        }
      >
        <div
          data-tour="progress-controls"
          className="flex flex-col flex-1 justify-between gap-3"
        >
          {prefs.showLastEpisodeOnCard && latestEpisode && (
            <div className="text-xs border-l pl-2 text-muted-foreground">
              <div className="font-medium text-foreground">
                Latest: {latestEpisode.title}
              </div>

              {latestEpisode.publishedAt && (
                <div>
                  {new Date(latestEpisode.publishedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          {!prefs.hideProgressBar && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground">
                {isBroadcastSnapshot ? (
                  <>
                    <span>{isBroadcastLogged ? 'Logged' : 'Not logged'}</span>
                    <span></span>
                  </>
                ) : (
                  <>
                    <span>
                      Episode {lastEp} / {totalEpisodes || '?'}
                    </span>
                    <span>{Math.round(progressPct)}%</span>
                  </>
                )}
              </div>

              <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {isBroadcastSnapshot ? (
              <Button
                size="sm"
                variant={isBroadcastLogged ? 'secondary' : 'default'}
                onClick={(e) => {
                  e.stopPropagation();

                  const nextEpisode = isBroadcastLogged ? 0 : 1;

                  onUpdateEpisode(program.id, nextEpisode);

                  onUpdate({
                    ...state,
                    lastListenedEpisode: nextEpisode,
                    status: nextEpisode === 1 ? 'listening' : 'backlog',
                  });
                }}
              >
                {isBroadcastLogged ? 'Mark backlog' : 'Mark listening'}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateEpisode(program.id, clamp(lastEp - 1));
                  }}
                >
                  −
                </Button>

                <Input
                  type="number"
                  value={lastEp}
                  min={0}
                  max={totalEpisodes}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    onUpdateEpisode(program.id, clamp(Number(e.target.value)))
                  }
                  className="w-16 text-center px-0"
                />

                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateEpisode(program.id, clamp(lastEp + 1));
                  }}
                >
                  +
                </Button>
              </div>
            )}
          </div>

          {!prefs.hideStatusOnCard && (
            <div onClick={(e) => e.stopPropagation()}>
              <Select
                value={state.status}
                onValueChange={(v) =>
                  onUpdate({
                    ...state,
                    status: v as UserProgramState['status'],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="listening">Listening</SelectItem>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>

      {hasRecentEpisode && (
        <Badge
          className="
            absolute top-2 right-2 z-10
            px-2 py-0.5
            text-[8px] font-semibold tracking-wide
            shadow-sm
          "
          title="A new episode aired within the last 7 days"
        >
          NEW
        </Badge>
      )}
    </Card>
  );
});

type SortContextBadge = {
  label: string;
  value: string;
  title: string;
};

function getSortContextBadge({
  sortMode,
  program,
  lastEp,
  totalEpisodes,
  progressPct,
  isBroadcastSnapshot,
  isBroadcastLogged,
}: {
  sortMode: SortMode;
  program: Program;
  lastEp: number;
  totalEpisodes: number;
  progressPct: number;
  isBroadcastSnapshot: boolean;
  isBroadcastLogged: boolean;
}): SortContextBadge | null {
  if (sortMode === 'episodeCount') {
    const count = totalEpisodes;

    return {
      label: isBroadcastSnapshot ? 'Broadcasts' : 'Episodes',
      value: count.toLocaleString(),
      title: `${count.toLocaleString()} ${
        isBroadcastSnapshot ? 'broadcast snapshot' : 'episodes'
      }`,
    };
  }

  if (sortMode === 'recentlyUpdated') {
    const latestEpisodeTime = getLatestEpisodeTimestamp(program);

    return {
      label: 'Latest episode',
      value: formatEpisodeDate(latestEpisodeTime),
      title: latestEpisodeTime
        ? `Newest known episode aired ${new Date(latestEpisodeTime).toLocaleString()}`
        : 'No known episode publish date',
    };
  }

  if (sortMode === 'runtime') {
    const runtime = calculateProgramRuntime(program);

    return {
      label: 'Runtime',
      value: formatRuntime(runtime),
      title:
        runtime > 0
          ? `Estimated total runtime: ${formatRuntime(runtime)}`
          : 'Runtime unavailable',
    };
  }

  if (sortMode === 'progress') {
    if (isBroadcastSnapshot) {
      return {
        label: 'Progress',
        value: isBroadcastLogged ? 'Logged' : 'Not logged',
        title: isBroadcastLogged
          ? 'This broadcast snapshot has been logged'
          : 'This broadcast snapshot has not been logged',
      };
    }

    return {
      label: 'Progress',
      value: `${Math.round(progressPct)}%`,
      title: `${lastEp.toLocaleString()} of ${Math.max(
        totalEpisodes,
        1
      ).toLocaleString()} episodes listened`,
    };
  }

  return null;
}

const NEW_EPISODE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function formatRuntime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 'Unknown';
  }

  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

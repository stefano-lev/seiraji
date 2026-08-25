import { useMemo } from 'react';
import { motion } from 'framer-motion';

import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

import type { Program } from '@/types/media';
import type { UserProgramState } from '@/types/user';

type Episode = Program['episodes'][number];

type FavoriteFeedItem = {
  program: Program;
  episode: Episode;
  episodeNumber: number;
  publishedAtMs: number;
  listened: boolean;
};

type FavoriteFeedModalProps = {
  open: boolean;
  onClose: () => void;

  programs: Program[];
  userState: UserProgramState[];

  now: number;

  onOpenProgram: (program: Program) => void;
};

const MAX_FEED_ITEMS = 100;

export function FavoriteFeedModal({
  open,
  onClose,
  programs,
  userState,
  now,
  onOpenProgram,
}: FavoriteFeedModalProps) {
  const feedItems = useMemo(
    () => buildFavoriteFeed(programs, userState, now),
    [programs, userState, now]
  );

  const favoriteCount = useMemo(
    () => userState.filter((state) => state.isPinned).length,
    [userState]
  );

  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      onClick={onClose}
    >
      <motion.div
        className="
          w-full
          max-w-5xl
          max-h-[92dvh]
          sm:h-[85dvh]
          rounded-2xl
          sm:rounded-3xl
          border border-border/60
          bg-background
          shadow-2xl
          overflow-hidden
          flex flex-col
        "
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{
          duration: 0.16,
          ease: [0.16, 1, 0.3, 1],
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="shrink-0 border-b border-border/60 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">Favorite Updates</h2>

                <Badge variant="secondary">
                  {favoriteCount} favorite
                  {favoriteCount === 1 ? '' : 's'}
                </Badge>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Recent episodes from programs in your favorites.
              </p>
            </div>

            <Button className="w-full sm:w-auto" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6">
          {favoriteCount === 0 ? (
            <EmptyFavorites />
          ) : feedItems.length === 0 ? (
            <div className="rounded-2xl border border-border/60 p-6 text-center">
              <div className="font-medium">No dated episodes available</div>

              <p className="mt-2 text-sm text-muted-foreground">
                Your favorite programs do not currently have episode publish
                dates available for the feed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedItems.map((item) => {
                const episodeDescription = item.episode.description
                  ? compactText(item.episode.description, 180)
                  : null;

                return (
                  <button
                    key={`${item.program.id}:${item.episode.id}`}
                    type="button"
                    className="
                      w-full
                      rounded-2xl
                      border border-border/60
                      p-3 sm:p-4
                      text-left
                      hover:bg-muted/30
                      transition-colors
                    "
                    onClick={() => onOpenProgram(item.program)}
                  >
                    <div className="flex gap-3 sm:gap-4">
                      <img
                        src={
                          item.episode.thumbnail ??
                          item.program.program.thumbnail ??
                          '/placeholders/show-placeholder.png'
                        }
                        alt=""
                        className="
                          hidden sm:block
                          h-20 w-32
                          shrink-0
                          rounded-xl
                          bg-muted
                          object-cover
                        "
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex gap-3">
                          <div className="min-w-0 flex-1">
                            <h3
                              className="truncate text-sm sm:text-base font-medium"
                              title={item.episode.title}
                            >
                              {item.episode.title}
                            </h3>

                            <p
                              className="mt-1 truncate text-xs sm:text-sm text-muted-foreground"
                              title={item.program.program.title}
                            >
                              {item.program.program.title}
                            </p>
                          </div>

                          <Badge
                            variant={item.listened ? 'secondary' : 'default'}
                            className="shrink-0 self-start"
                          >
                            {item.listened ? 'Listened' : 'Unlistened'}
                          </Badge>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {item.program.platform}
                          </Badge>

                          <Badge variant="outline" className="text-xs">
                            Episode {item.episodeNumber}
                          </Badge>

                          <Badge variant="outline" className="text-xs">
                            {formatEpisodeDate(item.publishedAtMs)}
                          </Badge>

                          <Badge variant="outline" className="text-xs">
                            {formatRelativeTime(item.publishedAtMs, now)}
                          </Badge>

                          {item.episode.durationSeconds ? (
                            <Badge variant="outline" className="text-xs">
                              {formatDuration(item.episode.durationSeconds)}
                            </Badge>
                          ) : null}
                        </div>

                        {episodeDescription && (
                          <p
                            className="
                              mt-3
                              text-xs sm:text-sm
                              text-muted-foreground
                              line-clamp-2
                            "
                          >
                            {episodeDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function buildFavoriteFeed(
  programs: Program[],
  userState: UserProgramState[],
  now: number
): FavoriteFeedItem[] {
  const stateByProgram = new Map(
    userState.map((state) => [state.programId, state])
  );

  const items: FavoriteFeedItem[] = [];

  for (const program of programs) {
    const state = stateByProgram.get(program.id);

    if (!state?.isPinned) continue;

    const listenedThrough = state.lastListenedEpisode ?? 0;

    program.episodes.forEach((episode, index) => {
      const publishedAtMs = getEpisodeTimestamp(episode);

      // don't display undated or future episodes
      if (!publishedAtMs) return;
      if (publishedAtMs > now) return;

      items.push({
        program,
        episode,
        episodeNumber: index + 1,
        publishedAtMs,
        listened: index + 1 <= listenedThrough,
      });
    });
  }

  return items
    .sort((a, b) => b.publishedAtMs - a.publishedAtMs)
    .slice(0, MAX_FEED_ITEMS);
}

function getEpisodeTimestamp(episode: Episode): number {
  if (typeof episode.publishedAtUnix === 'number') {
    return episode.publishedAtUnix > 1_000_000_000_000
      ? episode.publishedAtUnix
      : episode.publishedAtUnix * 1000;
  }

  if (episode.publishedAt) {
    const parsed = new Date(episode.publishedAt).getTime();

    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function formatEpisodeDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatRelativeTime(timestamp: number, now: number) {
  const difference = Math.max(0, now - timestamp);

  const minutes = Math.floor(difference / 60_000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);

  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);

  return `${years}y ago`;
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function compactText(value: string, maxLength: number) {
  const cleaned = value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength).trimEnd()}…`;
}

function EmptyFavorites() {
  return (
    <div className="rounded-2xl border border-border/60 p-8 text-center">
      <div className="text-lg font-semibold">No favorites yet</div>

      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Add programs to your favorites with the star button and their newest
        episodes will appear here.
      </p>
    </div>
  );
}

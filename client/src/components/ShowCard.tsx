import type { Program } from '@/types/media';
import type { Preferences } from '@/lib/storage';
import type { UserProgramState } from '@/types/user';

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
import React from 'react';

type Props = {
  program: Program;
  userState?: UserProgramState;
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
  onUpdate,
  onUpdateEpisode,
  onOpen,
  onEdit,
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

  const progressPct =
    totalEpisodes > 0 ? Math.min(100, (lastEp / totalEpisodes) * 100) : 0;

  const latestEpisode = program.episodes[program.episodes.length - 1];

  function clamp(n: number) {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(Math.floor(n), totalEpisodes));
  }

  return (
    <Card
      onClick={() => onOpen?.(program)}
      className={`
    relative group overflow-hidden transition-shadow hover:shadow-xl
    ${prefs.compactCards ? 'p-2' : ''}
  `}
    >
      {!prefs.disablePinToTop && state.isPinned && (
        <div className="absolute top-1 left-1 text-yellow-500 text-xl">★</div>
      )}

      {!prefs.disablePinToTop && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePinned(program.id);
          }}
          className="
            absolute top-1 left-1
            text-yellow-500 text-xl
            opacity-0 group-hover:opacity-100
            transition-opacity
          "
        >
          {state.isPinned ? '★' : '☆'}
        </button>
      )}

      <CardHeader className="pb-3">
        <div className={prefs.compactCards ? 'flex gap-2' : 'flex gap-4'}>
          <img
            src={thumbnail}
            className={`
              rounded-xl object-cover bg-muted shrink-0
              ${prefs.compactCards ? 'h-12 w-[72px]' : 'h-16 w-24'}
            `}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-h-[3.25rem]">
                <h3 className="font-semibold text-base leading-tight line-clamp-2">
                  {program.program.title}
                </h3>

                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                  {program.program.hosts || 'Unknown host'}
                </p>
              </div>
            </div>

            {!prefs.hideTagsOnCard && (
              <div className="flex gap-1 mt-2 overflow-hidden">
                <Badge variant="secondary">{program.platform}</Badge>

                {program.program.categories?.[0] && (
                  <Badge variant="outline">
                    {program.program.categories[0]}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1">
        <div className="mt-auto space-y-3">
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
                <span>
                  Episode {lastEp} / {totalEpisodes || '?'}
                </span>
                <span>{Math.round(progressPct)}%</span>
              </div>

              <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
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
              onClick={(e) => e.stopPropagation()}
              onChange={(e) =>
                onUpdateEpisode(program.id, clamp(Number(e.target.value)))
              }
              className="w-16 sm:w-16 text-center"
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
    </Card>
  );
});

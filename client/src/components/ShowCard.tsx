import type { Program } from '@/types/media';
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

type Props = {
  program: Program;
  userState?: UserProgramState;
  onUpdate: (state: UserProgramState) => void;
  onUpdateEpisode: (programId: string, nextEpisode: number) => void;
  onOpen?: (program: Program) => void;
  onEdit?: (program: Program) => void;
  onTogglePinned: (programId: string) => void;

  prefs: {
    showTagsOnCard: boolean;
    showStatusOnCard: boolean;
    showLastEpisodeOnCard: boolean;
  };
};

export function ShowCard({
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
      className="relative group hover:shadow-xl transition-shadow overflow-hidden"
    >
      {state.isPinned && (
        <div className="absolute top-2 left-2 text-yellow-500 text-xl">★</div>
      )}

      <CardHeader className="flex flex-row gap-3 items-start">
        <img
          src={thumbnail}
          className="h-9 w-16 rounded-md object-cover bg-muted"
          onError={(e) => {
            e.currentTarget.src = '/placeholders/show-placeholder.png';
          }}
        />

        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="font-semibold truncate">{program.program.title}</h3>
          <span>
            {' '}
            <Badge className="text-xs bg-slate-800 text-muted-foreground truncate">
              {program.platform}
            </Badge>{' '}
            ·{' '}
            <Badge className="text-xs bg-slate-800 text-muted-foreground truncate">
              {program.program.hosts}
            </Badge>
          </span>

          {program.program.categories?.length ? (
            <div className="flex gap-1 mt-1 flex-wrap">
              {program.program.categories.slice(0, 3).map((c) => (
                <span
                  key={c}
                  className="text-[10px] px-2 py-0.5 border rounded-full text-muted-foreground"
                >
                  {c}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePinned(program.id);
          }}
          className="text-xs opacity-0 group-hover:opacity-100"
          size="sm"
        >
          {state.isPinned ? 'Unpin' : 'Pin'}
        </Button>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(program);
          }}
          className="text-xs opacity-0 group-hover:opacity-100"
          size="sm"
        >
          Edit
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {program.program.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {program.program.description}
          </p>
        )}

        {latestEpisode && (
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
            onChange={(e) =>
              onUpdateEpisode(program.id, clamp(Number(e.target.value)))
            }
            className="w-16 text-center border rounded"
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

        <Select
          value={state.status}
          onValueChange={(v) =>
            onUpdate({ ...state, status: v as UserProgramState['status'] })
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
      </CardContent>
    </Card>
  );
}

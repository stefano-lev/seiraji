import type { RadioShow, UserShowState } from '@/types/radio';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props = {
  show: RadioShow;
  userState?: UserShowState;
  onUpdate: (state: UserShowState) => void;
  onUpdateEpisode: (showId: string, nextEpisode: number) => void;
  onOpen?: (show: RadioShow) => void;
  onEdit?: (show: RadioShow) => void;
  onTogglePinned: (showId: string) => void;
  prefs: {
    showTagsOnCard: boolean;
    showStatusOnCard: boolean;
    showLastEpisodeOnCard: boolean;
  };
};

export function ShowCard({
  show,
  userState,
  onUpdate,
  onUpdateEpisode,
  onOpen,
  onEdit,
  onTogglePinned,
  prefs,
}: Props) {
  const state: UserShowState = userState ?? {
    showId: show.id,
    status: 'backlog',
    lastListenedEpisode: 0,
    isPinned: false,
    tags: [],
  };

  const iconSrc = show.iconUrl ?? '/placeholders/show-placeholder.png';

  return (
    <div className="will-change-transform hover:-translate-y-0.5 transition-transform h-full">
      <Card
        onClick={() => onOpen?.(show)}
        className="
    h-full
    relative
    group
    rounded-2xl
    border border-border/50
    bg-card
    shadow-md
    hover:shadow-xl
    transition-shadow
  "
      >
        {state.isPinned && (
          <div className="pointer-events-none absolute top-2 left-2 z-10">
            <div
              className="
                h-10 w-10 rounded-full
                flex items-center justify-center
                bg-yellow-500/15
                border border-yellow-500/30
                text-yellow-500
                shadow-sm
                backdrop-blur
              "
            >
              <span className="text-xl leading-none">★</span>
            </div>
          </div>
        )}

        <CardHeader className="relative flex flex-row items-center gap-4">
          <img
            src={iconSrc}
            onError={(e) => {
              e.currentTarget.src = '/placeholders/show-placeholder.png';
            }}
            alt={`${show.title} icon`}
            className="h-12 w-12 rounded-md object-cover bg-muted"
          />

          <div className="flex flex-col">
            <h3 className="text-lg font-semibold leading-tight line-clamp-2">
              {show.title}
            </h3>

            <p className="text-sm text-muted-foreground line-clamp-1">
              {show.hosts.join(', ')}
            </p>
          </div>

          <button
            className=" absolute top-3 right-12 rounded-md px-2 py-1 text-xs
                bg-secondary text-secondary-foreground opacity-0
                group-hover:opacity-100 active:scale-95 shadow-sm transition-opacity
                "
            onClick={(e) => {
              e.stopPropagation();
              onTogglePinned(show.id);
            }}
          >
            {state.isPinned ? '★' : '☆'}
          </button>

          <button
            className="
              absolute top-3 right-3
              rounded-md px-2 py-1 text-xs
              bg-secondary text-secondary-foreground
              opacity-0 group-hover:opacity-100
              active:scale-95
              shadow-sm
              transition-opacity
            "
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(show);
            }}
          >
            Edit
          </button>
        </CardHeader>

        <CardContent className="space-y-2">
          {prefs.showStatusOnCard && <p>Status: {state.status}</p>}

          {prefs.showLastEpisodeOnCard && (
            <p>Last episode: {state.lastListenedEpisode ?? '—'}</p>
          )}
        </CardContent>

        <CardContent
          className="space-y-3 mt-2 pt-4 border-t border-border/50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="rounded-xl bg-muted/20 border border-border/40 p-3 space-y-3">
            {/* Status Selector */}
            <div className="flex flex-col">
              <label className="text-sm mb-1">Status</label>
              <Select
                value={state.status}
                onValueChange={(v) => {
                  onUpdate({
                    ...state,
                    status: v as UserShowState['status'],
                  });
                }}
              >
                <SelectTrigger className="w-full bg-background/90">
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

            {/* Tags display */}
            {prefs.showTagsOnCard && (state.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1">
                {state.tags!.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded-full border bg-muted/40 text-muted-foreground"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Episode Controls */}
            <div className="flex flex-col">
              <label className="text-sm mb-1">Last Episode</label>
              <div className="flex items-center gap-2">
                {/* Decrement */}
                <button
                  className="
                  rounded-md px-3 py-1
                  bg-secondary text-secondary-foreground
                  hover:bg-secondary/80
                  active:scale-95
                  shadow-sm
                  transition-all
                "
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateEpisode(
                      show.id,
                      Math.max(0, (state.lastListenedEpisode ?? 0) - 1)
                    );
                  }}
                >
                  −
                </button>

                {/* Input */}
                <input
                  type="number"
                  className="
                  w-20 text-center rounded-md border border-border/60 p-2
                  bg-background/90 text-foreground
                  focus:outline-none focus:ring-2 focus:ring-ring
                  hover:border-border
                  transition
                "
                  value={state.lastListenedEpisode ?? ''}
                  min={0}
                  onChange={(e) => {
                    e.stopPropagation();
                    onUpdateEpisode(show.id, Number(e.target.value));
                  }}
                />

                {/* Increment */}
                <button
                  className="
                  rounded-md px-3 py-1
                  bg-secondary text-secondary-foreground
                  hover:bg-secondary/80
                  active:scale-95
                  shadow-sm
                  transition-all
                "
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateEpisode(
                      show.id,
                      (state.lastListenedEpisode ?? 0) + 1
                    );
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

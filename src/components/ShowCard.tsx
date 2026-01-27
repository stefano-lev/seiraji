import type { RadioShow, UserShowState } from '@/types/radio';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type Props = {
  show: RadioShow;
  userState?: UserShowState;
  onUpdate: (state: UserShowState) => void;
  onOpen?: (show: RadioShow) => void;
  onEdit?: (show: RadioShow) => void;
};

export function ShowCard({ show, userState, onUpdate, onOpen, onEdit }: Props) {
  const state: UserShowState = userState ?? {
    showId: show.id,
    status: 'backlog',
    completedEpisodes: [],
  };

  const iconSrc = show.iconUrl ?? '/placeholders/show-placeholder.png';

  return (
    <div className="transition-transform hover:-translate-y-1">
      <Card
        onClick={() => onOpen?.(show)}
        className="
          group
          rounded-2xl
          border border-border/50
          bg-background/80
          backdrop-blur-sm
          shadow-md
          hover:shadow-xl
          transition-shadow
        "
      >
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
            <h3 className="text-lg font-semibold leading-tight">
              {show.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {show.hosts.join(', ')}
            </p>
          </div>

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

        <CardContent className=""> </CardContent>

        <CardContent className="space-y-2">
          <p>Status: {state.status}</p>

          <p>Last episode: {state.lastListenedEpisode ?? '—'}</p>
        </CardContent>

        <CardContent className="space-y-3" onClick={(e) => e.stopPropagation()}>
          {/* Status Selector */}
          <div className="flex flex-col">
            <label className="text-sm mb-1">Status</label>
            <select
              className="
                w-full rounded-md border border-border/60 p-2
                bg-background/90 text-foreground
                focus:outline-none focus:ring-2 focus:ring-ring
                hover:border-border
                transition
              "
              value={state.status}
              onChange={(e) => {
                e.stopPropagation();
                onUpdate({
                  ...state,
                  status: e.target.value as UserShowState['status'],
                });
              }}
            >
              <option value="listening">Listening</option>
              <option value="backlog">Backlog</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>

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
                  onUpdate({
                    ...state,
                    lastListenedEpisode: Math.max(
                      0,
                      (state.lastListenedEpisode ?? 0) - 1
                    ),
                  });
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
                  onUpdate({
                    ...state,
                    lastListenedEpisode: Number(e.target.value),
                  });
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
                  onUpdate({
                    ...state,
                    lastListenedEpisode: (state.lastListenedEpisode ?? 0) + 1,
                  });
                }}
              >
                +
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

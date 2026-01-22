import type { RadioShow, UserShowState } from '@/types/radio';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { motion } from 'framer-motion';

type Props = {
  show: RadioShow;
  userState?: UserShowState;
  onUpdate: (state: UserShowState) => void;
};

export function ShowCard({ show, userState, onUpdate }: Props) {
  const state: UserShowState = userState ?? {
    showId: show.id,
    status: 'backlog',
    completedEpisodes: [],
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.015 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <Card
        className="
          rounded-2xl
          border border-border/50
          bg-background/80
          backdrop-blur-sm
          shadow-md
          hover:shadow-xl
          transition-shadow
        "
      >
        <CardHeader>
          <h3 className="text-lg font-semibold">{show.title}</h3>
          <p className="text-sm text-muted-foreground">
            {show.hosts.join(', ')}
          </p>
        </CardHeader>

        <CardContent className="space-y-2">
          <motion.p
            key={state.status}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            Status: {state.status}
          </motion.p>

          <p>Last episode: {state.lastListenedEpisode ?? '—'}</p>
        </CardContent>

        <CardContent className="space-y-3">
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
              onChange={(e) =>
                onUpdate({
                  ...state,
                  status: e.target.value as UserShowState['status'],
                })
              }
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
                onClick={() =>
                  onUpdate({
                    ...state,
                    lastListenedEpisode: Math.max(
                      0,
                      (state.lastListenedEpisode ?? 0) - 1
                    ),
                  })
                }
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
                onChange={(e) =>
                  onUpdate({
                    ...state,
                    lastListenedEpisode: Number(e.target.value),
                  })
                }
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
                onClick={() =>
                  onUpdate({
                    ...state,
                    lastListenedEpisode: (state.lastListenedEpisode ?? 0) + 1,
                  })
                }
              >
                +
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

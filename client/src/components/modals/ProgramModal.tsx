import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';

import type { Program } from '@/types/media';
import type { UserProgramState } from '@/types/user';
import { Preferences } from '@/lib/storage';
import { calculateProgramRuntime } from '@/lib/stats';

type ProgramModalProps = {
  open: boolean;
  onClose: () => void;

  program: Program | null;

  getProgramState: (programId: string) => UserProgramState;
  updateProgramState: (state: UserProgramState) => void;

  onEdit: (program: Program) => void;
  onDelete: (programId: string) => void;

  tagDraft: string;
  setTagDraft: (v: string) => void;

  prefs: Preferences;
};

export function ProgramModal({
  open,
  onClose,
  program,
  getProgramState,
  updateProgramState,
  onEdit,
  onDelete,
  tagDraft,
  setTagDraft,
  prefs,
}: ProgramModalProps) {
  if (!open || !program) return null;

  const programData = program;
  const currentState = getProgramState(programData.id);
  const listenedCount = currentState.lastListenedEpisode ?? 0;

  const displayedEpisodes = prefs.reverseEpisodeOrder
    ? [...programData.episodes].reverse()
    : programData.episodes;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => {
        onClose();
      }}
    >
      <motion.div
        className="
          w-full
          h-[100dvh]
          sm:h-[90vh]
          max-w-5xl
          rounded-2xl
          sm:rounded-3xl
          border border-border/60
          bg-background
          shadow-2xl
          overflow-hidden
          flex flex-col
        "
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HERO HEADER */}
        <div className="relative">
          <div className="h-32 sm:h-52 w-full bg-muted overflow-hidden">
            <img
              src={
                programData.program.thumbnail ??
                '/placeholders/show-placeholder.png'
              }
              className="w-full h-full object-cover opacity-20"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

          <div
            className="
              absolute bottom-0 left-0 right-0
              p-4 sm:p-6
              flex flex-col sm:flex-row
              gap-4 sm:gap-6
            "
          >
            <img
              src={
                programData.program.thumbnail ??
                '/placeholders/show-placeholder.png'
              }
              className="
                h-16 w-24
                sm:w-48 sm:h-32
                rounded-2xl
                object-cover
                border border-border
                shadow-xl
                shrink-0
              "
            />

            <div className="flex-1 min-w-0">
              <div
                className="
                  flex flex-col sm:flex-row
                  sm:items-start
                  sm:justify-between
                  gap-4
                "
              >
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
                    {programData.program.title}
                  </h2>

                  <p className="text-muted-foreground mt-2">
                    {(programData.program.hosts ?? []) || 'Unknown host'}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge>{programData.platform}</Badge>

                    {programData.program.categories?.map((c) => (
                      <Badge key={c} variant="secondary">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  {programData.source == 'manual' && (
                    <Button
                      className="w-full sm:w-auto"
                      variant="secondary"
                      onClick={() => onEdit(programData)}
                    >
                      Edit
                    </Button>
                  )}

                  {programData.source == 'manual' && (
                    <Button
                      className="w-full sm:w-auto"
                      variant="destructive"
                      onClick={() => {
                        const ok = window.confirm(
                          `Delete "${programData.program.title}"?`
                        );

                        if (!ok) return;

                        onDelete(programData.id);

                        onClose();
                      }}
                    >
                      Delete
                    </Button>
                  )}

                  <Button
                    className="w-full sm:w-auto"
                    variant="default"
                    onClick={() => onClose()}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] h-full">
            {/* SIDEBAR */}
            <div
              className="
                border-b xl:border-b-0
                xl:border-r
                border-border/60
                p-4 sm:p-6
                overflow-y-auto
              "
            >
              <div className="space-y-6">
                {/* DESCRIPTION */}
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {programData.program.description ??
                      'No description available.'}
                  </p>
                </div>

                {/* PROGRAM META */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Program Info</h3>

                  <div className="rounded-2xl border border-border/60 p-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Episodes</span>
                      <span>{programData.meta.episodeCount}</span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Source</span>
                      <span>{programData.source}</span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Platform</span>
                      <span>{programData.platform}</span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Runtime</span>
                      <span>
                        {Math.round(
                          calculateProgramRuntime(programData) / 3600
                        )}{' '}
                        hrs
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Cached</span>
                      <span>
                        {new Date(
                          programData.meta.cachedAt
                        ).toLocaleDateString()}
                      </span>
                    </div>

                    {programData.program.schedule && (
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Schedule</span>
                        <span>{programData.program.schedule}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* USER TAGS */}
                <div>
                  <h3 className="font-semibold mb-2">Your Tags</h3>

                  <Input
                    type="text"
                    placeholder="anime, comfy, comedy"
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onBlur={() => {
                      const raw = tagDraft
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean);

                      const normalized = Array.from(
                        new Set(raw.map((t) => t.toLowerCase()))
                      );

                      const current = getProgramState(programData!.id);

                      updateProgramState({
                        ...current,
                        tags: normalized,
                      });

                      setTagDraft(normalized.join(', '));
                    }}
                  />

                  <div className="flex flex-wrap gap-2 mt-3">
                    {(getProgramState(programData.id).tags ?? []).map((tag) => (
                      <Badge key={tag} variant="outline">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* EXTERNAL LINK */}
                <div>
                  {programData.url && (
                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={() => window.open(programData.url, '_blank')}
                    >
                      Open Source Page
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* EPISODES */}
            <div className="overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-xl font-semibold">Episodes</h3>

                  <p className="text-sm text-muted-foreground">
                    {programData.episodes.length} episodes available
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {displayedEpisodes.map((ep) => {
                  const originalIndex = programData.episodes.findIndex(
                    (e) => e.id === ep.id
                  );

                  const isCompleted = originalIndex < listenedCount;

                  if (prefs.hideCompletedEpisodes && isCompleted) {
                    return null;
                  }

                  return (
                    <div
                      key={ep.id}
                      className={`
                            rounded-2xl border p-4 transition-colors
                            ${
                              isCompleted
                                ? 'border-green-500/30 bg-green-500/5'
                                : 'border-border/60 hover:bg-muted/40'
                            }
                            `}
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        {!prefs.hideEpisodeThumbnails && (
                          <img
                            loading="lazy"
                            decoding="async"
                            src={
                              ep.thumbnail ??
                              programData.program.thumbnail ??
                              '/placeholders/show-placeholder.png'
                            }
                            className="
                              w-full
                              sm:w-36
                              h-40
                              sm:h-20
                              rounded-xl
                              object-cover
                              bg-muted
                              shrink-0
                            "
                          />
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium leading-snug">
                                  {ep.title}
                                </h4>

                                {isCompleted && (
                                  <div
                                    className="
                                            h-5 w-5 rounded-full
                                            bg-green-500/15
                                            border border-green-500/30
                                            flex items-center justify-center
                                            text-[11px]
                                            text-green-400
                                            shrink-0
                                        "
                                  >
                                    ✓
                                  </div>
                                )}
                              </div>

                              {ep.publishedAt ? (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(
                                    ep.publishedAt
                                  ).toLocaleDateString()}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {ep.platformMetadata?.displayDate ??
                                    'Unknown date'}
                                </p>
                              )}
                            </div>

                            {ep.durationSeconds && (
                              <Badge variant="outline">
                                {Math.floor(ep.durationSeconds / 60)}m
                              </Badge>
                            )}
                          </div>

                          {ep.description && (
                            <p className="text-sm text-muted-foreground mt-3 line-clamp-3">
                              {ep.description}
                            </p>
                          )}

                          {ep.tags && ep.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {ep.tags.slice(0, 6).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}

                              {ep.tags.length > 6 && (
                                <Badge variant="outline" className="text-xs">
                                  +{ep.tags.length - 6} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

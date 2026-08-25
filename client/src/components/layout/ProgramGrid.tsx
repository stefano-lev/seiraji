import { ShowCard } from '@/components/ShowCard';
import { Preferences } from '@/lib/storage';

import type { Program } from '@/types/media';
import type { UserProgramState } from '@/types/user';
import type { SortMode } from '@/types/sort';

type Props = {
  programs: Program[];
  userState: UserProgramState[];

  sortMode: SortMode;
  now: number;

  onUpdate: (state: UserProgramState) => void;
  onUpdateEpisode: (programId: string, nextEpisode: number) => void;

  onOpen: (program: Program) => void;
  onEdit: (program: Program) => void;

  onTogglePinned: (programId: string) => void;

  prefs: Preferences;
};

export function ProgramGrid({
  programs,
  userState,
  sortMode,
  now,
  onUpdate,
  onUpdateEpisode,
  onOpen,
  onEdit,
  onTogglePinned,
  prefs,
}: Props) {
  return (
    <div
      className={`
        mt-6 grid content-start auto-rows-fr
        ${prefs.compactCards ? 'gap-3' : 'gap-5'}
        ${
          prefs.compactCards
            ? 'grid-cols-[repeat(auto-fill,minmax(240px,1fr))]'
            : 'grid-cols-[repeat(auto-fill,minmax(300px,1fr))]'
        }
      `}
    >
      {programs.map((program) => (
        <ShowCard
          key={program.id}
          program={program}
          userState={userState.find((s) => s.programId === program.id)}
          sortMode={sortMode}
          now={now}
          onUpdate={onUpdate}
          onUpdateEpisode={onUpdateEpisode}
          onOpen={onOpen}
          onEdit={onEdit}
          onTogglePinned={onTogglePinned}
          prefs={prefs}
        />
      ))}
    </div>
  );
}

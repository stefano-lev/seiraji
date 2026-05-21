import { ShowCard } from '@/components/ShowCard';
import { Preferences } from '@/lib/storage';

import type { Program } from '@/types/media';
import type { UserProgramState } from '@/types/user';

type Props = {
  programs: Program[];
  userState: UserProgramState[];

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
        mt-6 grid content-start
        ${prefs.compactCards ? 'gap-3' : 'gap-5'}
        ${
          prefs.compactCards
            ? 'grid-cols-[repeat(auto-fill,minmax(280px,1fr))]'
            : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
        }
      `}
    >
      {programs.map((program) => (
        <ShowCard
          key={program.id}
          program={program}
          userState={userState.find((s) => s.programId === program.id)}
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

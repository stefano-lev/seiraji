import type React from 'react';
import { motion } from 'framer-motion';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Button } from './components/ui/button';

import { defaultPrograms, demoTags } from '@/data/demoPrograms';

import type { Program } from './types/media';
import type { UserProgramState } from './types/user';

import type {} from '@/lib/storage';
import {
  loadActivity,
  saveActivity,
  ActivityEvent,
  appendActivityEvent,
  loadPrefs,
  savePrefs,
  loadUserState,
  saveUserState,
} from '@/lib/storage';

//import { processImageFile } from '@/lib/image';

import { getLibrary } from './lib/api';

import { calculateStats } from '@/lib/stats';

import {
  buildExportPayload,
  downloadJson,
  isExportPayload,
  readJsonFile,
} from '@/lib/storage';

import { TopNav } from './components/layout/TopNav';
import { ProgramGrid } from './components/layout/ProgramGrid';
import { ProgramFilters } from './components/layout/TopFilters';
import { StatsModal } from './components/modals/StatsModal';
import { HistoryModal } from './components/modals/HistoryModal';
import { ProgramModal } from './components/modals/ProgramModal';
import { PreferencesModal } from './components/modals/PreferencesModal';

type SortMode = 'title' | 'host' | 'platform';

// type EditableFieldProps = {
//   label: string;
//   value: React.ReactNode;
//   isEditing: boolean;
//   renderInput: () => React.ReactNode;
// };

// function EditableField({
//   label,
//   value,
//   isEditing,
//   renderInput,
// }: EditableFieldProps) {
//   return (
//     <div className="mb-3">
//       <label className="text-sm mb-1 block">{label}</label>
//       {isEditing ? (
//         renderInput()
//       ) : (
//         <div className="text-sm text-muted-foreground">{value}</div>
//       )}
//     </div>
//   );
// }

export default function App() {
  const [dark, setDark] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('title');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [editDraft, setEditDraft] = useState<Program | null>(null);

  // const isEditing = editDraft !== null;

  // const programData = editDraft ?? selectedProgram;

  const importInputRef = useRef<HTMLInputElement | null>(null);

  const [programs, setPrograms] = useState<Program[]>(() => {
    const stored = localStorage.getItem('programs');
    const parsed: Program[] = stored ? JSON.parse(stored) : defaultPrograms;

    return parsed.map((s) => ({
      ...s,
      // episodeDurationMinutes: s.episodeDurationMinutes ?? 30,
      // manualTotalEpisodes: s.manualTotalEpisodes ?? null,
      // isHiatus: s.isHiatus ?? false,
      // isEnded: s.isEnded ?? false,
    }));
  });

  useEffect(() => {
    async function load() {
      try {
        setLibraryLoading(true);

        const data = await getLibrary();

        setPrograms(data);
        setLibraryLoaded(true);
      } catch (err) {
        console.error('Failed to load library', err);
      } finally {
        setLibraryLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    localStorage.setItem('programs', JSON.stringify(programs));
  }, [programs]);

  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryLoaded, setLibraryLoaded] = useState(false);

  const [programOnboarding, setProgramOnboarding] = useState(() => {
    const mode = localStorage.getItem('seiraji:mode');
    const hasSeenOnboarding = localStorage.getItem('seiraji:onboarded');
    return !mode && !hasSeenOnboarding;
  });

  const [isDemo, setIsDemo] = useState(() => {
    return localStorage.getItem('seiraji:mode') === 'demo';
  });

  const [tagDraft, setTagDraft] = useState('');

  const [prefs, setPrefs] = useState(() => loadPrefs());

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  const [userState, setUserState] = useState<UserProgramState[]>(() =>
    loadUserState()
  );

  useEffect(() => {
    saveUserState(userState);
  }, [userState]);

  const tags = useMemo(() => {
    const set = new Set<string>();

    for (const state of userState) {
      for (const tag of state.tags ?? []) {
        set.add(tag);
      }
    }

    return [...set].sort((a, b) => a.localeCompare(b));
  }, [userState]);

  const [statsOpen, setStatsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);

  const [activity, setActivity] = useState<ActivityEvent[]>(() =>
    loadActivity()
  );

  useEffect(() => {
    saveActivity(activity);
  }, [activity]);

  const [tagFilter, setTagFilter] = useState<string | 'all'>('all');

  // avoid using Date.now directly, cache it instead
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000); // update every min
    return () => window.clearInterval(id);
  }, []);

  const stats = useMemo(
    () => calculateStats(programs, userState),
    [programs, userState]
  );

  function startFresh() {
    setPrograms(programs);
    setUserState([]);
    setActivity([]);

    localStorage.setItem('seiraji:mode', 'fresh');
    localStorage.setItem('seiraji:onboarded', 'true');
    setIsDemo(false);
  }

  async function loadDemo() {
    try {
      setLibraryLoading(true);

      let libraryPrograms = programs;

      // if programs haven't loaded yet, fetch them now
      if (!libraryLoaded || programs.length === 0) {
        libraryPrograms = await getLibrary();

        setPrograms(libraryPrograms);
        setLibraryLoaded(true);
      }

      setUserState(generateDemoState(libraryPrograms));

      localStorage.setItem('seiraji:mode', 'demo');
      localStorage.setItem('seiraji:onboarded', 'true');

      setIsDemo(true);
      setProgramOnboarding(false);
    } catch (err) {
      console.error('Failed to load demo', err);

      alert(
        'The library is still in the progress of loading. Please try again in a few seconds.'
      );
    } finally {
      setLibraryLoading(false);
    }
  }

  function generateDemoState(programs: Program[]): UserProgramState[] {
    function randomInt(min: number, max: number) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randomChance(probability: number) {
      return Math.random() < probability;
    }

    function pickRandomTags(): string[] {
      const shuffled = [...demoTags].sort(() => Math.random() - 0.5);

      const count = randomInt(1, 3);

      return shuffled.slice(0, count);
    }

    return programs.map((p) => {
      const episodeCount = Math.max(p.episodes?.length ?? 0, 1);

      let progress = 0;
      let status: UserProgramState['status'] = 'backlog';

      const roll = Math.random();

      if (roll < 0.6) {
        status = 'listening';

        progress = randomInt(
          Math.max(1, Math.floor(episodeCount * 0.05)),
          Math.max(1, Math.floor(episodeCount * 0.85))
        );
      } else if (roll < 0.8) {
        status = 'completed';
        progress = episodeCount;
      } else if (roll < 0.95) {
        status = 'backlog';
        progress = 0;
      } else {
        status = 'dropped';

        progress = randomInt(1, Math.max(1, Math.floor(episodeCount * 0.4)));
      }

      return {
        programId: p.id,
        status,
        lastListenedEpisode: progress,

        isPinned: randomChance(0.2),

        tags: pickRandomTags(),
      };
    });
  }

  function timeAgo(iso: string, nowMs: number) {
    const ms = nowMs - new Date(iso).getTime();
    const s = Math.max(0, Math.floor(ms / 1000));

    if (s < 10) return 'just now';
    if (s < 60) return `${s}s ago`;

    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;

    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;

    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  function updateEpisode(programId: string, nextEpisode: number) {
    const prev = userState.find((s) => s.programId === programId);
    const prevEpisode = prev?.lastListenedEpisode ?? 0;

    const delta = nextEpisode - prevEpisode;
    if (delta === 0) return;

    // update user state
    updateProgramState({
      ...getProgramState(programId),
      lastListenedEpisode: nextEpisode,
    });

    // log event
    const ev: ActivityEvent = {
      id: crypto.randomUUID(),
      ts: new Date().toISOString(),
      type: 'episode_progress',
      programId,
      episode: nextEpisode,
      delta,
    };

    setActivity((prevEvents) => {
      const next = appendActivityEvent(prevEvents, ev);
      saveActivity(next);
      return next;
    });
  }

  function getProgramState(programId: string): UserProgramState {
    return (
      userState.find((s) => s.programId === programId) ?? {
        programId,
        status: 'backlog',
        lastListenedEpisode: 0,
        isPinned: false,
      }
    );
  }

  function togglePinned(programId: string) {
    const current = getProgramState(programId);

    updateProgramState({
      ...current,
      isPinned: !current.isPinned,
    });
  }

  function handleExport() {
    const payload = buildExportPayload(programs, userState, tags);
    downloadJson('seiyuu-radio-tracker-backup.json', payload);
  }

  async function handleImportFile(file: File) {
    try {
      const data = await readJsonFile(file);

      if (!isExportPayload(data)) {
        alert('Invalid import file format.');
        return;
      }

      const confirmOverwrite = window.confirm(
        'Import will overwrite your current local data. Continue?'
      );
      if (!confirmOverwrite) return;

      setPrograms(data.programs);
      setUserState(data.userState);

      alert('Import successful!');
    } catch (err) {
      console.error(err);
      alert('Failed to import file.');
    }
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    UserProgramState['status'] | 'all'
  >('all');

  function updateProgramState(updated: UserProgramState) {
    setUserState((prev) =>
      prev.some((s) => s.programId === updated.programId)
        ? prev.map((s) => (s.programId === updated.programId ? updated : s))
        : [...prev, updated]
    );
  }

  // function updateProgram(updated: Program) {
  //   setPrograms((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  // }

  // function addShow(newProgram: Program) {
  //   setPrograms((prev) => [...prev, newProgram]);
  // }

  // function deleteProgram(id: string) {
  //   setPrograms((prev) => prev.filter((s) => s.id !== id));
  // }

  function deleteAllData() {
    const ok = window.confirm(
      'Delete ALL of your tracker data?\n(This cannot be undone!)'
    );
    if (!ok) return;

    setActivity([]);
    setPrograms([]);
    setUserState([]);

    // clear localStorage for relevant keys
    localStorage.removeItem('programs');
    localStorage.removeItem('userState');
  }

  function deleteAllTags() {
    const ok = window.confirm(
      'Delete ALL tags from every show?\n(This cannot be undone.)'
    );
    if (!ok) return;

    setUserState((prev) =>
      prev.map((s) => ({
        ...s,
        tags: [],
      }))
    );
  }

  const [pinnedOnly, setPinnedOnly] = useState(false);

  const visiblePrograms = useMemo(() => {
    return [...programs]
      .filter((program) => {
        const query = searchQuery.toLowerCase();

        const hosts = Array.isArray(program.program.hosts)
          ? program.program.hosts
          : [];

        const matchesSearch =
          program.program.title.toLowerCase().includes(query) ||
          hosts.some((h) => h.toLowerCase().includes(query));

        if (!matchesSearch) return false;

        const state = userState.find((s) => s.programId === program.id);

        if (prefs.hideDroppedPrograms && state?.status === 'dropped') {
          return false;
        }

        if (prefs.hideCompletedPrograms && state?.status === 'completed') {
          return false;
        }

        if (statusFilter !== 'all') {
          if (state?.status !== statusFilter) return false;
        }

        if (tagFilter !== 'all') {
          const programTags = state?.tags ?? [];
          if (!programTags.includes(tagFilter)) return false;
        }

        if (pinnedOnly) {
          if (!state?.isPinned) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aPinned = userState.find((s) => s.programId === a.id)?.isPinned
          ? 1
          : 0;
        const bPinned = userState.find((s) => s.programId === b.id)?.isPinned
          ? 1
          : 0;

        if (!prefs.disablePinToTop) {
          if (aPinned !== bPinned) {
            return bPinned - aPinned;
          }
        }

        if (sortMode === 'title') {
          return a.program.title.localeCompare(b.program.title, 'ja');
        }

        if (sortMode === 'platform') {
          return a.platform.localeCompare(b.platform, 'ja');
        }

        const aHosts = Array.isArray(a.program.hosts) ? a.program.hosts : [];

        const bHosts = Array.isArray(b.program.hosts) ? b.program.hosts : [];

        const aHost = aHosts[0] ?? '';
        const bHost = bHosts[0] ?? '';

        return aHost.localeCompare(bHost, 'ja');
      });
  }, [
    programs,
    userState,
    sortMode,
    searchQuery,
    statusFilter,
    tagFilter,
    pinnedOnly,
    prefs,
  ]);

  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ctrl+F focuses search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      // Escape clears search box
      if (e.key === 'Escape') {
        if (document.activeElement === searchRef.current) {
          setSearchQuery('');
          searchRef.current?.blur();
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="app-bg min-h-screen bg-background text-foreground">
        <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-8 pb-16">
          <TopNav
            onOpenStats={() => setStatsOpen(true)}
            onOpenHistory={() => setHistoryOpen(true)}
            onOpenPrefs={() => setPrefsOpen(true)}
            onResetSelection={() => {
              setSelectedProgram(null);
              setEditDraft(null);
            }}
          />

          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              handleImportFile(file);
              e.currentTarget.value = ''; // allow re-importing same file later
            }}
          />

          {programOnboarding && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => {}}
            >
              <motion.div
                className="max-w-md w-full rounded-2xl bg-background p-6 shadow-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-semibold mb-2">
                  Welcome to SeiRaji
                </h2>

                <p className="text-sm text-muted-foreground mb-4">
                  Start with a blank tracker, or load a demo profile to explore
                  how the app works.
                </p>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="secondary"
                    onClick={startFresh}
                    disabled={libraryLoading}
                  >
                    {libraryLoading ? 'Loading Library...' : 'Start Fresh'}
                  </Button>

                  <Button onClick={loadDemo} disabled={libraryLoading}>
                    {libraryLoading ? 'Loading Library...' : 'Load Demo'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Controls */}
          <ProgramFilters
            searchRef={searchRef}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            isDemo={isDemo}
            onEndDemo={() => {
              const ok = window.confirm(
                'End the Demo and start fresh?\n(This cannot be undone!)'
              );

              if (!ok) return;

              startFresh();
            }}
            pinnedOnly={pinnedOnly}
            onTogglePinned={() => setPinnedOnly(!pinnedOnly)}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            tagFilter={tagFilter}
            onTagFilterChange={setTagFilter}
            sortMode={sortMode}
            onSortModeChange={setSortMode}
            tags={tags}
            visibleCount={visiblePrograms.length}
            totalCount={programs.length}
          />

          {/* Show cards */}
          <ProgramGrid
            programs={visiblePrograms}
            userState={userState}
            onUpdate={updateProgramState}
            onUpdateEpisode={updateEpisode}
            onOpen={(program) => {
              setEditDraft(null);
              setSelectedProgram(program);

              const currentTags = getProgramState(program.id).tags ?? [];
              setTagDraft(currentTags.join(', '));
            }}
            onEdit={(program) => {
              setEditDraft(program);
              setSelectedProgram(program);

              const currentTags = getProgramState(program.id).tags ?? [];
              setTagDraft(currentTags.join(', '));
            }}
            onTogglePinned={togglePinned}
            prefs={prefs}
          />

          <ProgramModal
            open={!!selectedProgram}
            program={selectedProgram}
            onClose={() => setSelectedProgram(null)}
            getProgramState={getProgramState}
            updateProgramState={updateProgramState}
            tagDraft={tagDraft}
            setTagDraft={setTagDraft}
            prefs={prefs}
          />

          <StatsModal
            open={statsOpen}
            onClose={() => setStatsOpen(false)}
            stats={stats}
            onDeleteAllTags={deleteAllTags}
            onDeleteAllData={deleteAllData}
          />

          <HistoryModal
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
            history={activity}
            programs={programs}
            now={now}
            timeAgo={timeAgo}
            onClearHistory={() => setActivity([])}
          />

          <PreferencesModal
            open={prefsOpen}
            onClose={() => setPrefsOpen(false)}
            prefs={prefs}
            setPrefs={setPrefs}
          />
        </div>
      </div>
    </div>
  );
}

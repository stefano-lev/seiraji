import type React from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Button } from './components/ui/button';

import { demoTags } from '@/data/demoPrograms';

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
  loadCloudBackupCredentials,
  saveCloudBackupCredentials,
} from '@/lib/storage';

import {
  getLibrary,
  createBackup,
  updateBackup,
  restoreBackup,
  refreshProgram,
} from './lib/api';

import { calculateProgramRuntime, calculateStats } from '@/lib/stats';

import { mergePrograms } from '@/lib/programs';

import { TopNav } from './components/layout/TopNav';
import { ProgramGrid } from './components/layout/ProgramGrid';
import { ProgramFilters } from './components/layout/TopFilters';
import { StatsModal } from './components/modals/StatsModal';
import { HistoryModal } from './components/modals/HistoryModal';
import { ProgramModal } from './components/modals/ProgramModal';
import { PreferencesModal } from './components/modals/PreferencesModal';
import { CreateProgramModal } from './components/modals/CreateProgramModal';

type SortMode =
  | 'title'
  | 'host'
  | 'platform'
  | 'episodeCount'
  | 'recentlyUpdated'
  | 'runtime'
  | 'progress';

export default function App() {
  const [dark] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('title');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [editDraft, setEditDraft] = useState<Program | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string[]>([]);

  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [librarySlow, setLibrarySlow] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  const [programs, setPrograms] = useState<Program[]>([]);

  const loadLibrary = useCallback(async () => {
    let slowTimer: number | undefined;
    let toastId: string | number | undefined;

    try {
      setLibraryLoading(true);
      setLibraryError(null);
      setLibrarySlow(false);

      slowTimer = window.setTimeout(() => {
        setLibrarySlow(true);

        toastId = toast.loading('Waking up library server', {
          description:
            'The backend may be starting up. First load can take a little longer.',
        });
      }, 30000);

      const data = await getLibrary();

      const manualPrograms: Program[] = JSON.parse(
        localStorage.getItem('manualPrograms') ?? '[]'
      );

      setPrograms(mergePrograms(data, manualPrograms));
      setLibraryLoaded(true);

      if (toastId) {
        toast.success('Library loaded', {
          id: toastId,
          description: `${data.length} imported programs synced.`,
        });
      }
    } catch (err) {
      console.error('Failed to load library', err);

      setLibraryLoaded(false);
      setLibraryError(
        'Unable to load the program library. The backend may still be starting up. Please try again in ~30 seconds.'
      );

      if (toastId) {
        toast.error('Library failed to load', {
          id: toastId,
          description: 'Please try again in a moment.',
        });
      } else {
        toast.error('Library failed to load', {
          description: 'Please try again in a moment.',
        });
      }
    } finally {
      if (slowTimer) {
        window.clearTimeout(slowTimer);
      }

      setLibraryLoading(false);
      setLibrarySlow(false);
    }
  }, []);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  useEffect(() => {
    if (!libraryLoaded) return;

    localStorage.setItem(
      'manualPrograms',
      JSON.stringify(programs.filter((p) => p.source === 'manual'))
    );
  }, [programs, libraryLoaded]);

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
  const [createOpen, setCreateOpen] = useState(false);

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
    setPrograms(programs.filter((p) => p.source !== 'manual'));
    setUserState([]);
    setActivity([]);

    localStorage.setItem('seiraji:mode', 'fresh');
    localStorage.setItem('seiraji:onboarded', 'true');
    setIsDemo(false);
  }

  const [cloudBackup, setCloudBackup] = useState(() =>
    loadCloudBackupCredentials()
  );

  const [backupLoading, setBackupLoading] = useState(false);

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

      toast.warning('Library still loading', {
        description: 'Please try again in a few seconds.',
      });
    } finally {
      setLibraryLoading(false);
    }
  }

  function createProgressToast(title: string) {
    const toastId = toast.loading(title, {
      description: 'Connecting...',
    });

    const timers = [
      setTimeout(() => {
        toast.loading(title, {
          id: toastId,
          description: 'Downloading metadata...',
        });
      }, 3000),

      setTimeout(() => {
        toast.loading(title, {
          id: toastId,
          description: 'Processing episodes...',
        });
      }, 8000),

      setTimeout(() => {
        toast.loading(title, {
          id: toastId,
          description: 'Updating library...',
        });
      }, 15000),
    ];

    return {
      toastId,

      cleanup() {
        timers.forEach(clearTimeout);
      },

      success(message: string) {
        this.cleanup();

        toast.success(title, {
          id: toastId,
          description: message,
        });
      },

      error(message: string) {
        this.cleanup();

        toast.error(title, {
          id: toastId,
          description: message,
        });
      },
    };
  }

  async function handleRefreshProgram(url: string) {
    const progress = createProgressToast('Refreshing Program');

    try {
      const result = await refreshProgram(url);

      const updatedProgram = result.program;

      setPrograms((prev) =>
        prev.map((p) => (p.id === updatedProgram.id ? updatedProgram : p))
      );

      setSelectedProgram(updatedProgram);

      progress.success(
        `${result.programTitle} • Added ${result.addedEpisodes} new episodes`
      );
    } catch (err) {
      console.error(err);

      progress.error('Unable to refresh program');
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

        isPinned: randomChance(0.05),

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

  function buildCloudBackupPayload() {
    return {
      version: 1,

      exportedAt: new Date().toISOString(),

      manualPrograms: programs.filter((p) => p.source === 'manual'),

      userState,

      activity,

      prefs,
    };
  }

  async function handleCreateCloudBackup() {
    try {
      setBackupLoading(true);

      const payload = buildCloudBackupPayload();

      const result = await createBackup(payload);

      const now = new Date().toISOString();

      const creds = {
        backupId: result.backupId,
        passkey: result.passkey,

        createdAt: now,
        lastSyncedAt: now,
      };

      saveCloudBackupCredentials(creds);

      setCloudBackup(creds);

      toast.success('Cloud backup created', {
        description: 'Save your Backup ID and Passkey somewhere safe.',
      });
    } catch (err) {
      console.error(err);

      toast.error('Backup creation failed');
    } finally {
      setBackupLoading(false);
    }
  }

  async function handleUpdateCloudBackup() {
    if (!cloudBackup) {
      toast.warning('No cloud backup found');
      return;
    }

    try {
      setBackupLoading(true);

      const payload = buildCloudBackupPayload();

      await updateBackup(cloudBackup.backupId, cloudBackup.passkey, payload);

      const updated = {
        ...cloudBackup,
        lastSyncedAt: new Date().toISOString(),
      };

      saveCloudBackupCredentials(updated);

      setCloudBackup(updated);

      toast.success('Cloud backup updated');
    } catch (err) {
      console.error(err);

      toast.error('Cloud backup update failed');
    } finally {
      setBackupLoading(false);
    }
  }

  async function handleRestoreCloudBackup() {
    if (!cloudBackup) {
      toast.warning('No saved backup credentials found');
      return;
    }

    const confirmed = window.confirm(
      'Restore cloud backup?\n\nYour current local data will be overwritten.'
    );

    if (!confirmed) return;

    try {
      setBackupLoading(true);

      const result = await restoreBackup(
        cloudBackup.backupId,
        cloudBackup.passkey
      );

      const payload = result.payload;

      if (!payload) {
        throw new Error('Missing payload');
      }

      // restore state
      setPrograms((prev) => {
        const merged = mergePrograms(prev, payload.manualPrograms ?? []);
        return merged;
      });

      setUserState(payload.userState ?? []);

      setActivity(payload.activity ?? []);

      setPrefs(payload.prefs ?? {});

      toast.success('Cloud backup restored');
    } catch (err) {
      console.error(err);

      toast.error('Cloud backup restore failed');
    } finally {
      setBackupLoading(false);
    }
  }

  async function handleConnectCloudBackup(backupId: string, passkey: string) {
    try {
      setBackupLoading(true);

      const result = await restoreBackup(backupId, passkey);

      const payload = result.payload;

      if (!payload) {
        throw new Error('Missing payload');
      }

      const creds = {
        backupId,
        passkey,

        createdAt: payload.exportedAt,
        lastSyncedAt: payload.exportedAt,
      };

      saveCloudBackupCredentials(creds);

      setCloudBackup(creds);

      setPrograms((prev) => {
        const merged = mergePrograms(prev, payload.manualPrograms ?? []);
        return merged;
      });

      setUserState(payload.userState ?? []);

      setActivity(payload.activity ?? []);

      setPrefs(payload.prefs ?? {});

      toast.success('Connected to cloud backup');
    } catch (err) {
      console.error(err);

      toast.error('Failed to connect backup');
    } finally {
      setBackupLoading(false);
    }
  }

  function addProgram(program: Program) {
    setPrograms((prev) => [...prev, program]);
  }

  function updateProgram(program: Program) {
    setPrograms((prev) => prev.map((p) => (p.id === program.id ? program : p)));
  }

  function deleteProgram(programId: string) {
    setPrograms((prev) => prev.filter((p) => p.id !== programId));

    setUserState((prev) => prev.filter((s) => s.programId !== programId));

    setSelectedProgram(null);
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

    toast.success('All tracker data deleted');
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

    toast.success('All tags deleted');
  }

  const [pinnedOnly, setPinnedOnly] = useState(false);

  const visiblePrograms = useMemo(() => {
    return [...programs]
      .filter((program) => {
        if (platformFilter.length > 0) {
          if (!platformFilter.includes(program.platform)) return false;
        }

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

        if (sortMode === 'episodeCount') {
          return (b.episodes?.length ?? 0) - (a.episodes?.length ?? 0);
        }

        if (sortMode === 'recentlyUpdated') {
          return (
            new Date(b.meta.cachedAt).getTime() -
            new Date(a.meta.cachedAt).getTime()
          );
        }

        if (sortMode === 'runtime') {
          return calculateProgramRuntime(b) - calculateProgramRuntime(a);
        }

        if (sortMode === 'progress') {
          const aState = userState.find((s) => s.programId === a.id);
          const bState = userState.find((s) => s.programId === b.id);

          const aTotal = Math.max(a.episodes?.length ?? 0, 1);
          const bTotal = Math.max(b.episodes?.length ?? 0, 1);

          const aProgress = (aState?.lastListenedEpisode ?? 0) / aTotal;
          const bProgress = (bState?.lastListenedEpisode ?? 0) / bTotal;

          return bProgress - aProgress;
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
    platformFilter,
    searchQuery,
    userState,
    prefs.hideDroppedPrograms,
    prefs.hideCompletedPrograms,
    prefs.disablePinToTop,
    statusFilter,
    tagFilter,
    pinnedOnly,
    sortMode,
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

  const backupSummary = useMemo(() => {
    return {
      manualPrograms: programs.filter((p) => p.source === 'manual').length,

      listening: userState.filter((s) => s.status === 'listening').length,

      completed: userState.filter((s) => s.status === 'completed').length,

      dropped: userState.filter((s) => s.status === 'dropped').length,

      backlog: userState.filter((s) => s.status === 'backlog').length,
    };
  }, [programs, userState]);

  const platforms = useMemo(() => {
    return Array.from(new Set(programs.map((p) => p.platform))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [programs]);

  function LibraryLoadingState({ slow }: { slow: boolean }) {
    return (
      <div className="mt-6 rounded-3xl border border-border/60 bg-background/95 p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />

          <h2 className="text-lg font-semibold">Loading program library</h2>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {slow
              ? 'The backend server may be waking up. This can take a little longer on the first visit.'
              : 'Fetching the latest program data...'}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-52 animate-pulse rounded-xl border border-border/60 bg-muted/30"
            />
          ))}
        </div>
      </div>
    );
  }

  function LibraryErrorState({
    message,
    onRetry,
  }: {
    message: string;
    onRetry: () => void;
  }) {
    return (
      <div className="mt-6 rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold">Library failed to load</h2>

        <p className="mt-2 text-sm text-muted-foreground">{message}</p>

        <Button className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="app-bg min-h-screen bg-background text-foreground">
        <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 pb-16">
          <TopNav
            onOpenStats={() => setStatsOpen(true)}
            onOpenHistory={() => setHistoryOpen(true)}
            onOpenPrefs={() => setPrefsOpen(true)}
            onOpenCreateProgram={() => setCreateOpen(true)}
            onResetSelection={() => {
              setSelectedProgram(null);
              setEditDraft(null);
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
                  Load a demo profile to explore how the app works!
                </p>

                <div className="flex gap-3 justify-end">
                  <Button onClick={loadDemo} disabled={libraryLoading}>
                    {libraryLoading ? 'Loading Library...' : 'Load Demo'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Controls */}
          {libraryLoaded && !libraryError && (
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
              platforms={platforms}
              platformFilter={platformFilter}
              onPlatformFilterChange={setPlatformFilter}
            />
          )}

          {/* Library content */}
          {libraryLoading && !libraryLoaded ? (
            <LibraryLoadingState slow={librarySlow} />
          ) : libraryError ? (
            <LibraryErrorState message={libraryError} onRetry={loadLibrary} />
          ) : (
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
          )}

          <ProgramModal
            open={!!selectedProgram}
            program={selectedProgram}
            onClose={() => setSelectedProgram(null)}
            getProgramState={getProgramState}
            updateProgramState={updateProgramState}
            tagDraft={tagDraft}
            setTagDraft={setTagDraft}
            prefs={prefs}
            onEdit={(program) => {
              setEditDraft(program);
              setCreateOpen(true);
            }}
            onDelete={deleteProgram}
            onRefresh={handleRefreshProgram}
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
            cloudBackup={cloudBackup}
            backupLoading={backupLoading}
            backupSummary={backupSummary}
            onCreateBackup={handleCreateCloudBackup}
            onUpdateBackup={handleUpdateCloudBackup}
            onRestoreBackup={handleRestoreCloudBackup}
            onConnectBackup={handleConnectCloudBackup}
          />

          <CreateProgramModal
            open={createOpen}
            onClose={() => {
              setCreateOpen(false);
              setEditDraft(null);
            }}
            editingProgram={editDraft}
            programs={programs}
            onSubmit={(program) => {
              if (editDraft) {
                updateProgram(program);
              } else {
                addProgram(program);
              }

              setEditDraft(null);
            }}
          />
        </div>
      </div>

      <Toaster richColors position="bottom-right" closeButton />
    </div>
  );
}

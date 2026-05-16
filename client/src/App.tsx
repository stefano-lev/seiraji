import type React from 'react';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Button } from './components/ui/button';

import { motion } from 'framer-motion';

import { defaultShows } from '@/data/shows';
//import { demoShows, demoUserState, demoTags } from '@/data/demo';

import { defaultPrograms, demoUserState } from '@/data/demoPrograms';

//import type { UserShowState } from '@/types/radio';
import { ShowCard } from '@/components/ShowCard';
//import type { RadioShow } from '@/types/radio';
import type { Program } from './types/media';
import type { UserProgramState } from './types/user';

import { loadActivity, saveActivity, appendActivityEvent } from '@/lib/storage';
import type { ActivityEvent } from '@/lib/storage';
import { loadTags, saveTags, upsertTag } from '@/lib/storage';
import { loadPrefs, savePrefs } from '@/lib/storage';
//import { getEffectiveTotalEpisodes } from '@/lib/episodes';
import { loadUserState, saveUserState } from '@/lib/storage';

import { processImageFile } from '@/lib/image';

import { getLibrary } from './lib/api';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Switch } from '@/components/ui/switch';

import { Input } from '@/components/ui/input';

import { Badge } from '@/components/ui/badge';

import {
  buildExportPayload,
  downloadJson,
  isExportPayload,
  readJsonFile,
} from '@/lib/storage';

type SortMode = 'title' | 'host';

type EditableFieldProps = {
  label: string;
  value: React.ReactNode;
  isEditing: boolean;
  renderInput: () => React.ReactNode;
};

function EditableField({
  label,
  value,
  isEditing,
  renderInput,
}: EditableFieldProps) {
  return (
    <div className="mb-3">
      <label className="text-sm mb-1 block">{label}</label>
      {isEditing ? (
        renderInput()
      ) : (
        <div className="text-sm text-muted-foreground">{value}</div>
      )}
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('title');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [editDraft, setEditDraft] = useState<Program | null>(null);

  const isEditing = editDraft !== null;

  const programData = editDraft ?? selectedProgram;

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
        const data = await getLibrary();
        setPrograms(data);
      } catch (err) {
        console.error('Failed to load library', err);
      }
    }

    load();
  }, []);

  useEffect(() => {
    localStorage.setItem('programs', JSON.stringify(programs));
  }, [programs]);

  const [programOnboarding, setProgramOnboarding] = useState(() => {
    return !localStorage.getItem('seiraji:mode');
  });

  const [isDemo, setIsDemo] = useState(() => {
    return localStorage.getItem('seiraji:mode') === 'demo';
  });

  const [tags, setTags] = useState<string[]>(() => loadTags());

  useEffect(() => {
    saveTags(tags);
  }, [tags]);

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

  const stats = useMemo(() => {
    const totalPrograms = programs.length;

    const statusCounts = {
      listening: 0,
      backlog: 0,
      completed: 0,
      dropped: 0,
    };

    let totalEpisodesListened = 0;
    const totalEpisodesPossible = 0;

    for (const program of programs) {
      const state = userState.find((s) => s.programId === program.id);

      const status = state?.status ?? 'backlog';
      statusCounts[status]++;

      const listened = state?.lastListenedEpisode ?? 0;
      totalEpisodesListened += listened;

      //totalEpisodesPossible += getEffectiveTotalEpisodes(show, now);
    }

    const totalMinutesListened = 0;

    // for (const program of programs) {
    //   const state = userState.find((s) => s.programId === program.id);

    //   const listenedEpisodes = state?.lastListenedEpisode ?? 0;
    //   const mins = program.episodeDurationMinutes ?? 30;

    //   totalMinutesListened += listenedEpisodes * mins;
    // }

    const approxMinutes = totalMinutesListened;

    const completionPct =
      totalEpisodesPossible > 0
        ? Math.round((totalEpisodesListened / totalEpisodesPossible) * 100)
        : 0;

    return {
      totalPrograms,
      statusCounts,
      totalEpisodesListened,
      totalEpisodesPossible,
      approxMinutes,
      completionPct,
    };
  }, [programs, userState]);

  function startFresh() {
    setPrograms(defaultPrograms);
    setUserState([]);
    setTags([]);
    setActivity([]);

    localStorage.setItem('seiraji:mode', 'fresh');
    setIsDemo(false);
    setProgramOnboarding(false);
  }

  function loadDemo() {
    setPrograms(defaultPrograms);
    setUserState(demoUserState);
    //setTags(demoTags);

    localStorage.setItem('seiraji:mode', 'demo');
    setIsDemo(true);
    setProgramOnboarding(false);
  }

  function getShowTitle(programId: string) {
    return (
      programs.find((s) => s.id === programId)?.program.title ?? 'Unknown show'
    );
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
    // updateProgramState({
    //   programId,
    //   status: prev?.status ?? 'backlog',
    //   isPinned: prev?.isPinned ?? false,
    //   lastListenedEpisode: nextEpisode,
    // });

    // log event
    const ev: ActivityEvent = {
      id: crypto.randomUUID(),
      ts: new Date().toISOString(),
      type: 'episode_progress',
      programId,
      episode: nextEpisode,
      delta,
    };

    setActivity((prevEvents) => appendActivityEvent(prevEvents, ev));
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
    // update global tags
    const updatedTags = updated.tags ?? [];
    if (updatedTags.length > 0) {
      setTags((prev) => {
        let next = prev;
        for (const t of updatedTags) next = upsertTag(next, t);
        return next;
      });
    }

    setUserState((prev) =>
      prev.some((s) => s.programId === updated.programId)
        ? prev.map((s) => (s.programId === updated.programId ? updated : s))
        : [...prev, updated]
    );
  }

  function updateProgram(updated: Program) {
    setPrograms((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  function addShow(newProgram: Program) {
    setPrograms((prev) => [...prev, newProgram]);
  }

  function deleteProgram(id: string) {
    setPrograms((prev) => prev.filter((s) => s.id !== id));
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
    localStorage.removeItem('seiraji:tags');
    setTags([]);
  }

  function deleteAllTags() {
    const ok = window.confirm(
      'Delete ALL tags from every show?\n(This cannot be undone.)'
    );
    if (!ok) return;

    // remove tags from every user state entry
    setUserState((prev) => prev.map((s) => ({ ...s, tags: [] })));

    // clear global tags list
    setTags([]);

    // clear storage
    localStorage.removeItem('seiraji:tags');
  }

  const [pinnedOnly, setPinnedOnly] = useState(false);

  const visiblePrograms = useMemo(() => {
    return [...programs]
      .filter((program) => {
        const query = searchQuery.toLowerCase();

        const matchesSearch =
          program.program.title.toLowerCase().includes(query) ||
          program.program.hosts.some((h) => h.toLowerCase().includes(query));

        if (!matchesSearch) return false;

        const state = userState.find((s) => s.programId === program.id);

        // status filter
        if (statusFilter !== 'all') {
          if (state?.status !== statusFilter) return false;
        }

        // tag filter
        if (tagFilter !== 'all') {
          const programTags = state?.tags ?? [];
          if (!programTags.includes(tagFilter)) return false;
        }

        // pinned only filter
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

        if (aPinned !== bPinned) return bPinned - aPinned;

        if (sortMode === 'title') {
          return a.program.title.localeCompare(b.program.title, 'ja');
        }

        return a.program.hosts[0].localeCompare(b.program.hosts[0], 'ja');
      });
  }, [
    programs,
    userState,
    sortMode,
    searchQuery,
    statusFilter,
    tagFilter,
    pinnedOnly,
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
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pb-16">
          {/* Top Nav */}
          <div className="sticky top-0 z-40 pt-4">
            <div
              className="
      rounded-2xl border border-border/60
      bg-background/70 backdrop-blur-xl
      shadow-sm
    "
            >
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Logo */}
                <button
                  className="text-left"
                  onClick={() => {
                    setSelectedProgram(null);
                    setEditDraft(null);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="text-lg font-bold">声</span>
                    </div>

                    <div className="leading-tight">
                      <div className="text-base font-semibold">
                        SeiRaji (Beta)
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Your episodes, progress, & backlog in one place.
                      </div>
                    </div>
                  </div>
                </button>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => setStatsOpen(true)}
                  >
                    Stats
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setHistoryOpen(true)}
                  >
                    History
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setPrefsOpen(true)}
                  >
                    Preferences
                  </Button>

                  <div className="w-full sm:w-auto h-px sm:h-auto bg-border/60 mx-0 sm:mx-1" />

                  <Button variant="secondary" onClick={handleExport}>
                    Export
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => importInputRef.current?.click()}
                  >
                    Import
                  </Button>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDark(!dark);
                    }}
                  >
                    {dark ? 'Light' : 'Dark'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

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
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
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
                  <Button variant="secondary" onClick={startFresh}>
                    Start Fresh
                  </Button>
                  <Button onClick={loadDemo}>Load Demo</Button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Controls */}
          <div className="sticky top-[108px] z-30 mt-4">
            <div className="rounded-2xl border border-border/60 bg-background/70 backdrop-blur-xl shadow-sm">
              <div className="p-4 flex flex-col gap-3">
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                  {/* Search */}
                  <Input
                    ref={searchRef}
                    placeholder="Search programs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:max-w-sm bg-background/80"
                  />
                  {isDemo && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();

                        const ok = window.confirm(
                          'End the Demo and start fresh?\n(This cannot be undone!)'
                        );
                        if (!ok) return;

                        startFresh();
                      }}
                    >
                      End Demo
                    </Button>
                  )}

                  {/* Sort + Add */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={sortMode === 'title' ? 'default' : 'secondary'}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSortMode('title');
                      }}
                    >
                      Title
                    </Button>

                    <Button
                      variant={sortMode === 'host' ? 'default' : 'secondary'}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSortMode('host');
                      }}
                    >
                      Host
                    </Button>

                    {/* <Button
                      onClick={() => {
                        const newProgram: Program = {
                          id: crypto.randomUUID(),
                          title: 'New Show',
                          hosts: ['Unknown'],
                          startDate: '',
                          frequency: 'weekly',
                          bannerUrl: '',
                          totalEpisodes: 0,
                          episodeDurationMinutes: 30,
                        };
                        addShow(newProgram);
                        setSelectedProgram(newProgram);
                        setEditDraft(newProgram);
                      }}
                    >
                      + Add Show
                    </Button> */}
                  </div>
                </div>

                {/* Filters row */}
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <Select
                    value={statusFilter}
                    onValueChange={(v) =>
                      setStatusFilter(v as typeof statusFilter)
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="listening">Listening</SelectItem>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="dropped">Dropped</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={tagFilter}
                    onValueChange={(v) => setTagFilter(v === 'all' ? 'all' : v)}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="All tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tags</SelectItem>
                      {tags.map((t) => (
                        <SelectItem key={t} value={t}>
                          #{t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={pinnedOnly}
                      onCheckedChange={setPinnedOnly}
                    />
                    <span className="text-sm text-muted-foreground">
                      Pinned only
                    </span>
                  </div>

                  <div className="flex-1" />

                  <div className="text-xs text-muted-foreground">
                    Showing{' '}
                    <span className="font-medium text-foreground">
                      {visiblePrograms.length}
                    </span>{' '}
                    / {programs.length}
                  </div>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      className="cursor-pointer"
                      onClick={() => setTagFilter('all')}
                      type="button"
                    >
                      <Badge
                        variant={tagFilter === 'all' ? 'default' : 'secondary'}
                      >
                        All
                      </Badge>
                    </button>

                    {tags.slice(0, 12).map((t) => (
                      <button
                        key={t}
                        className="cursor-pointer"
                        onClick={() => setTagFilter(t)}
                        type="button"
                      >
                        <Badge
                          variant={tagFilter === t ? 'default' : 'secondary'}
                        >
                          #{t}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sorting indicator */}
          <p className="text-sm text-muted-foreground">
            Sorted by {sortMode === 'title' ? 'Title' : 'Host'}
          </p>

          {/* Show cards */}
          <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-w-5xl w-full items-stretch">
            {visiblePrograms.map((program) => (
              <ShowCard
                program={program}
                userState={userState.find((s) => s.programId === program.id)}
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
            ))}
          </div>

          {selectedProgram &&
            (() => {
              const programData = selectedProgram;

              //   return (
              //     <motion.div
              //       className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
              //       initial={{ opacity: 0 }}
              //       animate={{ opacity: 1 }}
              //       exit={{ opacity: 0 }}
              //       onClick={(e) => {
              //         e.stopPropagation();
              //         setSelectedProgram(null);
              //       }}
              //     >
              //       <motion.div
              //         className="max-w-lg w-full rounded-2xl bg-background p-6 shadow-xl"
              //         initial={{ scale: 0.95, opacity: 0 }}
              //         animate={{ scale: 1, opacity: 1 }}
              //         transition={{ duration: 0.15, ease: 'easeOut' }}
              //         onClick={(e) => e.stopPropagation()}
              //       >
              //         <>
              //           <h2 className="text-xl font-semibold mb-4">
              //             {programData!.program.title}
              //           </h2>

              //           <div className="edit-field">
              //             <label className="edit-label">Show Icon</label>

              //             <div
              //               style={{
              //                 display: 'flex',
              //                 gap: 12,
              //                 alignItems: 'center',
              //               }}
              //             >
              //               <img
              //                 src={
              //                   isEditing
              //                     ? (editDraft?.program.thumbnail ??
              //                       editDraft?.program.thumbnail ??
              //                       '/placeholders/show-placeholder.png')
              //                     : (programData.program.thumbnail ??
              //                       '/placeholders/show-placeholder.png')
              //                 }
              //                 alt="Show icon"
              //                 width={48}
              //                 height={48}
              //                 style={{
              //                   borderRadius: 6,
              //                   border: '1px solid var(--border)',
              //                   objectFit: 'cover',
              //                 }}
              //               />

              //               {isEditing && (
              //                 <div
              //                   style={{
              //                     display: 'flex',
              //                     flexDirection: 'column',
              //                     gap: 6,
              //                   }}
              //                 >
              //                   <input
              //                     type="file"
              //                     accept="image/png,image/jpeg,image/webp"
              //                     onChange={async (e) => {
              //                       const file = e.target.files?.[0];
              //                       if (!file || !editDraft) return;

              //                       const dataUrl = await processImageFile(file);

              //                       setEditDraft({
              //                         ...editDraft,
              //                         iconDataUrl: dataUrl,
              //                       });
              //                     }}
              //                   />

              //                   {(editDraft?.program.thumbnail ||
              //                     editDraft?.program.thumbnail) && (
              //                     <button
              //                       type="button"
              //                       onClick={() =>
              //                         setEditDraft({
              //                           ...editDraft,
              //                           iconDataUrl: undefined,
              //                           iconUrl: undefined,
              //                         })
              //                       }
              //                     >
              //                       Remove icon
              //                     </button>
              //                   )}
              //                 </div>
              //               )}
              //             </div>
              //           </div>

              //           <EditableField
              //             label="Title"
              //             value={programData!.program.title}
              //             isEditing={isEditing}
              //             renderInput={() => (
              //               <input
              //                 className="w-full rounded-md border p-2 bg-background/90 text-foreground"
              //                 value={editDraft!.program.title}
              //                 onChange={(e) =>
              //                   setEditDraft({
              //                     ...editDraft!,
              //                     title: e.target.value,
              //                   })
              //                 }
              //               />
              //             )}
              //           />

              //           <EditableField
              //             label="Hosts"
              //             value={programData!.program.hosts.join(', ')}
              //             isEditing={isEditing}
              //             renderInput={() => (
              //               <input
              //                 className="w-full rounded-md border p-2 bg-background/90 text-foreground"
              //                 value={editDraft!.program.hosts.join(', ')}
              //                 onChange={(e) =>
              //                   setEditDraft({
              //                     ...editDraft!,
              //                     hosts: e.target.value
              //                       .split(',')
              //                       .map((h) => h.trim()),
              //                   })
              //                 }
              //               />
              //             )}
              //           />

              //           <EditableField
              //             label="Start Date"
              //             value={programData!.startDate || '—'}
              //             isEditing={isEditing}
              //             renderInput={() => (
              //               <input
              //                 className="w-full rounded-md border p-2 bg-background/90 text-foreground"
              //                 value={editDraft!.startDate}
              //                 onChange={(e) =>
              //                   setEditDraft({
              //                     ...editDraft!,
              //                     startDate: e.target.value,
              //                   })
              //                 }
              //               />
              //             )}
              //           />

              //           <EditableField
              //             label="Frequency"
              //             value={programData!.frequency}
              //             isEditing={isEditing}
              //             renderInput={() => (
              //               <select
              //                 className="w-full rounded-md border p-2 bg-background/90 text-foreground"
              //                 value={editDraft!.frequency}
              //                 onChange={(e) =>
              //                   setEditDraft({
              //                     ...editDraft!,
              //                     frequency: e.target
              //                       .value as Program['frequency'],
              //                   })
              //                 }
              //               >
              //                 <option value="weekly">Weekly</option>
              //                 <option value="biweekly">Biweekly</option>
              //                 <option value="irregular">Irregular</option>
              //               </select>
              //             )}
              //           />

              //           <EditableField
              //             label="Total Episodes"
              //             value={programData!.totalEpisodes}
              //             isEditing={isEditing}
              //             renderInput={() => (
              //               <input
              //                 type="number"
              //                 className="w-full rounded-md border p-2 bg-background/90 text-foreground"
              //                 value={editDraft!.totalEpisodes}
              //                 onChange={(e) =>
              //                   setEditDraft({
              //                     ...editDraft!,
              //                     totalEpisodes: Number(e.target.value),
              //                   })
              //                 }
              //               />
              //             )}
              //           />
              //         </>

              //         <EditableField
              //           label="Episode Duration (minutes)"
              //           value={programData!.episodeDurationMinutes ?? '—'}
              //           isEditing={isEditing}
              //           renderInput={() => (
              //             <input
              //               type="number"
              //               min={1}
              //               className="w-full rounded-md border p-2 bg-background/90 text-foreground"
              //               value={programData!.episodeDurationMinutes ?? 30}
              //               onChange={(e) =>
              //                 setEditDraft({
              //                   ...editDraft!,
              //                   episodeDurationMinutes: Number(e.target.value),
              //                 })
              //               }
              //             />
              //           )}
              //         />

              //         {/* Tags editor (User State) */}
              //         <div className="mb-3">
              //           <label className="text-sm mb-1 block">Tags</label>
              //           <input
              //             type="text"
              //             placeholder="anime, comedy, drama"
              //             className="w-full rounded-md border p-2 bg-background/90 text-foreground"
              //             value={tagDraft}
              //             onChange={(e) => setTagDraft(e.target.value)}
              //             onBlur={() => {
              //               const raw = tagDraft
              //                 .split(',')
              //                 .map((t) => t.trim())
              //                 .filter(Boolean);

              //               const normalized = Array.from(
              //                 new Set(raw.map((t) => t.toLowerCase()))
              //               );

              //               const current = getProgramState(selectedProgram!.id);
              //               updateProgramState({
              //                 ...current,
              //                 tags: normalized,
              //               });

              //               setTagDraft(normalized.join(', '));
              //             }}
              //           />
              //         </div>

              //         <div className="mt-6 flex justify-end gap-2">
              //           {isEditing ? (
              //             <>
              //               <button
              //                 className="px-4 py-2 rounded-md bg-secondary"
              //                 onClick={() => {
              //                   const confirmed = window.confirm(
              //                     `Delete "${selectedProgram!.program.title}"?\nThis cannot be undone.`
              //                   );

              //                   if (!confirmed) return;

              //                   deleteProgram(selectedProgram!.id);
              //                   setEditDraft(null);
              //                   setSelectedProgram(null);
              //                 }}
              //               >
              //                 Delete
              //               </button>
              //               <button
              //                 className="px-4 py-2 rounded-md bg-secondary"
              //                 onClick={() => {
              //                   updateProgram(editDraft!);
              //                   setEditDraft(null);
              //                 }}
              //               >
              //                 Save
              //               </button>

              //               <button
              //                 className="px-4 py-2 rounded-md bg-muted"
              //                 onClick={() => setEditDraft(null)}
              //               >
              //                 Cancel
              //               </button>
              //             </>
              //           ) : (
              //             <button
              //               className="px-4 py-2 rounded-md bg-secondary"
              //               onClick={() => setSelectedProgram(null)}
              //             >
              //               Close
              //             </button>
              //           )}
              //         </div>
              //       </motion.div>
              //     </motion.div>
              //   );
            })()}

          {statsOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                setStatsOpen(false);
              }}
            >
              <motion.div
                className="max-w-lg w-full rounded-2xl bg-background p-6 shadow-xl"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-semibold mb-4">Stats</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Total programs
                    </span>
                    <span className="font-medium">{stats.totalPrograms}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Episodes listened
                    </span>
                    <span className="font-medium">
                      {stats.totalEpisodesListened}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Approx time listened
                    </span>
                    <span className="font-medium">
                      {Math.round(stats.approxMinutes / 60)} hrs
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Completion (approx)
                    </span>
                    <span className="font-medium">{stats.completionPct}%</span>
                  </div>

                  <hr className="my-3 border-border/60" />

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border p-3">
                      <div className="text-muted-foreground">Listening</div>
                      <div className="text-lg font-semibold">
                        {stats.statusCounts.listening}
                      </div>
                    </div>

                    <div className="rounded-xl border p-3">
                      <div className="text-muted-foreground">Backlog</div>
                      <div className="text-lg font-semibold">
                        {stats.statusCounts.backlog}
                      </div>
                    </div>

                    <div className="rounded-xl border p-3">
                      <div className="text-muted-foreground">Completed</div>
                      <div className="text-lg font-semibold">
                        {stats.statusCounts.completed}
                      </div>
                    </div>

                    <div className="rounded-xl border p-3">
                      <div className="text-muted-foreground">Dropped</div>
                      <div className="text-lg font-semibold">
                        {stats.statusCounts.dropped}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-red hover:bg-red mt-6 flex justify-start">
                    <details className="mt-4">
                      <summary className="cursor-pointer text-red-600">
                        ⚠️ Danger Zone ⚠️
                      </summary>
                      <Button
                        className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                        onClick={deleteAllTags}
                      >
                        Delete All Tags
                      </Button>

                      <Button
                        className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                        onClick={deleteAllData}
                      >
                        Delete All Data
                      </Button>
                    </details>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button onClick={() => setStatsOpen(false)}>Close</Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
          {historyOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                setHistoryOpen(false);
              }}
            >
              <motion.div
                className="max-w-lg w-full rounded-2xl bg-background p-6 shadow-xl"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">History</h2>

                  <div className="mt-6 flex justify-end">
                    <Button onClick={() => setHistoryOpen(false)}>Close</Button>
                  </div>
                </div>
                {activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No activity yet
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                    {activity.map((ev) => {
                      if (ev.type !== 'episode_progress') return null;

                      const title = getShowTitle(ev.programId);
                      const deltaLabel =
                        ev.delta > 0 ? `+${ev.delta}` : `${ev.delta}`;

                      return (
                        <div
                          key={ev.id}
                          className="rounded-xl border border-border/60 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium truncate">
                                {title}
                              </div>

                              <div className="text-sm text-muted-foreground">
                                Episode {ev.episode}{' '}
                                <span className="ml-2 font-medium text-foreground">
                                  ({deltaLabel})
                                </span>
                              </div>
                            </div>

                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              {timeAgo(ev.ts, now)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="mt-6 flex justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const ok = window.confirm(
                        'Clear your activity history?\n(This cannot be undone.)'
                      );
                      if (!ok) return;
                      setActivity([]);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {prefsOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                setPrefsOpen(false);
              }}
            >
              <motion.div
                className="max-w-lg w-full rounded-2xl bg-background p-6 shadow-xl"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-semibold mb-4">Preferences</h2>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
                  <div>
                    <div className="font-medium">Show status</div>
                    <div className="text-xs text-muted-foreground">
                      Display listening/backlog/etc on show cards
                    </div>
                  </div>
                  <Switch
                    checked={prefs.showStatusOnCard}
                    onCheckedChange={(checked) =>
                      setPrefs((p) => ({ ...p, showStatusOnCard: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
                  <div>
                    <div className="font-medium">Show history</div>
                    <div className="text-xs text-muted-foreground">
                      Show last episode on cards
                    </div>
                  </div>
                  <Switch
                    checked={prefs.showLastEpisodeOnCard}
                    onCheckedChange={(checked) =>
                      setPrefs((p) => ({
                        ...p,
                        showLastEpisodeOnCard: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
                  <div>
                    <div className="font-medium">Show tags</div>
                    <div className="text-xs text-muted-foreground">
                      Display tags on show cards
                    </div>
                  </div>
                  <Switch
                    checked={prefs.showTagsOnCard}
                    onCheckedChange={(checked) =>
                      setPrefs((p) => ({ ...p, showTagsOnCard: checked }))
                    }
                  />
                </div>

                <div className="mt-6 flex justify-end">
                  <Button onClick={() => setPrefsOpen(false)}>Close</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

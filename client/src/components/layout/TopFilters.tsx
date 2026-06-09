import { useEffect, useRef, useState } from 'react';
import type React from 'react';

import type { UserProgramState } from '@/types/user';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '../ui/button';

type SortMode =
  | 'title'
  | 'host'
  | 'platform'
  | 'episodeCount'
  | 'recentlyUpdated'
  | 'runtime'
  | 'progress';

const SORT_LABELS: Record<SortMode, string> = {
  title: 'Title',
  host: 'Host',
  platform: 'Platform',
  episodeCount: 'Episode Count',
  recentlyUpdated: 'Recently Updated',
  runtime: 'Runtime',
  progress: 'Progress',
};

const STATUS_LABELS: Record<UserProgramState['status'] | 'all', string> = {
  all: 'All statuses',
  listening: 'Listening',
  backlog: 'Backlog',
  completed: 'Completed',
  dropped: 'Dropped',
};

type ProgramFiltersProps = {
  searchRef: React.RefObject<HTMLInputElement | null>;

  searchQuery: string;
  onSearchQueryChange: (value: string) => void;

  isDemo: boolean;
  onEndDemo: () => void;

  pinnedOnly: boolean;
  onTogglePinned: () => void;

  statusFilter: UserProgramState['status'] | 'all';
  onStatusFilterChange: (value: UserProgramState['status'] | 'all') => void;

  tagFilter: string | 'all';
  onTagFilterChange: (value: string | 'all') => void;

  sortMode: SortMode;
  onSortModeChange: (value: SortMode) => void;

  tags: string[];

  visibleCount: number;
  totalCount: number;

  platforms: string[];
  platformFilter: string[];
  onPlatformFilterChange: (value: string[]) => void;
};

export function ProgramFilters({
  searchRef,
  searchQuery,
  onSearchQueryChange,
  isDemo,
  onEndDemo,
  pinnedOnly,
  onTogglePinned,
  statusFilter,
  onStatusFilterChange,
  tagFilter,
  onTagFilterChange,
  sortMode,
  onSortModeChange,
  tags,
  visibleCount,
  totalCount,
  platforms,
  platformFilter,
  onPlatformFilterChange,
}: ProgramFiltersProps) {
  const [platformMenuOpen, setPlatformMenuOpen] = useState(false);
  const platformMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!platformMenuRef.current) return;

      if (!platformMenuRef.current.contains(e.target as Node)) {
        setPlatformMenuOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setPlatformMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div className="mt-4">
      <div className="rounded-2xl border border-border/60 bg-background/95 shadow-sm">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              ref={searchRef}
              placeholder="Search programs or hosts..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full sm:max-w-sm"
            />

            <div className="flex h-9 items-center text-xs text-muted-foreground justify-center w-full sm:w-[180px]">
              Showing{' '}
              <span className="mx-1 font-medium text-foreground">
                {visibleCount}
              </span>{' '}
              / {totalCount}
            </div>

            <div className="sm:ml-auto flex justify-end">
              <Button
                className="h-9"
                variant={pinnedOnly ? 'default' : 'secondary'}
                onClick={() => onTogglePinned()}
                title={pinnedOnly ? 'Showing pinned only' : 'Show pinned only'}
              >
                ★
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                onStatusFilterChange(v as UserProgramState['status'] | 'all')
              }
            >
              <SelectTrigger className="w-full sm:w-[196px]">
                <SelectValue>{STATUS_LABELS[statusFilter]}</SelectValue>
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
              value={sortMode}
              onValueChange={(v) => onSortModeChange(v as SortMode)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue>{SORT_LABELS[sortMode]}</SelectValue>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="host">Host</SelectItem>
                <SelectItem value="platform">Platform</SelectItem>
                <SelectItem value="episodeCount">Episode Count</SelectItem>
                <SelectItem value="recentlyUpdated">
                  Recently Updated
                </SelectItem>
                <SelectItem value="runtime">Runtime</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative" ref={platformMenuRef}>
              <Button
                type="button"
                variant="outline"
                className="h-9 w-full sm:w-[180px] justify-center"
                onClick={() => setPlatformMenuOpen((open) => !open)}
              >
                {platformFilter.length === 0
                  ? 'All Platforms'
                  : `${platformFilter.length} platform${
                      platformFilter.length === 1 ? '' : 's'
                    }`}
              </Button>

              {platformMenuOpen && (
                <div
                  className="
                  absolute z-30 mt-2 w-56 rounded-xl border border-border
                  bg-background p-3 shadow-xl select-none
                "
                >
                  <button
                    type="button"
                    className="mb-2 text-xs text-muted-foreground underline"
                    onClick={() => onPlatformFilterChange([])}
                  >
                    Show all
                  </button>

                  <div className="space-y-2">
                    {platforms.map((platform) => {
                      const checked = platformFilter.includes(platform);

                      return (
                        <label
                          key={platform}
                          className="
                            flex cursor-pointer items-center gap-2 rounded-md px-2 py-1
                            text-sm hover:bg-muted
                          "
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              onPlatformFilterChange(
                                checked
                                  ? platformFilter.filter((p) => p !== platform)
                                  : [...platformFilter, platform]
                              );
                            }}
                          />

                          <span>
                            {platform === 'manual' ? 'Manual' : platform}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={tagFilter === 'all' ? 'default' : 'secondary'}
              className="cursor-pointer"
              onClick={() => onTagFilterChange('all')}
            >
              All
            </Badge>

            {tags.map((tag) => (
              <Badge
                key={tag}
                variant={tagFilter === tag ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => onTagFilterChange(tag)}
              >
                #{tag}
              </Badge>
            ))}
          </div>

          {isDemo && (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm">Demo mode is active</div>

                <button onClick={onEndDemo} className="text-sm underline">
                  End Demo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

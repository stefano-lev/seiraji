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

type SortMode = 'title' | 'host' | 'platform';

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
}: ProgramFiltersProps) {
  return (
    <div className="mt-4">
      <div className="rounded-2xl border border-border/60 bg-background/95 shadow-sm">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              ref={searchRef}
              placeholder="Search programs or hosts..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full sm:max-w-sm"
            />
            <div className="flex items-center justify-end sm:justify-start">
              <Button
                variant={pinnedOnly ? 'default' : 'secondary'}
                onClick={() => onTogglePinned()}
              >
                ★
              </Button>
            </div>
          </div>

          <div
            className="
              flex flex-col sm:flex-row
              gap-2
              items-stretch sm:items-center
            "
          >
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                onStatusFilterChange(v as UserProgramState['status'] | 'all')
              }
            >
              <SelectTrigger className="w-full sm:w-[196px]">
                <SelectValue placeholder={statusFilter} />
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
                <SelectValue placeholder={sortMode} />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="host">Host</SelectItem>
                <SelectItem value="platform">Platform</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-xs text-muted-foreground">
              Showing{' '}
              <span className="font-medium text-foreground">
                {visibleCount}
              </span>{' '}
              / {totalCount}
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

import { Button } from '@/components/ui/button';

type Props = {
  onOpenStats: () => void;
  onOpenHistory: () => void;
  onOpenPrefs: () => void;
  onResetSelection: () => void;
};

export function TopNav({
  onOpenStats,
  onOpenHistory,
  onOpenPrefs,
  onResetSelection,
}: Props) {
  return (
    <div className="sticky top-0 z-40 pt-4">
      <div
        className="
          rounded-2xl border border-border/60
          bg-background/95
          shadow-sm
        "
      >
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Logo */}
          <button className="text-left" onClick={onResetSelection}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="text-lg font-bold">声</span>
              </div>

              <div className="leading-tight">
                <div className="text-base font-semibold">SeiRaji (Beta)</div>

                <div className="text-xs text-muted-foreground">
                  Your episodes, progress, & backlog in one place.
                </div>
              </div>
            </div>
          </button>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
            <Button variant="secondary" onClick={onOpenStats}>
              Stats
            </Button>

            <Button variant="secondary" onClick={onOpenHistory}>
              History
            </Button>

            <Button variant="secondary" onClick={onOpenPrefs}>
              Preferences
            </Button>

            <div className="w-full sm:w-auto h-px sm:h-auto bg-border/60 mx-0 sm:mx-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

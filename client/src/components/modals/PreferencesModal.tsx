import { motion } from 'framer-motion';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import type { Preferences } from '@/lib/storage';

type PreferenceRowProps = {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

function PreferenceRow({
  title,
  description,
  checked,
  onCheckedChange,
}: PreferenceRowProps) {
  return (
    <div className="w-full flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
      <div className="min-w-0 flex-1">
        <div className="font-medium">{title}</div>

        <div className="text-xs text-muted-foreground">{description}</div>
      </div>

      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

type PreferencesModalProps = {
  open: boolean;
  onClose: () => void;
  prefs: Preferences;
  setPrefs: React.Dispatch<React.SetStateAction<Preferences>>;
};

export function PreferencesModal({
  open,
  onClose,
  prefs,
  setPrefs,
}: PreferencesModalProps) {
  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border/60 bg-background shadow-2xl flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border/60 px-6 py-4">
          <h2 className="text-xl font-semibold">Preferences</h2>

          <p className="text-sm text-muted-foreground mt-1">
            Customize the appearance and behavior of your library.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-3">
            <div className="mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Display
              </h3>
            </div>

            <PreferenceRow
              title="Disable pin behavior"
              description="Disable the default 'Pin to Top' behavior in the library view"
              checked={prefs.disablePinToTop}
              onCheckedChange={(checked) =>
                setPrefs((p) => ({
                  ...p,
                  disablePinToTop: checked,
                }))
              }
            />

            <PreferenceRow
              title="Hide status"
              description="Hide listening/backlog/etc on show cards"
              checked={prefs.hideStatusOnCard}
              onCheckedChange={(checked) =>
                setPrefs((p) => ({
                  ...p,
                  hideStatusOnCard: checked,
                }))
              }
            />

            <PreferenceRow
              title="Hide tags on cards"
              description="Hide tags on show cards"
              checked={prefs.hideTagsOnCard}
              onCheckedChange={(checked) =>
                setPrefs((p) => ({
                  ...p,
                  hideTagsOnCard: checked,
                }))
              }
            />

            <PreferenceRow
              title="Hide progress bar"
              description="Hide progress bars from show cards in the library view"
              checked={prefs.hideProgressBar}
              onCheckedChange={(checked) =>
                setPrefs((p) => ({
                  ...p,
                  hideProgressBar: checked,
                }))
              }
            />

            <PreferenceRow
              title="Show last episode (experimental)"
              description="Show the last episode indicator on program cards in the library view"
              checked={prefs.showLastEpisodeOnCard}
              onCheckedChange={(checked) =>
                setPrefs((p) => ({
                  ...p,
                  showLastEpisodeOnCard: checked,
                }))
              }
            />

            <PreferenceRow
              title="Compact Cards (experimental)"
              description="Reduce the size of program cards in the library view"
              checked={prefs.compactCards}
              onCheckedChange={(checked) =>
                setPrefs((p) => ({
                  ...p,
                  compactCards: checked,
                }))
              }
            />
          </section>
          <section className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-3">
            <div className="mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Library Filtering
              </h3>
            </div>
            <PreferenceRow
              title="Hide completed programs"
              description="Exclude completed shows from the library view"
              checked={prefs.hideCompletedPrograms}
              onCheckedChange={(checked) =>
                setPrefs((p) => ({
                  ...p,
                  hideCompletedPrograms: checked,
                }))
              }
            />

            <PreferenceRow
              title="Hide dropped programs"
              description="Exclude dropped shows from the library view"
              checked={prefs.hideDroppedPrograms}
              onCheckedChange={(checked) =>
                setPrefs((p) => ({
                  ...p,
                  hideDroppedPrograms: checked,
                }))
              }
            />
          </section>
          <section className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-3">
            <div className="mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Episode List
              </h3>
            </div>
            <PreferenceRow
              title="Hide completed episodes"
              description="Hide listened episodes in the program modal"
              checked={prefs.hideCompletedEpisodes}
              onCheckedChange={(checked) =>
                setPrefs((p) => ({
                  ...p,
                  hideCompletedEpisodes: checked,
                }))
              }
            />

            <PreferenceRow
              title="Hide episode thumbnails"
              description="Hide episode thumbnails within the program modal"
              checked={prefs.hideEpisodeThumbnails}
              onCheckedChange={(checked) =>
                setPrefs((p) => ({
                  ...p,
                  hideEpisodeThumbnails: checked,
                }))
              }
            />

            <PreferenceRow
              title="Reverse episode order"
              description="Reverse the episode order within the program modal"
              checked={prefs.reverseEpisodeOrder}
              onCheckedChange={(checked) =>
                setPrefs((p) => ({
                  ...p,
                  reverseEpisodeOrder: checked,
                }))
              }
            />
          </section>
        </div>
        <div className="border-t border-border/60 px-6 py-4 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

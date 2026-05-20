import { motion } from 'framer-motion';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import type { Preferences } from '@/lib/storage';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="max-w-lg w-full rounded-2xl bg-background p-6 shadow-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
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
          <Button onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

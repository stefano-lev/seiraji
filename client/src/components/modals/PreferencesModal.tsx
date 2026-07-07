import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import type { Preferences, CloudBackupCredentials } from '@/lib/storage';

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

  cloudBackup: CloudBackupCredentials | null;

  backupSummary: {
    manualPrograms: number;

    listening: number;
    completed: number;
    dropped: number;
    backlog: number;
  };

  onConnectBackup: (backupId: string, passkey: string) => void;

  backupLoading: boolean;

  onCreateBackup: () => void;
  onUpdateBackup: () => void;
  onRestoreBackup: () => void;
};

export function PreferencesModal({
  open,
  onClose,
  prefs,
  setPrefs,
  cloudBackup,
  backupSummary,
  onConnectBackup,
  backupLoading,
  onCreateBackup,
  onUpdateBackup,
  onRestoreBackup,
}: PreferencesModalProps) {
  const [restoreBackupId, setRestoreBackupId] = useState('');
  const [restorePasskey, setRestorePasskey] = useState('');
  const [showBackupDetails, setShowBackupDetails] = useState(false);

  const formattedCreatedAt = useMemo(() => {
    if (!cloudBackup?.createdAt) return null;

    return new Date(cloudBackup.createdAt).toLocaleString();
  }, [cloudBackup]);

  const formattedLastSync = useMemo(() => {
    if (!cloudBackup?.lastSyncedAt) return null;

    return new Date(cloudBackup.lastSyncedAt).toLocaleString();
  }, [cloudBackup]);

  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      onClick={onClose}
    >
      <motion.div
        data-tour="preferences-modal-shell"
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border/60 bg-background shadow-2xl flex flex-col"
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          data-tour="preferences-modal"
          className="border-b border-border/60 px-6 py-4"
        >
          <h2 className="text-xl font-semibold">Preferences</h2>

          <p className="text-sm text-muted-foreground mt-1">
            Customize the appearance and behavior of your library.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Cloud Backup
              </h3>

              <p className="text-sm text-muted-foreground mt-2">
                Sync your SeiRaji library across devices using your Backup ID
                and Passkey.
              </p>
            </div>

            {cloudBackup ? (
              <>
                <div className="rounded-xl border border-border/60 bg-background/40 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => setShowBackupDetails((v) => !v)}
                  >
                    <div>
                      <div className="font-medium text-sm">
                        Connected Cloud Backup
                      </div>

                      <div className="text-xs text-muted-foreground mt-1">
                        {formattedLastSync
                          ? `Last synced ${formattedLastSync}`
                          : 'Backup connected'}
                      </div>
                    </div>

                    <div
                      className={`text-xs text-muted-foreground transition-transform ${
                        showBackupDetails ? 'rotate-180' : ''
                      }`}
                    >
                      ▼
                    </div>
                  </button>

                  {showBackupDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border/60 p-4 space-y-4"
                    >
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="font-medium">Backup ID:</span>{' '}
                          {cloudBackup.backupId}
                        </div>

                        <div>
                          <span className="font-medium">Passkey:</span>{' '}
                          {cloudBackup.passkey}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                        <div className="rounded-lg border border-border/50 px-3 py-2">
                          <div className="text-muted-foreground text-xs uppercase">
                            Manual Programs
                          </div>

                          <div className="text-lg font-semibold">
                            {backupSummary.manualPrograms}
                          </div>
                        </div>

                        <div className="rounded-lg border border-border/50 px-3 py-2">
                          <div className="text-muted-foreground text-xs uppercase">
                            Listening
                          </div>

                          <div className="text-lg font-semibold">
                            {backupSummary.listening}
                          </div>
                        </div>

                        <div className="rounded-lg border border-border/50 px-3 py-2">
                          <div className="text-muted-foreground text-xs uppercase">
                            Completed
                          </div>

                          <div className="text-lg font-semibold">
                            {backupSummary.completed}
                          </div>
                        </div>

                        <div className="rounded-lg border border-border/50 px-3 py-2">
                          <div className="text-muted-foreground text-xs uppercase">
                            Dropped
                          </div>

                          <div className="text-lg font-semibold">
                            {backupSummary.dropped}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        {formattedCreatedAt && (
                          <div>Created: {formattedCreatedAt}</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={onRestoreBackup}
                    disabled={backupLoading}
                  >
                    Restore Backup
                  </Button>
                  <Button onClick={onUpdateBackup} disabled={backupLoading}>
                    {backupLoading
                      ? 'Updating Backup...'
                      : 'Update Cloud Backup'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl border border-dashed border-border/60 p-4 space-y-4">
                  <div>
                    <div className="font-medium mb-1">
                      Connect Existing Backup
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Restore your library from another device using your Backup
                      ID and Passkey.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <input
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Backup ID"
                      value={restoreBackupId}
                      onChange={(e) => setRestoreBackupId(e.target.value)}
                    />

                    <input
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Passkey"
                      value={restorePasskey}
                      onChange={(e) => setRestorePasskey(e.target.value)}
                    />
                  </div>

                  <Button
                    variant="secondary"
                    disabled={
                      backupLoading ||
                      !restoreBackupId.trim() ||
                      !restorePasskey.trim()
                    }
                    onClick={() =>
                      onConnectBackup(
                        restoreBackupId.trim(),
                        restorePasskey.trim()
                      )
                    }
                  >
                    Restore Existing Backup
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button onClick={onCreateBackup} disabled={backupLoading}>
                    {backupLoading
                      ? 'Creating Backup...'
                      : 'Create New Cloud Backup'}
                  </Button>
                </div>
              </>
            )}
          </section>
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

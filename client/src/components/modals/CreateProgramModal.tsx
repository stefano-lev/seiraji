import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { Program, ProgramPreview } from '@/types/media';

import {
  createManualProgram,
  type CreateManualProgramInput,
} from '@/lib/programs';
import { importProgram, previewProgram } from '@/lib/api';
import {
  detectPlatform,
  SUPPORTED_PLATFORMS,
  PLATFORM_LABELS,
} from '@/lib/platformDetection';
import { Badge } from '../ui/badge';

type CreateProgramModalProps = {
  open: boolean;

  onClose: () => void;

  onSubmit: (program: Program) => void;

  editingProgram?: Program | null;

  programs: Program[];
};

export function CreateProgramModal({
  open,
  onClose,
  onSubmit,
  editingProgram,
  programs,
}: CreateProgramModalProps) {
  const [title, setTitle] = useState('');
  const [hosts, setHosts] = useState('');
  const [platform, setPlatform] = useState('');
  const [schedule, setSchedule] = useState('');
  const [episodeCount, setEpisodeCount] = useState(12);
  const [description, setDescription] = useState('');
  const [url, setURL] = useState('');
  const [thumbnail, setThumbnail] = useState('');

  const [tab, setTab] = useState<'import' | 'manual'>('import');

  const [importUrl, setImportUrl] = useState('');
  const [hostOverride, setHostOverride] = useState('');
  const [importing, setImporting] = useState(false);

  const [preview, setPreview] = useState<ProgramPreview | null>(null);

  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (!editingProgram) return;

    setTitle(editingProgram.program.title);

    const rawHosts = editingProgram.program.hosts;

    const hostString = Array.isArray(rawHosts)
      ? rawHosts.join(', ')
      : typeof rawHosts === 'string'
        ? rawHosts
        : '';

    setHosts(hostString);

    setPlatform(editingProgram.platform);

    setSchedule(editingProgram.program.schedule ?? '');

    setEpisodeCount(editingProgram.episodes.length);

    setDescription(editingProgram.program.description ?? '');

    setURL(editingProgram.url ?? '');

    setThumbnail(editingProgram.program.thumbnail ?? '');
  }, [editingProgram, open]);

  const detectedPlatform = detectPlatform(importUrl);

  const normalizedImportUrl = importUrl.trim().replace(/\/$/, '');

  const duplicateProgram = programs.find(
    (program) => program.url?.trim().replace(/\/$/, '') === normalizedImportUrl
  );

  const hasHosts =
    (preview?.hosts?.length ?? 0) > 0 || hostOverride.trim().length > 0;

  if (!open) return null;

  function handleSubmit() {
    if (!title.trim()) {
      alert('Please enter a title.');
      return;
    }

    if (!platform.trim()) {
      alert('Please enter a platform.');
      return;
    }

    if (episodeCount < 1) {
      alert('Episode count must be at least 1.');
      return;
    }

    const parsedHosts = hosts
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);

    const input: CreateManualProgramInput = {
      title: title.trim(),

      hosts: parsedHosts,

      schedule: schedule.trim() || undefined,

      platform: platform.trim(),

      episodeCount,

      description: description.trim() || undefined,

      url: url.trim() || undefined,

      thumbnail: thumbnail.trim() || undefined,
    };

    const baseProgram = createManualProgram(input);

    const finalProgram: Program = editingProgram
      ? {
          ...baseProgram,

          id: editingProgram.id,

          platformId: editingProgram.platformId,

          episodes: editingProgram.episodes,

          meta: {
            ...baseProgram.meta,
            cachedAt: editingProgram.meta.cachedAt,
          },
        }
      : baseProgram;

    onSubmit(finalProgram);

    onClose();
  }

  async function handleImport() {
    const toastId = toast.loading('Importing Program', {
      description: 'Connecting...',
    });

    try {
      setImporting(true);
      const program = await importProgram(
        importUrl.trim(),
        hostOverride.trim() || undefined
      );

      toast.success('Program Imported', {
        id: toastId,
        description: program.program.title,
      });

      onSubmit(program);
      onClose();
    } catch (err) {
      setImporting(false);
      console.error(err);

      toast.error('Import Failed', {
        id: toastId,
        description: 'Unable to import program',
      });
    }
  }

  async function handlePreview() {
    if (duplicateProgram) {
      alert(
        `"${duplicateProgram.program.title}" already exists in your library.`
      );

      return;
    }

    if (!importUrl.trim()) {
      alert('Please enter a URL');
      return;
    }

    try {
      setPreviewLoading(true);

      const result = await previewProgram(importUrl, hostOverride);

      setPreview(result);
    } catch (err) {
      console.error(err);

      alert(
        'Failed to preview program metadata.\n\nPlease validate that the provided URL is correct and try again.'
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-xl max-h-[85vh] rounded-3xl border border-border/60 bg-background p-4 shadow-2xl flex flex-col"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-2 mt-4">
          <Button
            variant={tab === 'import' ? 'default' : 'secondary'}
            onClick={() => setTab('import')}
          >
            Import URL
          </Button>
          <Button
            variant={tab === 'manual' ? 'default' : 'secondary'}
            onClick={() => setTab('manual')}
          >
            Manual
          </Button>
        </div>

        <div className="border-b border-border/60 px-6 py-4">
          <h2 className="text-xl font-semibold">
            {tab === 'manual'
              ? editingProgram
                ? 'Edit Program'
                : 'Add Manual Program'
              : 'Import Program'}
          </h2>

          <p className="text-sm text-muted-foreground mt-2">
            {tab === 'manual'
              ? 'Create a custom program for unsupported platforms.'
              : 'Import a program directly from a supported platform URL.'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'manual' ? (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>

                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ラジオタイトル"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Host</label>

                <Input
                  value={hosts}
                  onChange={(e) => setHosts(e.target.value)}
                  placeholder="田村ゆかり, 水樹奈々"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Platform
                </label>

                <Input
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  placeholder="radiko"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Episode Count
                </label>

                <Input
                  type="number"
                  min={1}
                  value={episodeCount}
                  onChange={(e) => setEpisodeCount(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Description (Optional)
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  className="
                    min-h-[100px]
                    w-full
                    rounded-xl
                    border
                    border-border
                    bg-background
                    px-3
                    py-2
                    text-sm
                  "
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Frequency (optional)
                </label>

                <Input
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="weekly"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Source URL (Optional)
                </label>

                <Input
                  value={url}
                  onChange={(e) => setURL(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Thumbnail URL (Optional)
                </label>

                <Input
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          ) : preview ? (
            <div className="space-y-6">
              {preview.thumbnail && (
                <img
                  src={preview.thumbnail}
                  alt={preview.title}
                  className="w-full rounded-xl"
                />
              )}

              <div>
                <h3 className="text-xl font-semibold">{preview.title}</h3>

                <p className="text-sm text-muted-foreground">
                  {preview.platform}
                </p>
              </div>

              <div>
                <div className="font-medium">Hosts</div>

                {preview.hosts.length > 0 ? (
                  <p>{preview.hosts.join(', ')}</p>
                ) : (
                  <p className="italic text-yellow-500">No hosts detected</p>
                )}
              </div>

              {preview.hosts.length === 0 && (
                <div className="rounded-xl border border-yellow-500/15 bg-yellow-500/5 p-4 text-sm">
                  This platform could not automatically determine host names.
                  Enter a Host Override before importing.
                </div>
              )}

              <div>
                <div className="font-medium">Episodes</div>

                <p>{preview.episodeCount}</p>
              </div>

              {preview.description && (
                <div>
                  <div className="font-medium">Description</div>

                  <p className="text-sm text-muted-foreground">
                    {preview.description}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Program URL
                </label>

                <Input
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="ex. https://audee.jp/program/show/12345"
                />

                {duplicateProgram && (
                  <p className="mt-2 text-sm text-red-500">
                    "{duplicateProgram.program.title}" already exists in your
                    library.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                {SUPPORTED_PLATFORMS.map((platform) => (
                  <Badge
                    key={platform}
                    variant={
                      detectedPlatform === platform ? 'valid' : 'outline'
                    }
                  >
                    {PLATFORM_LABELS[platform]}
                  </Badge>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Host Override (Optional)
                </label>

                <Input
                  value={hostOverride}
                  onChange={(e) => setHostOverride(e.target.value)}
                  placeholder="ex. 花宮初奈, 佐々木琴子, 月音こな"
                />
              </div>

              <div className="rounded-xl border border-yellow-500/15 bg-yellow-500/5 p-4 text-sm text-muted-foreground">
                If provided, the host override will replace any host names
                extracted by the scraper.
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          {preview && (
            <Button variant="secondary" onClick={() => setPreview(null)}>
              Back
            </Button>
          )}

          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <Button
            disabled={tab === 'import' && preview !== null && !hasHosts}
            onClick={
              tab === 'manual'
                ? handleSubmit
                : preview
                  ? handleImport
                  : handlePreview
            }
          >
            {tab === 'manual'
              ? editingProgram
                ? 'Save Changes'
                : 'Create Program'
              : preview
                ? importing
                  ? 'Importing...'
                  : 'Confirm Import'
                : previewLoading
                  ? 'Previewing...'
                  : 'Preview Program'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

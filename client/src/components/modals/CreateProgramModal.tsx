import { useState, useEffect } from 'react';

import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { Program } from '@/types/media';

import {
  createManualProgram,
  type CreateManualProgramInput,
} from '@/lib/programs';
import { importProgram } from '@/lib/api';

type CreateProgramModalProps = {
  open: boolean;

  onClose: () => void;

  onSubmit: (program: Program) => void;

  editingProgram?: Program | null;
};

export function CreateProgramModal({
  open,
  onClose,
  onSubmit,
  editingProgram,
}: CreateProgramModalProps) {
  const [title, setTitle] = useState('');
  const [hosts, setHosts] = useState('');
  const [platform, setPlatform] = useState('');
  const [schedule, setSchedule] = useState('');
  const [episodeCount, setEpisodeCount] = useState(12);
  const [description, setDescription] = useState('');
  const [url, setURL] = useState('');
  const [thumbnail, setThumbnail] = useState('');

  const [tab, setTab] = useState<'manual' | 'import'>('manual');

  const [importUrl, setImportUrl] = useState('');
  const [hostOverride, setHostOverride] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!editingProgram) return;

    setTitle(editingProgram.program.title);

    setHosts((editingProgram.program.hosts ?? []).join(', '));

    setPlatform(editingProgram.platform);

    setSchedule(editingProgram.program.schedule ?? '');

    setEpisodeCount(editingProgram.episodes.length);

    setDescription(editingProgram.program.description ?? '');

    setURL(editingProgram.url ?? '');

    setThumbnail(editingProgram.program.thumbnail ?? '');
  }, [editingProgram, open]);

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
    if (!importUrl.trim()) {
      alert('Please enter a URL');
      return;
    }

    try {
      setImporting(true);

      const program = await importProgram(
        importUrl.trim(),
        hostOverride.trim() || undefined
      );

      onSubmit(program);

      onClose();
    } catch (err) {
      console.error(err);

      alert('Failed to import program');
    } finally {
      setImporting(false);
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
            variant={tab === 'manual' ? 'default' : 'secondary'}
            onClick={() => setTab('manual')}
          >
            Manual
          </Button>

          <Button
            variant={tab === 'import' ? 'default' : 'secondary'}
            onClick={() => setTab('import')}
          >
            Import URL
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
          ) : (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Program URL
                </label>

                <Input
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://audee.jp/program/show/12345"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Host Override (Optional)
                </label>

                <Input
                  value={hostOverride}
                  onChange={(e) => setHostOverride(e.target.value)}
                  placeholder="田村ゆかり"
                />
              </div>

              <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                If provided, the host override will replace any host names
                extracted by the scraper.
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <Button onClick={tab === 'manual' ? handleSubmit : handleImport}>
            {tab === 'manual'
              ? editingProgram
                ? 'Save Changes'
                : 'Create Program'
              : importing
                ? 'Importing...'
                : 'Import Program'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

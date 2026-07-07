import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type InfoModalProps = {
  open: boolean;
  onClose: () => void;
  onStartTour: () => void;
};

const supportedImports = [
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/',
    note: 'Channel and video metadata',
    status: 'Supported',
  },
  {
    name: 'AuDee',
    url: 'https://audee.jp/',
    note: 'Japanese radio programs',
    status: 'Supported',
  },
  {
    name: 'Onsen',
    url: 'https://www.onsen.ag/',
    note: 'Anime/seiyuu radio archives',
    status: 'Supported',
  },
  {
    name: 'QloveR',
    url: 'https://qlover.jp/',
    note: 'Program and episode metadata',
    status: 'Supported',
  },
  {
    name: 'Nicochannel',
    url: 'https://ch.nicovideo.jp/',
    note: 'Channel-based programs',
    status: 'Supported',
  },
  {
    name: 'OpenRec',
    url: 'https://www.openrec.tv/',
    note: 'Streaming program metadata',
    status: 'Supported',
  },
  {
    name: 'NHK',
    url: 'https://www.nhk.jp/',
    note: 'Public program pages',
    status: 'Supported',
  },
  {
    name: 'Tokyo FM',
    url: 'https://www.tfm.co.jp/',
    note: 'Radio show metadata',
    status: 'Supported',
  },
  {
    name: 'All Night Nippon',
    url: 'https://www.allnightnippon.com/',
    note: 'Radio program pages',
    status: 'Supported',
  },
  {
    name: 'Radiko Podcast',
    url: 'https://radiko.jp/podcast/',
    note: 'Podcast channel imports',
    status: 'Supported',
  },
  {
    name: 'Radiko Time-Free',
    url: 'https://radiko.jp/',
    note: 'Single broadcast snapshots',
    status: 'Snapshot',
  },
];

const faqs = [
  {
    question: 'What is SeiRaji?',
    answer:
      'SeiRaji is a media tracker for Japanese radio, podcast, and streaming programs. It helps organize shows, track listening progress, manage backlog status, and review listening history.',
  },
  {
    question: 'What does Demo Mode do?',
    answer:
      'Demo Mode loads sample progress, tags, preferences, stats, and activity history so visitors can explore the app without setting up their own library.',
  },
  {
    question: 'Why do some platforms behave differently?',
    answer:
      'Each platform exposes metadata differently. Some provide complete episode archives, while others only expose limited public data or single broadcast pages.',
  },
  {
    question: 'Where is my data stored?',
    answer:
      'User progress is stored locally in the browser unless cloud backup is configured. Demo data is safe to reset and does not require an account.',
  },
];

export function InfoModal({ open, onClose, onStartTour }: InfoModalProps) {
  if (!open) return null;

  function handleStartTour() {
    onClose();
    window.setTimeout(() => {
      onStartTour();
    }, 150);
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      onClick={onClose}
    >
      <motion.div
        data-tour="info-modal-shell"
        className="
          w-full
          max-w-4xl
          max-h-[92dvh]
          overflow-hidden
          rounded-2xl
          sm:rounded-3xl
          border border-border/60
          bg-background
          shadow-2xl
          flex flex-col
        "
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          data-tour="info-modal"
          className="
            shrink-0
            border-b border-border/60
            px-4 py-5
            sm:px-6 sm:py-6
            bg-muted/20
          "
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Badge variant="secondary" className="mb-3">
                About this project
              </Badge>

              <h2 className="text-2xl font-bold tracking-tight">
                SeiRaji is a full-stack media tracker for Japanese radio and
                podcast programs.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                It combines a searchable media library, progress tracking,
                activity history, statistics, preferences, and platform import
                tools into one app built around a real personal workflow.
              </p>
            </div>

            <div className="flex gap-2 sm:shrink-0">
              <Button variant="secondary" onClick={handleStartTour}>
                Start tour
              </Button>

              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoCard
              title="Track progress"
              body="Log episode progress, status, tags, pinned programs, and listening history."
            />

            <InfoCard
              title="Import metadata"
              body="Import supported program URLs and normalize them into a shared library format."
            />

            <InfoCard
              title="Explore demo data"
              body="Try the app with seeded progress, stats, preferences, and activity history."
            />
          </div>

          <section className="mt-6 rounded-2xl border border-border/60 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="font-semibold">Supported imports</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  These are the platform currently supported by the importer
                  system. Some sources expose more complete metadata than
                  others.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {supportedImports.map((platform) => (
                <a
                  key={platform.name}
                  href={platform.url}
                  target="_blank"
                  rel="noreferrer"
                  className="
                    group
                    rounded-xl
                    border border-border/60
                    bg-muted/20
                    p-3
                    transition-colors
                    hover:bg-muted/40
                  "
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {platform.name}
                        </span>

                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                      </div>

                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {platform.note}
                      </p>
                    </div>

                    <Badge
                      variant={
                        platform.status === 'Snapshot' ? 'outline' : 'secondary'
                      }
                      className="shrink-0 text-[10px]"
                    >
                      {platform.status}
                    </Badge>
                  </div>
                </a>
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-2xl border border-border/60 p-4">
              <h3 className="font-semibold">FAQ</h3>

              <div className="mt-4 space-y-4">
                {faqs.map((item) => (
                  <div key={item.question}>
                    <h4 className="text-sm font-medium">{item.question}</h4>

                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 p-4">
              <h3 className="font-semibold">Project links</h3>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                SeiRaji was built as a portfolio project around a real niche
                workflow: tracking weekly Japanese radio and seiyuu/idol media
                across fragmented platforms.
              </p>

              <div className="mt-4 grid gap-2">
                <ExternalButton href="https://stef-lev.xyz/">
                  Portfolio
                </ExternalButton>

                <ExternalButton href="https://github.com/stefano-lev/seiraji">
                  GitHub Repository
                </ExternalButton>

                <ExternalButton href="https://github.com/stefano-lev/seiraji#readme">
                  Project README
                </ExternalButton>
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
      <h3 className="font-semibold">{title}</h3>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}

function ExternalButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="
        flex
        items-center
        justify-between
        gap-3
        rounded-xl
        border border-border/60
        px-3 py-2
        text-sm
        transition-colors
        hover:bg-muted/40
      "
    >
      <span>{children}</span>
      <ExternalLink className="h-4 w-4 text-muted-foreground" />
    </a>
  );
}

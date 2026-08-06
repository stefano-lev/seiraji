import fs from 'node:fs/promises';
import path from 'node:path';
import util from 'node:util';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LoggerContext = {
  runId?: string;
  platform?: string;
  title?: string;
  id?: string;
  url?: string;
};

type LoggerOptions = {
  name: string;
  context?: LoggerContext;
  lines?: string[];
};

export type AppLogger = {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  child: (context: LoggerContext) => AppLogger;
  getLines: () => string[];
  writeToFile: (directory: string, filename?: string) => Promise<string>;
};

export function createLogger(options: LoggerOptions): AppLogger {
  const lines = options.lines ?? [];
  const context = options.context ?? {};

  function write(level: LogLevel, args: unknown[]) {
    const timestamp = new Date().toISOString();

    const prefixParts = [
      timestamp,
      level.toUpperCase().padEnd(5),
      options.name,
      context.runId ? `run=${context.runId}` : null,
      context.platform ? `platform=${context.platform}` : null,
      context.title ? `title="${context.title}"` : null,
      context.id ? `id=${context.id}` : null,
    ].filter(Boolean);

    const message = util.format(...args);
    const line = `[${prefixParts.join(' ')}] ${message}`;

    lines.push(line);

    if (level === 'error') {
      console.error(line);
      return;
    }

    if (level === 'warn') {
      console.warn(line);
      return;
    }

    console.log(line);
  }

  return {
    debug: (...args) => write('debug', args),
    info: (...args) => write('info', args),
    warn: (...args) => write('warn', args),
    error: (...args) => write('error', args),

    child(childContext) {
      return createLogger({
        name: options.name,
        context: {
          ...context,
          ...childContext,
        },
        lines,
      });
    },

    getLines() {
      return [...lines];
    },

    async writeToFile(directory, filename) {
      await fs.mkdir(directory, { recursive: true });

      const safeFilename = filename ?? `${safeTimestamp()}.log`;
      const filePath = path.join(directory, safeFilename);

      await fs.writeFile(filePath, `${lines.join('\n')}\n`, 'utf8');

      return filePath;
    },
  };
}

export function errorToLogString(error: unknown) {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  return String(error);
}

export function safeTimestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

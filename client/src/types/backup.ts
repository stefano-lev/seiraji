import type { Program } from './media';
import type { UserProgramState } from './user';

export type BackupPayload = {
  version: number;

  exportedAt: string;

  manualPrograms: Program[];

  userState: UserProgramState[];

  activity: unknown[];

  prefs: Record<string, unknown>;
};

export type CreateBackupRequest = {
  payload: BackupPayload;
};

export type CreateBackupResponse = {
  backupId: string;
  passkey: string;
};

export type RestoreBackupRequest = {
  backupId: string;
  passkey: string;
};

export type UpdateBackupRequest = {
  backupId: string;
  passkey: string;
  payload: BackupPayload;
};

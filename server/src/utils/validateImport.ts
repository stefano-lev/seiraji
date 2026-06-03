import { readCache } from './cache';

export function validateHosts(
  hosts: string[] | undefined,
  hostOverride?: string
) {
  const hasDetectedHosts = (hosts?.length ?? 0) > 0;

  const hasOverride =
    typeof hostOverride === 'string' && hostOverride.trim().length > 0;

  if (!hasDetectedHosts && !hasOverride) {
    throw new Error('No hosts detected. Please provide a host override.');
  }
}

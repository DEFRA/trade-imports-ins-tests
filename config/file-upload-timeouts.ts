import { timeouts } from '@config/timeouts';

/**
 * Timeouts for file uploads and virus scanning. The scan ceiling is sized for
 * CDP's real scanner, which takes about 30s on the EICAR file; the local stub
 * settles on its first refresh read, so only a failing scan ever pays it.
 */
export const fileUploadTimeouts = {
  documentsListVisible: timeouts.medium,
  virusScanComplete: 90_000,
} as const;

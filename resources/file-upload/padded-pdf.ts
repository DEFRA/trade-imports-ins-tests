import { copyFile, mkdir, truncate } from 'node:fs/promises';
import path from 'node:path';
import { fileUploadPaths } from '@resources/file-upload/paths';

/**
 * Writes a copy of a real PDF, padded with zeros to an exact byte count.
 *
 * @param destination - the path to write to
 * @param bytes - the exact size to pad to
 * @returns the path written
 */
export const writePaddedPdf = async (destination: string, bytes: number): Promise<string> => {
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(fileUploadPaths.safeFile1kbPdf, destination);
  await truncate(destination, bytes);
  return destination;
};

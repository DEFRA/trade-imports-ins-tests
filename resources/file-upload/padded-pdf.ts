import { copyFile, mkdir, stat, truncate } from 'node:fs/promises';
import path from 'node:path';
import { expect } from '@playwright/test';
import { fileUploadPaths } from '@resources/file-upload/paths';

/**
 * A real PDF padded to an exact size, for the tests that turn on how large a file is. A synthetic
 * zero-filled file would do for the size, but this keeps a genuine PDF header on it so the upload
 * service sees the content type the browser declares.
 *
 * @param destination - where to write it, normally `testInfo.outputPath(...)`
 * @param bytes - the exact size to pad to
 * @returns the path to pass to `setInputFiles`
 */
export const paddedPdf = async (destination: string, bytes: number): Promise<string> => {
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(fileUploadPaths.safeFile1kbPdf, destination);
  await truncate(destination, bytes);
  expect((await stat(destination)).size).toBe(bytes);
  return destination;
};

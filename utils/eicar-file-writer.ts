import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type EicarWrittenFile = { filePath: string; fileName: string };

// Mock uploader: filename containing "virus" triggers an INFECTED result during virus scanning.
// CDP uploader (real): detects the standard EICAR signature in the file bytes during virus scanning.
export const EICAR_DEFAULT_PDF_FILENAME = 'eicar-virus-file.pdf';

const EICAR_STANDARD_FILE_B64 = 'WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLVNUQU5EQVJELUFOVElWSVJVUy1URVNULUZJTEUhJEgrSCo=';

/**
 * Decodes the official 68-byte EICAR test file payload (stored as base64 to avoid the raw signature in source).
 *
 * @see https://www.eicar.org/download-anti-malware-testfile/
 */
export function eicarStandardFileBytes(): Buffer {
  return Buffer.from(EICAR_STANDARD_FILE_B64, 'base64');
}

/** Writes EICAR bytes under resolved `outDir` using `path.basename(fileName)`. Returns {@link EicarWrittenFile} with `filePath` for Playwright `locator.setInputFiles` and `fileName` set to that basename. */
export async function writeEicarTestFile(outDir: string, fileName: string): Promise<EicarWrittenFile> {
  const base = path.basename(fileName);
  const absoluteOutDir = path.resolve(outDir);
  await mkdir(absoluteOutDir, { recursive: true });
  const filePath = path.join(absoluteOutDir, base);
  await writeFile(filePath, eicarStandardFileBytes());
  return { filePath, fileName: base };
}

/** Same as {@link writeEicarTestFile} with {@link EICAR_DEFAULT_PDF_FILENAME}. */
export async function writeEicarPdfFile(outDir: string): Promise<EicarWrittenFile> {
  return writeEicarTestFile(outDir, EICAR_DEFAULT_PDF_FILENAME);
}

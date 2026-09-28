import { mkdir, open } from 'node:fs/promises';
import path from 'node:path';

export type SyntheticWrittenFile = { filePath: string; fileName: string };

/** 1000 bytes per decimal KB (for `{ kb: n }` in {@link SyntheticFileSize}; not 1024-based KiB). */
export const DECIMAL_BYTES_PER_KB = 1000;
/** 1000² bytes per decimal MB (for `{ mb: n }` in {@link SyntheticFileSize}; typical product “MB”). */
export const DECIMAL_BYTES_PER_MB = DECIMAL_BYTES_PER_KB * DECIMAL_BYTES_PER_KB;

const CHUNK_BYTES = 4 * DECIMAL_BYTES_PER_MB;
const DEFAULT_MAX_BYTES = 100 * DECIMAL_BYTES_PER_MB;

/** Pass exactly one of `bytes`, `kb`, or `mb` (decimal KB/MB: 1000 and 1000²). */
export type SyntheticFileSize = { bytes: number } | { kb: number } | { mb: number };

export type WriteSyntheticFileOptions = {
  /** Upper bound on output size in **bytes** (default 100 MB decimal). */
  maxBytes?: number;
};

function decimalUnitsToBytes(value: number, bytesPerUnit: number, unit: 'kb' | 'mb'): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${unit} must be a finite non-negative number`);
  }
  return Math.round(value * bytesPerUnit);
}

function syntheticFileSizeToBytes(size: SyntheticFileSize): number {
  const keys = Object.keys(size) as (keyof SyntheticFileSize)[];
  if (keys.length !== 1) {
    throw new TypeError('Specify exactly one of: bytes, kb, mb');
  }

  if ('bytes' in size) {
    if (!Number.isInteger(size.bytes) || size.bytes < 0) {
      throw new RangeError('bytes must be a non-negative integer');
    }
    return size.bytes;
  }

  if ('kb' in size) {
    return decimalUnitsToBytes(size.kb, DECIMAL_BYTES_PER_KB, 'kb');
  }

  if ('mb' in size) {
    return decimalUnitsToBytes(size.mb, DECIMAL_BYTES_PER_MB, 'mb');
  }

  throw new TypeError('Expected { bytes }, { kb }, or { mb }');
}

/**
 * Writes a zero-filled binary file under `outDir`, using `path.basename(fileName)` so the basename (including a
 * suffix like `.jpg`) is preserved without path segments escaping `outDir`. Payload is zeros only—not a valid file of that type.
 * `size` uses **decimal** KB/MB (1000 and 1000² bytes), matching typical “MB” in product limits.
 * Returns {@link SyntheticWrittenFile} with `filePath` for Playwright `locator.setInputFiles(filePath)`.
 */
export async function writeSyntheticFile(
  outDir: string,
  fileName: string,
  size: SyntheticFileSize,
  options?: WriteSyntheticFileOptions,
): Promise<SyntheticWrittenFile> {
  const sizeBytes = syntheticFileSizeToBytes(size);

  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;
  if (sizeBytes > maxBytes) {
    throw new RangeError(`size (${sizeBytes} bytes) exceeds maxBytes (${maxBytes})`);
  }

  const base = path.basename(fileName);
  const absoluteOutDir = path.resolve(outDir);
  await mkdir(absoluteOutDir, { recursive: true });
  const filePath = path.join(absoluteOutDir, base);

  const handle = await open(filePath, 'w');
  try {
    let remaining = sizeBytes;
    while (remaining > 0) {
      const chunkSize = Math.min(CHUNK_BYTES, remaining);
      const buf = Buffer.alloc(chunkSize, 0);
      await handle.write(buf, 0, chunkSize, null);
      remaining -= chunkSize;
    }
  } finally {
    await handle.close();
  }

  return { filePath, fileName: base };
}

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Disk cache keyed on input. During development the same test text gets pasted
 * dozens of times — without this, every paste is another API bill. First run
 * pays; every re-run is free.
 *
 * Dev-only by design: on Vercel the filesystem is read-only and ephemeral, so
 * writes are skipped silently and everything just runs live.
 */

const DIR = path.join(process.cwd(), ".cache");
const enabled = process.env.NODE_ENV !== "production";

export function keyOf(...parts: unknown[]): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 32);
}

export async function cached<T>(key: string, produce: () => Promise<T>): Promise<T> {
  if (!enabled) return produce();

  const file = path.join(DIR, `${key}.json`);
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    // Miss — fall through and produce it.
  }

  const value = await produce();
  try {
    await mkdir(DIR, { recursive: true });
    await writeFile(file, JSON.stringify(value), "utf8");
  } catch {
    // A cache that can't write is still correct, just slower.
  }
  return value;
}

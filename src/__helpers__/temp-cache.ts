/**
 * Temp directory helpers for cache tests.
 * Creates a temp dir and provides a cleanup function.
 */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface TempDir {
  path: string;
  cleanup: () => Promise<void>;
}

/**
 * Create a temporary directory for test isolation.
 */
export async function createTempDir(prefix = "ff-mcp-test-"): Promise<TempDir> {
  const path = await mkdtemp(join(tmpdir(), prefix));
  return {
    path,
    cleanup: () => rm(path, { recursive: true, force: true }),
  };
}

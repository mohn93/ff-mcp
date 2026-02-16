import { mkdir, readFile, writeFile, unlink, readdir } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Metadata stored alongside the cached YAML files for a project.
 */
export interface CacheMeta {
  lastSyncedAt: string;
  fileCount: number;
  syncMethod: "bulk" | "batched";
}

// ---------------------------------------------------------------------------
// Project root resolution
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Project root: two levels up from src/utils/ */
const PROJECT_ROOT = resolve(__dirname, "..", "..");

const CACHE_DIR_NAME = ".ff-cache";
const META_FILE = "_meta.json";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the cache directory for a given project.
 * Returns an absolute path: `<projectRoot>/.ff-cache/<projectId>/`
 */
export function cacheDir(projectId: string): string {
  return join(PROJECT_ROOT, CACHE_DIR_NAME, projectId);
}

/**
 * Convert a FlutterFlow file key to a cache file path.
 * `page/id-Scaffold_xxx` -> `.ff-cache/{pid}/page/id-Scaffold_xxx.yaml`
 */
function keyToPath(projectId: string, fileKey: string): string {
  return join(cacheDir(projectId), `${fileKey}.yaml`);
}

/**
 * Ensure a directory exists (recursive mkdir, no-op if already there).
 */
async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read a cached YAML string for a given file key.
 * Returns `null` if the file does not exist.
 */
export async function cacheRead(
  projectId: string,
  fileKey: string
): Promise<string | null> {
  try {
    const content = await readFile(keyToPath(projectId, fileKey), "utf-8");
    return content;
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

/**
 * Write a single YAML string to the cache, creating directories as needed.
 */
export async function cacheWrite(
  projectId: string,
  fileKey: string,
  content: string
): Promise<void> {
  const filePath = keyToPath(projectId, fileKey);
  await ensureDir(dirname(filePath));
  await writeFile(filePath, content, "utf-8");
}

/**
 * Delete a single cached file. No-op if the file does not exist.
 */
export async function cacheInvalidate(
  projectId: string,
  fileKey: string
): Promise<void> {
  try {
    await unlink(keyToPath(projectId, fileKey));
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === "ENOENT") {
      return; // already gone — no-op
    }
    throw err;
  }
}

/**
 * Write multiple YAML entries to the cache in one call.
 * Returns the number of entries written.
 */
export async function cacheWriteBulk(
  projectId: string,
  entries: Record<string, string>
): Promise<number> {
  const keys = Object.keys(entries);
  await Promise.all(
    keys.map((key) => cacheWrite(projectId, key, entries[key]))
  );
  return keys.length;
}

/**
 * Read the `_meta.json` file for a project cache.
 * Returns `null` if it does not exist.
 */
export async function cacheMeta(
  projectId: string
): Promise<CacheMeta | null> {
  const metaPath = join(cacheDir(projectId), META_FILE);
  try {
    const raw = await readFile(metaPath, "utf-8");
    return JSON.parse(raw) as CacheMeta;
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

/**
 * Write (or overwrite) the `_meta.json` file for a project cache.
 */
export async function cacheWriteMeta(
  projectId: string,
  meta: CacheMeta
): Promise<void> {
  const dir = cacheDir(projectId);
  await ensureDir(dir);
  await writeFile(join(dir, META_FILE), JSON.stringify(meta, null, 2), "utf-8");
}

/**
 * Walk the cache directory for a project and return all cached file keys,
 * optionally filtered by a prefix (e.g. `"page/"` to list only pages).
 *
 * File keys are reconstructed by stripping the `.yaml` extension and making
 * the path relative to the project cache dir.
 */
export async function listCachedKeys(
  projectId: string,
  prefix?: string
): Promise<string[]> {
  const root = cacheDir(projectId);
  const keys: string[] = [];

  try {
    await walkDir(root, root, keys);
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === "ENOENT") {
      return []; // cache dir doesn't exist yet
    }
    throw err;
  }

  const yamlKeys = keys
    .filter((k) => k.endsWith(".yaml"))
    .map((k) => k.slice(0, -".yaml".length));

  if (prefix) {
    return yamlKeys.filter((k) => k.startsWith(prefix));
  }
  return yamlKeys;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Recursively walk a directory, collecting relative paths of files.
 */
async function walkDir(
  base: string,
  dir: string,
  out: string[]
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDir(base, full, out);
    } else if (entry.isFile()) {
      // Relative path from cache root, using forward slashes for consistency
      const rel = full.slice(base.length + 1).split("\\").join("/");
      out.push(rel);
    }
  }
}

/**
 * Type guard for Node.js system errors (which carry a `code` property).
 */
function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err;
}

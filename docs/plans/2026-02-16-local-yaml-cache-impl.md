# Local YAML Cache Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a file-per-YAML local cache layer to avoid FlutterFlow API rate limits. One `sync_project` call populates the cache; all read tools check cache first; writes update the cache.

**Architecture:** New `src/utils/cache.ts` module provides read/write/invalidate primitives. New `src/tools/sync-project.ts` tool does bulk or batched fetch to populate cache. Existing tools get thin cache-first wrappers. Cache lives in `.ff-cache/{projectId}/` on disk.

**Tech Stack:** Node.js `fs/promises`, `path`, existing `adm-zip` + `decode-yaml.ts`. No new dependencies.

**Validation:** No test framework exists. `npm run build` (clean TypeScript compile) is the primary validation after every task.

---

### Task 1: Add `.ff-cache/` to `.gitignore`

**Files:**
- Modify: `.gitignore`

**Step 1: Add the cache directory to gitignore**

Append `.ff-cache/` to the end of `.gitignore`:

```
node_modules/
build/
.env
.ff-cache/
```

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore .ff-cache directory"
```

---

### Task 2: Create cache utility module

**Files:**
- Create: `src/utils/cache.ts`

**Step 1: Write the cache utility**

```typescript
import { mkdir, readFile, writeFile, unlink, readdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");
const CACHE_ROOT = join(PROJECT_ROOT, ".ff-cache");

export interface CacheMeta {
  lastSyncedAt: string;
  fileCount: number;
  syncMethod: "bulk" | "batched";
}

/** Resolve the cache directory for a given project. */
export function cacheDir(projectId: string): string {
  return join(CACHE_ROOT, projectId);
}

/** Convert a FF file key to a cache file path. e.g. "page/id-Scaffold_xxx" -> ".ff-cache/{pid}/page/id-Scaffold_xxx.yaml" */
function cacheFilePath(projectId: string, fileKey: string): string {
  return join(cacheDir(projectId), `${fileKey}.yaml`);
}

/** Read a cached YAML file. Returns null on miss. */
export async function cacheRead(
  projectId: string,
  fileKey: string
): Promise<string | null> {
  try {
    return await readFile(cacheFilePath(projectId, fileKey), "utf-8");
  } catch {
    return null;
  }
}

/** Write a YAML string to the cache, creating directories as needed. */
export async function cacheWrite(
  projectId: string,
  fileKey: string,
  content: string
): Promise<void> {
  const filePath = cacheFilePath(projectId, fileKey);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf-8");
}

/** Delete a single cached file. No-op if it doesn't exist. */
export async function cacheInvalidate(
  projectId: string,
  fileKey: string
): Promise<void> {
  try {
    await unlink(cacheFilePath(projectId, fileKey));
  } catch {
    // file doesn't exist, that's fine
  }
}

/** Write bulk cache entries from a decoded YAML map (as returned by decodeProjectYamlResponse). */
export async function cacheWriteBulk(
  projectId: string,
  entries: Record<string, string>
): Promise<number> {
  let count = 0;
  for (const [fileKey, content] of Object.entries(entries)) {
    await cacheWrite(projectId, fileKey, content);
    count++;
  }
  return count;
}

/** Read _meta.json for a project. Returns null if no sync has happened. */
export async function cacheMeta(
  projectId: string
): Promise<CacheMeta | null> {
  try {
    const raw = await readFile(
      join(cacheDir(projectId), "_meta.json"),
      "utf-8"
    );
    return JSON.parse(raw) as CacheMeta;
  } catch {
    return null;
  }
}

/** Write _meta.json for a project. */
export async function cacheWriteMeta(
  projectId: string,
  meta: CacheMeta
): Promise<void> {
  const dir = cacheDir(projectId);
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, "_meta.json"),
    JSON.stringify(meta, null, 2),
    "utf-8"
  );
}

/**
 * List all cached file keys for a project matching an optional prefix.
 * e.g. listCachedKeys(pid, "page/") returns ["page/id-Scaffold_xxx", ...]
 */
export async function listCachedKeys(
  projectId: string,
  prefix?: string
): Promise<string[]> {
  const keys: string[] = [];
  const baseDir = cacheDir(projectId);

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith(".yaml")) {
        // Convert path back to file key: remove base dir and .yaml extension
        const relative = fullPath.slice(baseDir.length + 1); // +1 for separator
        const fileKey = relative.replace(/\.yaml$/, "");
        if (!prefix || fileKey.startsWith(prefix)) {
          keys.push(fileKey);
        }
      }
    }
  }

  await walk(baseDir);
  return keys;
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean compile, no errors.

**Step 3: Commit**

```bash
git add src/utils/cache.ts
git commit -m "feat: add local YAML cache utility module"
```

---

### Task 3: Create `sync_project` tool

**Files:**
- Create: `src/tools/sync-project.ts`
- Modify: `src/index.ts` (register the tool)

**Step 1: Write the sync tool**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FlutterFlowClient } from "../api/flutterflow.js";
import { decodeProjectYamlResponse } from "../utils/decode-yaml.js";
import { cacheWriteBulk, cacheWriteMeta, cacheMeta } from "../utils/cache.js";
import { extractPageFileKeys, fetchOneFile } from "./list-pages.js";
import { cacheWrite } from "../utils/cache.js";

export function registerSyncProjectTool(
  server: McpServer,
  client: FlutterFlowClient
) {
  server.tool(
    "sync_project",
    "Download all project YAML files to local cache. Run this once per session to enable fast, offline reads. Subsequent tool calls will read from cache instead of hitting the API.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      force: z
        .boolean()
        .optional()
        .describe("Force re-sync even if cache exists (default: false)"),
    },
    async ({ projectId, force }) => {
      // Check existing cache
      if (!force) {
        const meta = await cacheMeta(projectId);
        if (meta) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Cache already exists (synced ${meta.lastSyncedAt}, ${meta.fileCount} files via ${meta.syncMethod}). Use force: true to re-sync.`,
              },
            ],
          };
        }
      }

      // Try bulk fetch first
      try {
        const raw = await client.getProjectYamls(projectId);
        const decoded = decodeProjectYamlResponse(raw);
        const count = await cacheWriteBulk(projectId, decoded);
        const meta = {
          lastSyncedAt: new Date().toISOString(),
          fileCount: count,
          syncMethod: "bulk" as const,
        };
        await cacheWriteMeta(projectId, meta);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { syncedFiles: count, failed: 0, method: "bulk", cachedAt: meta.lastSyncedAt },
                null,
                2
              ),
            },
          ],
        };
      } catch {
        // Bulk failed (likely buffer overflow), fall back to batched
      }

      // Fallback: batched fetch
      const fileNamesRaw = await client.listPartitionedFileNames(projectId);
      const raw = fileNamesRaw as {
        value?: { file_names?: string[]; fileNames?: string[] };
      };
      const allKeys = raw?.value?.file_names ?? raw?.value?.fileNames ?? [];

      let synced = 0;
      let failed = 0;
      const BATCH_SIZE = 5;

      for (let i = 0; i < allKeys.length; i += BATCH_SIZE) {
        const batch = allKeys.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(async (fileKey) => {
            const result = await fetchOneFile(client, projectId, fileKey);
            if (result) {
              await cacheWrite(projectId, fileKey, result.content);
              return true;
            }
            return false;
          })
        );
        for (const r of results) {
          if (r.status === "fulfilled" && r.value) synced++;
          else failed++;
        }
      }

      const meta = {
        lastSyncedAt: new Date().toISOString(),
        fileCount: synced,
        syncMethod: "batched" as const,
      };
      await cacheWriteMeta(projectId, meta);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { syncedFiles: synced, failed, method: "batched", cachedAt: meta.lastSyncedAt },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
```

**Step 2: Register in index.ts**

Add to `src/index.ts` imports:
```typescript
import { registerSyncProjectTool } from "./tools/sync-project.js";
```

Add after the existing tool registrations:
```typescript
registerSyncProjectTool(server, client);
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean compile.

**Step 4: Commit**

```bash
git add src/tools/sync-project.ts src/index.ts
git commit -m "feat: add sync_project tool for bulk cache population"
```

---

### Task 4: Add cache-first reads to `get_project_yaml`

**Files:**
- Modify: `src/tools/get-yaml.ts`

**Step 1: Update get-yaml.ts**

Add cache import at top:
```typescript
import { cacheRead, cacheWrite } from "../utils/cache.js";
```

Inside the tool handler, before the API call, add cache check. After API call, write to cache. The handler becomes:

```typescript
async ({ projectId, fileName }) => {
  // Cache-first for single-file requests
  if (fileName) {
    const cached = await cacheRead(projectId, fileName);
    if (cached) {
      return {
        content: [
          {
            type: "text" as const,
            text: `# ${fileName} (cached)\n${cached}`,
          },
        ],
      };
    }
  }

  const raw = await client.getProjectYamls(projectId, fileName);
  const decoded = decodeProjectYamlResponse(raw);

  // Write fetched results to cache
  for (const [name, yaml] of Object.entries(decoded)) {
    await cacheWrite(projectId, name, yaml);
  }

  const entries = Object.entries(decoded);
  if (entries.length === 1) {
    const [name, yaml] = entries[0];
    return {
      content: [
        {
          type: "text" as const,
          text: `# ${name}\n${yaml}`,
        },
      ],
    };
  }

  return {
    content: entries.map(([name, yaml]) => ({
      type: "text" as const,
      text: `# ${name}\n${yaml}`,
    })),
  };
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean compile.

**Step 3: Commit**

```bash
git add src/tools/get-yaml.ts
git commit -m "feat: add cache-first reads to get_project_yaml"
```

---

### Task 5: Add cache-first reads to `list_pages`

**Files:**
- Modify: `src/tools/list-pages.ts`

**Step 1: Update list-pages.ts**

Add cache imports at top:
```typescript
import { cacheRead, cacheWrite, listCachedKeys } from "../utils/cache.js";
```

Update the `fetchOneFile` function to check cache first:
```typescript
export async function fetchOneFile(
  client: FlutterFlowClient,
  projectId: string,
  fileName: string
): Promise<{ fileKey: string; content: string } | null> {
  // Check cache first
  const cached = await cacheRead(projectId, fileName);
  if (cached) {
    return { fileKey: fileName, content: cached };
  }

  try {
    const raw = await client.getProjectYamls(projectId, fileName);
    const decoded = decodeProjectYamlResponse(raw);
    const entries = Object.entries(decoded);
    if (entries.length > 0) {
      // Write to cache on fetch
      await cacheWrite(projectId, fileName, entries[0][1]);
      return { fileKey: fileName, content: entries[0][1] };
    }
    return null;
  } catch {
    return null;
  }
}
```

This is the linchpin — since `listPages` and `get_page_by_name` both call `fetchOneFile`, adding cache to this one function cascades to both tools automatically.

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean compile.

**Step 3: Commit**

```bash
git add src/tools/list-pages.ts
git commit -m "feat: add cache-first reads to fetchOneFile (list_pages + get_page_by_name)"
```

---

### Task 6: Add cache-first to `list_project_files`

**Files:**
- Modify: `src/tools/list-files.ts`

**Step 1: Update list-files.ts**

Add cache imports:
```typescript
import { listCachedKeys, cacheMeta } from "../utils/cache.js";
```

Update the handler to return cached keys if a sync has happened:

```typescript
async ({ projectId }) => {
  // If cache exists, return file keys from cache
  const meta = await cacheMeta(projectId);
  if (meta) {
    const keys = await listCachedKeys(projectId);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { value: { file_names: keys }, source: "cache", syncedAt: meta.lastSyncedAt },
            null,
            2
          ),
        },
      ],
    };
  }

  const result = await client.listPartitionedFileNames(projectId);
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean compile.

**Step 3: Commit**

```bash
git add src/tools/list-files.ts
git commit -m "feat: add cache-first reads to list_project_files"
```

---

### Task 7: Update `update_project_yaml` to refresh cache on write

**Files:**
- Modify: `src/tools/update-yaml.ts`

**Step 1: Update update-yaml.ts**

Add cache import:
```typescript
import { cacheWrite } from "../utils/cache.js";
```

After the successful API call, write updated content to cache:

```typescript
async ({ projectId, fileKeyToContent }) => {
  const result = await client.updateProjectByYaml(
    projectId,
    fileKeyToContent
  );

  // Update cache with the pushed content
  for (const [fileKey, content] of Object.entries(fileKeyToContent)) {
    await cacheWrite(projectId, fileKey, content);
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean compile.

**Step 3: Commit**

```bash
git add src/tools/update-yaml.ts
git commit -m "feat: update cache on successful YAML push"
```

---

### Task 8: Final build verification and cleanup

**Files:**
- All modified files

**Step 1: Clean build**

```bash
rm -rf build && npm run build
```

Expected: Clean compile, no errors, no warnings.

**Step 2: Verify the MCP server starts**

```bash
FLUTTERFLOW_API_TOKEN=test npm start
```

Expected: Prints "FlutterFlow MCP server running on stdio" to stderr (will exit since stdin is not a valid MCP transport, but the message confirms startup).

**Step 3: Final commit (if any uncommitted changes)**

```bash
git status
```

If clean, done. Otherwise commit any remaining changes.

# Local YAML Cache for FF MCP

**Date:** 2026-02-16
**Status:** Approved

## Problem

Every `list_pages` call makes 1 + 1 + N API calls (file list + folders + one per page). `get_page_by_name` fetches pages sequentially until it finds a match. This burns through FlutterFlow's rate limits quickly, causing 429 errors mid-session.

## Solution

File-per-YAML local cache in `.ff-cache/{projectId}/`, populated by a new `sync_project` tool and auto-populated on cache misses by existing tools. Writes invalidate affected cache entries.

## Cache File Structure

```
.ff-cache/
  {projectId}/
    _meta.json              # { lastSyncedAt, fileCount, syncMethod }
    app-details.yaml
    folders.yaml
    theme-settings.yaml
    page/
      id-Scaffold_xxx.yaml
      ...
    component/
      ...
    custom-code/
      ...
```

File keys from FF map directly to paths. `page/id-Scaffold_xxx` becomes `page/id-Scaffold_xxx.yaml`. `.ff-cache/` is gitignored.

## New Tool: `sync_project`

```
sync_project(projectId, force?)
```

**Primary path:** `getProjectYamls(projectId)` with no `fileName` — returns entire project as one base64 ZIP. Decode and write each entry to disk.

**Fallback path:** If bulk call fails (buffer error), fall back to `listPartitionedFileNames` + batch-fetch 5 at a time + write each to disk.

Returns: `{ syncedFiles, failed, method: "bulk" | "batched", cachedAt }`

## Cache Utility: `src/utils/cache.ts`

- `cacheRead(projectId, fileKey)` — returns cached YAML string or `null`
- `cacheWrite(projectId, fileKey, content)` — writes YAML to disk
- `cacheInvalidate(projectId, fileKey)` — deletes one cached file
- `cacheMeta(projectId)` — reads `_meta.json`
- `cacheDir(projectId)` — resolves `.ff-cache/{projectId}/`

## Tool Changes

| Tool | Change |
|------|--------|
| `get_project_yaml` | Cache-first. On miss → API → write cache. |
| `list_pages` | Read cached `page/id-Scaffold_*` files. Zero API calls if synced. On miss → existing batch logic + cache each result. |
| `get_page_by_name` | Search cached files locally instead of sequential API calls. Biggest win. |
| `list_project_files` | Cache file list from API response. |
| `update_project_yaml` | After API push → overwrite cached file(s) for updated keys. |
| `validate_yaml` | No caching — always hits API. |

## Invalidation Strategy

- Writes (`update_project_yaml`) invalidate the affected cached file(s) by overwriting with the new content.
- Reads never auto-expire. `_meta.json` stores `lastSyncedAt` for visibility.
- User can re-run `sync_project` to refresh everything.

## Edge Cases

- **Bulk fetch buffer overflow:** Falls back to batched mode.
- **Stale cache:** `_meta.json` shows age. No auto-expiry.
- **Concurrent writes:** Not a concern — single-process MCP server.
- **Disk space:** YAML text, typically a few MB. Negligible.
- **Multiple projects:** Each gets own subdirectory.

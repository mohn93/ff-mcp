import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FlutterFlowClient } from "../api/flutterflow.js";
import { decodeProjectYamlResponse } from "../utils/decode-yaml.js";
import {
  cacheWriteBulk,
  cacheWriteMeta,
  cacheWrite,
  cacheMeta,
  type CacheMeta,
} from "../utils/cache.js";
import { fetchOneFile } from "./list-pages.js";

/**
 * Extract top-level file keys from the listPartitionedFileNames response.
 * Filters out deeply nested sub-files (widget nodes, etc.) that can't be
 * fetched individually and would hammer the API with thousands of requests.
 * Top-level keys have at most 2 path segments (e.g. "page/id-Scaffold_xxx").
 */
function extractTopLevelFileKeys(fileNamesRaw: unknown): string[] {
  const raw = fileNamesRaw as {
    value?: { file_names?: string[]; fileNames?: string[] };
  };
  const allKeys = raw?.value?.file_names ?? raw?.value?.fileNames ?? [];
  return allKeys.filter((key) => key.split("/").length <= 2);
}

/**
 * Process items in batches to avoid API rate limits.
 */
async function batchProcess<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

export function registerSyncProjectTool(
  server: McpServer,
  client: FlutterFlowClient
) {
  server.tool(
    "sync_project",
    "Sync an entire FlutterFlow project to the local cache. Downloads all YAML files (bulk or batched fallback) for fast offline reads. Use force=true to re-sync an already cached project.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      force: z
        .boolean()
        .optional()
        .describe(
          "Force re-sync even if cache already exists (default: false)"
        ),
    },
    async ({ projectId, force }) => {
      // Check existing cache unless force is set
      if (!force) {
        const existing = await cacheMeta(projectId);
        if (existing) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    status: "already_cached",
                    message:
                      "Project is already cached. Pass force=true to re-sync.",
                    cachedAt: existing.lastSyncedAt,
                    fileCount: existing.fileCount,
                    syncMethod: existing.syncMethod,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }

      // Primary path: bulk fetch entire project as one ZIP
      try {
        const raw = await client.getProjectYamls(projectId);
        const decoded = decodeProjectYamlResponse(raw);
        const syncedFiles = await cacheWriteBulk(projectId, decoded);

        const meta: CacheMeta = {
          lastSyncedAt: new Date().toISOString(),
          fileCount: syncedFiles,
          syncMethod: "bulk",
        };
        await cacheWriteMeta(projectId, meta);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  status: "synced",
                  syncedFiles,
                  failed: 0,
                  method: "bulk",
                  cachedAt: meta.lastSyncedAt,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        // Bulk fetch failed — log and fall through to batched approach
        console.error(
          `[sync_project] Bulk fetch failed, falling back to batched:`,
          err instanceof Error ? err.message : err
        );
      }

      // Fallback path: list all file keys, then batch-fetch 5 at a time
      const fileNamesRaw = await client.listPartitionedFileNames(projectId);
      const allKeys = extractTopLevelFileKeys(fileNamesRaw);

      if (allKeys.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  status: "error",
                  message:
                    "No file keys returned by listPartitionedFileNames. " +
                    "Check the projectId.",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      let syncedFiles = 0;
      let failed = 0;

      const results = await batchProcess(allKeys, 5, (fileKey) =>
        fetchOneFile(client, projectId, fileKey)
      );

      for (let i = 0; i < allKeys.length; i++) {
        const result = results[i];
        if (result.status === "fulfilled" && result.value) {
          await cacheWrite(projectId, allKeys[i], result.value.content);
          syncedFiles++;
        } else {
          failed++;
        }
      }

      const meta: CacheMeta = {
        lastSyncedAt: new Date().toISOString(),
        fileCount: syncedFiles,
        syncMethod: "batched",
      };
      await cacheWriteMeta(projectId, meta);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                status: "synced",
                syncedFiles,
                failed,
                method: "batched",
                cachedAt: meta.lastSyncedAt,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}

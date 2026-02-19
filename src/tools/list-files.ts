import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FlutterFlowClient } from "../api/flutterflow.js";
import { listCachedKeys, cacheMeta, cacheAgeFooter } from "../utils/cache.js";

export function registerListFilesTool(
  server: McpServer,
  client: FlutterFlowClient
) {
  server.tool(
    "list_project_files",
    "List all YAML file names in a FlutterFlow project. Supports optional prefix filter (e.g. 'page/', 'component/') to narrow results.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      prefix: z.string().optional().describe("Optional prefix to filter file keys (e.g. 'page/', 'custom-file/')"),
    },
    async ({ projectId, prefix }) => {
      // If cache exists, return file keys from cache
      const meta = await cacheMeta(projectId);
      if (meta) {
        const keys = prefix
          ? await listCachedKeys(projectId, prefix)
          : await listCachedKeys(projectId);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { value: { file_names: keys }, source: "cache", syncedAt: meta.lastSyncedAt },
                null,
                2
              ) + cacheAgeFooter(meta),
            },
          ],
        };
      }

      const result = await client.listPartitionedFileNames(projectId);

      // Apply client-side prefix filter when falling back to API
      if (prefix) {
        const apiResult = result as { value?: { file_names?: string[] } };
        const allKeys = apiResult?.value?.file_names;
        if (Array.isArray(allKeys)) {
          const filtered = allKeys.filter((k) => k.startsWith(prefix));
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  { value: { file_names: filtered } },
                  null,
                  2
                ),
              },
            ],
          };
        }
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
  );
}

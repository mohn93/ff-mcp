import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FlutterFlowClient } from "../api/flutterflow.js";
import { listCachedKeys, cacheMeta } from "../utils/cache.js";

export function registerListFilesTool(
  server: McpServer,
  client: FlutterFlowClient
) {
  server.tool(
    "list_project_files",
    "List all YAML file names in a FlutterFlow project",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
    },
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
  );
}

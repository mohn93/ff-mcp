import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cacheRead, listCachedKeys } from "../utils/cache.js";

export function registerGetYamlTool(server: McpServer) {
  server.tool(
    "get_project_yaml",
    "Read YAML files from the local project cache. Requires sync_project to be run first. Returns one file if fileName is specified, or lists all cached file keys if omitted.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      fileName: z
        .string()
        .optional()
        .describe(
          "Specific YAML file name to read (e.g. 'app-details', 'page/id-xxx'). Omit to list all cached file keys."
        ),
    },
    async ({ projectId, fileName }) => {
      if (fileName) {
        const cached = await cacheRead(projectId, fileName);
        if (cached) {
          return {
            content: [
              {
                type: "text" as const,
                text: `# ${fileName}\n${cached}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `File "${fileName}" not found in local cache for project "${projectId}". Run sync_project(projectId: "${projectId}") first to download all YAML files, then retry.`,
            },
          ],
        };
      }

      // No fileName: list all cached keys
      const keys = await listCachedKeys(projectId);
      if (keys.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No cached files found for project "${projectId}". Run sync_project(projectId: "${projectId}") first to download all YAML files.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `# Cached files (${keys.length})\n${keys.join("\n")}`,
          },
        ],
      };
    }
  );
}

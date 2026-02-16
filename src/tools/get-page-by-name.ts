import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FlutterFlowClient } from "../api/flutterflow.js";
import { decodeProjectYamlResponse } from "../utils/decode-yaml.js";
import { parseFolderMapping } from "../utils/parse-folders.js";
import { extractPageFileKeys, fetchOneFile } from "./list-pages.js";

export function registerGetPageByNameTool(
  server: McpServer,
  client: FlutterFlowClient
) {
  server.tool(
    "get_page_by_name",
    "Fetch a FlutterFlow page by its human-readable name (e.g. 'Welcome', 'GoldPass'). Resolves the name to the correct scaffold ID and returns the full page YAML. Case-insensitive matching.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      pageName: z
        .string()
        .describe(
          "The human-readable page name (e.g. 'Welcome', 'GoldPass'). Case-insensitive."
        ),
    },
    async ({ projectId, pageName }) => {
      // Step 1: Get file list and folders (2 API calls)
      const [fileNamesRaw, foldersResult] = await Promise.all([
        client.listPartitionedFileNames(projectId),
        fetchOneFile(client, projectId, "folders"),
      ]);

      const pageFileKeys = extractPageFileKeys(fileNamesRaw);
      const folderMap = foldersResult
        ? parseFolderMapping(foldersResult.content)
        : {};

      // Step 2: Search pages sequentially until we find the name match
      const searchName = pageName.toLowerCase();
      const available: string[] = [];

      for (const fileKey of pageFileKeys) {
        const result = await fetchOneFile(client, projectId, fileKey);
        if (!result) continue;

        const nameMatch = result.content.match(/^name:\s*(.+)$/m);
        const name = nameMatch ? nameMatch[1].trim() : "";

        if (name.toLowerCase() === searchName) {
          const scaffoldMatch = fileKey.match(
            /^page\/id-(Scaffold_\w+)$/
          );
          const scaffoldId = scaffoldMatch
            ? scaffoldMatch[1]
            : fileKey;
          const folder = folderMap[scaffoldId] || "(unmapped)";
          return {
            content: [
              {
                type: "text" as const,
                text: `# ${name} (${scaffoldId}) — folder: ${folder}\n# File key: ${fileKey}\n${result.content}`,
              },
            ],
          };
        }

        if (name) available.push(name);
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Page "${pageName}" not found. Available pages:\n${available.map((n) => `  - ${n}`).join("\n")}`,
          },
        ],
      };
    }
  );
}

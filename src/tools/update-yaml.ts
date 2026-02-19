import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FlutterFlowClient } from "../api/flutterflow.js";
import { cacheWrite } from "../utils/cache.js";

export function registerUpdateYamlTool(
  server: McpServer,
  client: FlutterFlowClient
) {
  server.tool(
    "update_project_yaml",
    "Push YAML changes to a FlutterFlow project. IMPORTANT: Always call validate_yaml first to check for errors before updating. For best results, call get_editing_guide before writing YAML to get the correct workflow and schema documentation.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      fileKeyToContent: z
        .record(z.string(), z.string())
        .describe(
          "Map of file keys to YAML content. Pass each value as a normal multi-line YAML string."
        ),
    },
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
  );
}

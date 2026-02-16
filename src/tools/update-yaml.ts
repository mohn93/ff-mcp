import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FlutterFlowClient } from "../api/flutterflow.js";

export function registerUpdateYamlTool(
  server: McpServer,
  client: FlutterFlowClient
) {
  server.tool(
    "update_project_yaml",
    "Push YAML changes to a FlutterFlow project. IMPORTANT: Always call validate_yaml first to check for errors before updating.",
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

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FlutterFlowClient } from "../api/flutterflow.js";

export function registerValidateYamlTool(
  server: McpServer,
  client: FlutterFlowClient
) {
  server.tool(
    "validate_yaml",
    "Validate YAML content before pushing changes to a FlutterFlow project. Always call this before update_project_yaml.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      fileKey: z
        .string()
        .describe("The YAML file key (e.g. 'app-details', 'page/id-xxx')"),
      fileContent: z
        .string()
        .describe(
          "The YAML content to validate. Must be a single-line string with escaped newlines (\\n)."
        ),
    },
    async ({ projectId, fileKey, fileContent }) => {
      const result = await client.validateProjectYaml(
        projectId,
        fileKey,
        fileContent
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

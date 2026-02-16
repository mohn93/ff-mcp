import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FlutterFlowClient } from "../api/flutterflow.js";

export function registerGetYamlTool(
  server: McpServer,
  client: FlutterFlowClient
) {
  server.tool(
    "get_project_yaml",
    "Download YAML files from a FlutterFlow project. Returns one file if fileName is specified, otherwise returns all files.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      fileName: z
        .string()
        .optional()
        .describe(
          "Specific YAML file name to download (e.g. 'app-details', 'page/id-xxx'). Omit to get all files."
        ),
    },
    async ({ projectId, fileName }) => {
      const result = await client.getProjectYamls(projectId, fileName);
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

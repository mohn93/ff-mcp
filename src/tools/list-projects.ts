import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FlutterFlowClient } from "../api/flutterflow.js";

export function registerListProjectsTool(
  server: McpServer,
  client: FlutterFlowClient
) {
  server.tool(
    "list_projects",
    "List all FlutterFlow projects for the authenticated user",
    {
      project_type: z
        .string()
        .optional()
        .describe("Optional filter for project type"),
    },
    async ({ project_type }) => {
      const result = await client.listProjects(project_type);
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

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FlutterFlowClient } from "../api/flutterflow.js";

export function registerListProjectsTool(
  server: McpServer,
  client: FlutterFlowClient
) {
  server.tool(
    "list_projects",
    "List FlutterFlow projects for the authenticated user. NOTE: This may not return all projects you have access to (shared/team projects can be missing). If a project is missing, copy its ID directly from the FlutterFlow editor (click the project name in the top-left corner).",
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
          {
            type: "text" as const,
            text: "\n---\n**Tip:** This list may not include all projects you have access to (shared/team projects can be missing). If you don't see a project here, copy its ID directly from the FlutterFlow editor: click the project name (top-left corner) and copy the project ID.",
          },
        ],
      };
    }
  );
}

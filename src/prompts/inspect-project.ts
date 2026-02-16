import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerInspectProjectPrompt(server: McpServer) {
  server.prompt(
    "inspect-project",
    "Read and summarize a FlutterFlow project's structure, pages, and components",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
    },
    ({ projectId }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are an expert FlutterFlow developer. Inspect and summarize the FlutterFlow project.

## Instructions

1. Use list_project_files with projectId "${projectId}" to get all files.
2. Use get_project_yaml to read key files like "app-details", "folders", and "authentication".
3. Read a sample of page and component files to understand the app structure.
4. Provide a clear summary including:
   - App name and details
   - Number of pages and their names
   - Number of components and their names
   - Data models / collections
   - Authentication setup
   - Any custom code files
   - Overall architecture observations`,
          },
        },
      ],
    })
  );
}

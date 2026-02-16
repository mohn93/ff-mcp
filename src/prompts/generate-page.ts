import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerGeneratePagePrompt(server: McpServer) {
  server.prompt(
    "generate-page",
    "Generate a new FlutterFlow page from a natural language description",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      description: z
        .string()
        .describe("Natural language description of the page to create"),
    },
    ({ projectId, description }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are an expert FlutterFlow developer. Generate a new page for the FlutterFlow project.

## Instructions

1. First, use the list_project_files tool with projectId "${projectId}" to understand the existing project structure.
2. Then, use get_project_yaml to read a few existing pages to understand the YAML schema and conventions used in this project.
3. Based on the following description, generate valid FlutterFlow YAML for a new page:

**Page Description:** ${description}

4. Use validate_yaml to check your generated YAML is valid.
5. If validation passes, use update_project_yaml to push the new page to the project.
6. If validation fails, fix the errors and try again.

## Important
- Follow the exact YAML structure you observed in existing pages.
- Use consistent naming conventions matching the project.
- YAML content must be single-line strings with escaped newlines (\\n).`,
          },
        },
      ],
    })
  );
}

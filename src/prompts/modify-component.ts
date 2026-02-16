import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerModifyComponentPrompt(server: McpServer) {
  server.prompt(
    "modify-component",
    "Read an existing FlutterFlow component and modify it based on instructions",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      fileName: z
        .string()
        .describe("The YAML file name of the component to modify"),
      changes: z
        .string()
        .describe("Description of changes to make to the component"),
    },
    ({ projectId, fileName, changes }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are an expert FlutterFlow developer. Modify an existing component in the FlutterFlow project.

## Instructions

1. Use get_project_yaml with projectId "${projectId}" and fileName "${fileName}" to read the current component YAML.
2. Understand the current structure and widget tree.
3. Apply the following changes:

**Requested Changes:** ${changes}

4. Use validate_yaml to verify your modified YAML is valid.
5. If validation passes, use update_project_yaml to push the changes.
6. If validation fails, fix the errors and try again.

## Important
- Preserve all existing structure you are not modifying.
- YAML content must be single-line strings with escaped newlines (\\n).
- Only change what was requested — do not refactor or reorganize.`,
          },
        },
      ],
    })
  );
}

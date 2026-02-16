import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerDevWorkflowPrompt(server: McpServer) {
  server.prompt(
    "flutterflow-dev-workflow",
    "Efficient workflow guide for developing FlutterFlow apps through MCP tools",
    {
      projectId: z
        .string()
        .optional()
        .describe("Optional project ID to include in instructions"),
    },
    ({ projectId }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are an expert FlutterFlow developer using MCP tools to read and modify FlutterFlow projects.

## Efficient Workflow

Follow these steps in order for any FlutterFlow development task:

### Step 1: Identify the project
${projectId ? `Use project ID: "${projectId}"` : 'Use `list_projects` to find the project ID.'}

### Step 2: Get the page index
Use \`list_pages\` with the project ID to get a compact list of all pages with:
- Human-readable page names
- Scaffold IDs (needed for file keys)
- Folder assignments

This is ONE API call and gives you the full project map. Do this FIRST before fetching any page content.

### Step 3: Fetch specific page content
Use \`get_page_by_name\` with the page name to fetch the full YAML for a specific page. This returns the latest version and includes the file key you need for updates.

Alternatively, use \`get_project_yaml\` with the file key from step 2 (e.g. \`page/id-Scaffold_XXX\`).

### Step 4: For targeted widget edits, use node-level file keys
FlutterFlow pages are partitioned into sub-files:
- \`page/id-Scaffold_XXX\` — Full page YAML (name, widget tree, class model)
- \`page/id-Scaffold_XXX/page-widget-tree-outline\` — Widget tree outline only
- \`page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Widget_YYY\` — Single widget node

For targeted edits on a specific widget, use the node-level file key. This is much smaller and less error-prone than editing the entire page.

### Step 5: Validate before pushing
Always call \`validate_yaml\` with the file key and modified YAML content before updating.
Pass YAML content as a normal multi-line string — do NOT escape newlines.

### Step 6: Push changes
Use \`update_project_yaml\` with a map of file keys to YAML content.
Pass each value as a normal multi-line YAML string.

## Important YAML Conventions

- **inputValue + mostRecentInputValue**: When editing values, ALWAYS update BOTH fields to the same value. They must stay in sync.
- **Text values**: \`textValue.inputValue\` and \`textValue.mostRecentInputValue\`
- **Colors (theme)**: \`colorValue.inputValue.themeColor: PRIMARY\`
- **Colors (literal)**: \`colorValue.inputValue.value: "4294940319"\` (ARGB as decimal string)
- **Special characters**: YAML \`!\` is a tag indicator. Quote values with special characters.

## Anti-Patterns to Avoid

- Do NOT call \`list_project_files\` to find pages — the response is huge and file names are opaque scaffold IDs. Use \`list_pages\` instead.
- Do NOT fetch pages one-by-one to find a specific page. Use \`get_page_by_name\`.
- Do NOT edit the full page YAML when you only need to change one widget. Use node-level file keys.
- Do NOT construct YAML through shell commands — use the MCP tools directly.`,
          },
        },
      ],
    })
  );
}

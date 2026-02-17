import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerDevWorkflowPrompt(server: McpServer) {
  server.prompt(
    "flutterflow-dev-workflow",
    "Efficient workflow guide for developing FlutterFlow apps through MCP tools. References the full YAML docs catalog via get_yaml_docs tool.",
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

## Documentation

This MCP server includes a comprehensive FlutterFlow YAML reference catalog. Use the \`get_yaml_docs\` tool to look up any schema, pattern, or convention:

- \`get_yaml_docs(topic: "Button")\` — Widget schemas (Button, Text, TextField, Container, etc.)
- \`get_yaml_docs(topic: "actions")\` — Action chains, triggers, navigation
- \`get_yaml_docs(topic: "variables")\` — Data binding, variable sources
- \`get_yaml_docs(topic: "theming")\` — Colors, typography, dimensions
- \`get_yaml_docs(topic: "editing")\` — Read/edit/add workflows and anti-patterns
- \`get_yaml_docs()\` — Full index of all available docs

Always consult the docs before writing YAML. They contain validated schemas, field references, enum values, and real examples from production projects.

## Efficient Workflow

${projectId ? `**Project ID:** \`${projectId}\`\n` : ""}
### Reading / Inspecting
\`\`\`
list_projects → sync_project → get_page_summary / get_component_summary
\`\`\`

### Editing Existing Widgets
\`\`\`
list_pages → get_page_by_name → (node-level fetch) → validate_yaml → update_project_yaml
\`\`\`

### Adding New Widgets
\`\`\`
list_pages → get_page_by_name → update widget-tree-outline + push individual node files → validate_yaml → update_project_yaml
\`\`\`

## Critical YAML Rules

1. **Always update both \`inputValue\` AND \`mostRecentInputValue\`** — they must stay in sync.
   - **Exceptions:** \`fontWeightValue\` and \`fontSizeValue\` only accept \`inputValue\`.
2. **Use node-level file keys** for targeted edits, not the full page YAML.
3. **Always validate before pushing** — call \`validate_yaml\` first.
4. **Adding widgets requires node-level files** — push the tree outline + individual nodes together.
5. **Column has no \`mainAxisSize\`** — use \`minSizeValue: { inputValue: true }\` instead.
6. **AppBar \`templateType\`** — only \`LARGE_HEADER\` is valid. Control height via \`toolbarHeight\`.
7. **TextField keyboard types** — use \`EMAIL_ADDRESS\`, not \`EMAIL\`.

## Anti-Patterns

- Do NOT call \`list_project_files\` to find pages — use \`list_pages\` instead.
- Do NOT fetch pages one-by-one — use \`get_page_by_name\`.
- Do NOT edit full page YAML for a single widget — use node-level file keys.
- Do NOT guess YAML field names — use \`get_yaml_docs\` to look them up.`,
          },
        },
      ],
    })
  );
}

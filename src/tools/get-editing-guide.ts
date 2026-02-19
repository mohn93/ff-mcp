/**
 * get_editing_guide tool — returns workflow steps, relevant YAML docs,
 * and universal rules for a given FlutterFlow editing task.
 * No API calls: reads from bundled docs/ff-yaml/ directory.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TOPIC_MAP, readDoc } from "../utils/topic-map.js";

// ---------------------------------------------------------------------------
// Keyword sets for edit-type detection
// ---------------------------------------------------------------------------

const ADD_WIDGET_KEYWORDS = ["add", "new", "insert", "append", "place", "put"];
const COMPONENT_KEYWORDS = [
  "component",
  "reusable",
  "refactor",
  "extract",
];
const EDIT_KEYWORDS = [
  "change",
  "modify",
  "update",
  "edit",
  "fix",
  "set",
  "remove",
  "delete",
  "hide",
  "show",
  "toggle",
  "enable",
  "disable",
  "move",
  "replace",
  "rename",
  "resize",
  "restyle",
];
const CONFIG_KEYWORDS = [
  "configure",
  "settings",
  "config",
  "theme",
  "auth",
  "permission",
  "navigation",
  "nav",
  "environment",
];

// ---------------------------------------------------------------------------
// Edit types
// ---------------------------------------------------------------------------

type EditType = "edit-existing" | "add-widget" | "create-component" | "configure-project";

function detectEditType(words: string[]): EditType {
  const hasComponent = words.some((w) => COMPONENT_KEYWORDS.includes(w));
  const hasAdd = words.some((w) => ADD_WIDGET_KEYWORDS.includes(w));
  const hasConfig = words.some((w) => CONFIG_KEYWORDS.includes(w));

  // Priority 1: component + (add/create/refactor)
  if (
    hasComponent &&
    (hasAdd || words.includes("create") || words.includes("refactor"))
  ) {
    return "create-component";
  }

  // Priority 2: config keywords
  if (hasConfig) {
    return "configure-project";
  }

  // Priority 3: add widget keywords
  if (hasAdd) {
    return "add-widget";
  }

  // Default
  return "edit-existing";
}

// ---------------------------------------------------------------------------
// Workflow templates
// ---------------------------------------------------------------------------

function getWorkflow(editType: EditType, projectId?: string): string {
  const pid = projectId ?? "projectId";

  switch (editType) {
    case "edit-existing":
      return `## Workflow: Editing Existing Widgets

1. \`list_pages(${pid})\` — find the page
2. \`get_page_by_name(${pid}, "PageName")\` — read the page, find the widget key
3. \`get_project_yaml(${pid}, "page/id-Scaffold_XXX/.../node/id-Widget_YYY")\` — fetch node-level YAML
4. Modify the YAML (keep both \`inputValue\` and \`mostRecentInputValue\` in sync)
5. \`validate_yaml(${pid}, fileKey, yaml)\` — validate before pushing
6. \`update_project_yaml(${pid}, { fileKey: yaml })\` — push changes`;

    case "add-widget":
      return `## Workflow: Adding New Widgets

1. \`list_pages(${pid})\` — find the page
2. \`get_page_by_name(${pid}, "PageName")\` — read the page structure
3. Construct three types of files:
   - Widget tree outline (\`page/id-Scaffold_XXX/page-widget-tree-outline\`)
   - Parent node file (Column, Row, etc.)
   - Individual child node files for each new widget
4. \`validate_yaml\` for each file
5. \`update_project_yaml(${pid}, { ...allFiles })\` — push ALL files in one call`;

    case "create-component":
      return `## Workflow: Creating/Refactoring Components

1. Read the existing page/component with \`get_page_by_name\` or \`get_component_summary\`
2. Construct component files:
   - Component metadata (\`component/id-Container_XXX\`)
   - Widget tree outline (\`component/id-Container_XXX/component-widget-tree-outline\`)
   - Root Container node with \`isDummyRoot: true\`
   - Individual child node files
3. If refactoring: update the source page to reference the component via \`componentClassKeyRef\`
4. \`validate_yaml\` for each file
5. \`update_project_yaml(${pid}, { ...allFiles })\` — push ALL files in one call
6. See \`get_yaml_docs(topic: "component")\` for full schema details`;

    case "configure-project":
      return `## Workflow: Configuring Project Settings

1. \`sync_project(${pid})\` — sync the project cache
2. Use cache tools to read current config:
   - \`get_project_config\` — app details, auth, nav bar, permissions
   - \`get_theme\` — colors, typography, breakpoints
   - \`get_app_state\` — state variables, constants, environment
3. \`get_project_yaml(${pid}, "fileName")\` — fetch the specific config file
4. Modify the YAML
5. \`validate_yaml\` then \`update_project_yaml\``;
  }
}

// ---------------------------------------------------------------------------
// Universal rules
// ---------------------------------------------------------------------------

const UNIVERSAL_RULES = `## Critical YAML Rules

- **Always update both \`inputValue\` AND \`mostRecentInputValue\`** to the same value — they must stay in sync.
  - **Exceptions:** \`fontWeightValue\` and \`fontSizeValue\` only accept \`inputValue\` (no \`mostRecentInputValue\`).
- **Use node-level file keys** for targeted edits, not the full page YAML.
- **Always validate before pushing** — call \`validate_yaml\` before \`update_project_yaml\`.
- **Adding widgets requires node-level files** — push the tree outline + individual nodes together.
- **Do NOT guess YAML field names** — use \`get_yaml_docs(topic: "...")\` to look them up.`;

// ---------------------------------------------------------------------------
// Doc resolution
// ---------------------------------------------------------------------------

function resolveDocFiles(words: string[]): string[] {
  const seen = new Set<string>();
  const files: string[] = [];

  for (const word of words) {
    // Normalize: lowercase, strip dashes/underscores
    const key = word.toLowerCase().replace(/[\s_-]+/g, "");
    const docFile = TOPIC_MAP[key];
    if (docFile && !seen.has(docFile)) {
      seen.add(docFile);
      files.push(docFile);
    }
  }

  return files;
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerGetEditingGuideTool(server: McpServer) {
  server.tool(
    "get_editing_guide",
    "Get the recommended workflow and relevant documentation for a FlutterFlow editing task. Call this BEFORE modifying any YAML. Describe what you want to do (e.g. 'change button color', 'add a TextField to the login page', 'create a reusable header component') and receive the correct workflow steps, YAML schemas, and critical rules.",
    {
      task: z
        .string()
        .describe("Natural language description of what you want to do"),
      projectId: z
        .string()
        .optional()
        .describe("Optional project ID to include in workflow steps"),
    },
    async ({ task, projectId }) => {
      // Tokenize into lowercase words
      const words = task.toLowerCase().split(/\s+/);

      // Detect edit type
      const editType = detectEditType(words);

      // Build workflow section
      const workflow = getWorkflow(editType, projectId);

      // Resolve matching doc files
      const docFiles = resolveDocFiles(words);

      // Read matched docs
      const docSections: string[] = [];
      for (const file of docFiles) {
        const content = readDoc(file);
        if (content) {
          docSections.push(`---\n\n# Reference: ${file}\n\n${content}`);
        }
      }

      // Assemble response
      const parts: string[] = [workflow, "", UNIVERSAL_RULES, ""];

      if (docSections.length > 0) {
        parts.push(...docSections);
      } else {
        parts.push(
          'No specific widget/topic docs matched your task. Use `get_yaml_docs(topic: "...")` to search for relevant schemas, or `get_yaml_docs()` for the full index.'
        );
      }

      return {
        content: [{ type: "text" as const, text: parts.join("\n") }],
      };
    }
  );
}

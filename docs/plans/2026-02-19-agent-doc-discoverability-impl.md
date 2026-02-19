# Agent Doc Discoverability Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make AI agents discover and use YAML documentation before editing FlutterFlow projects, via a new `get_editing_guide` tool, updated tool descriptions, and validation response hints.

**Architecture:** New `get_editing_guide` tool reuses the existing `TOPIC_MAP` from `get-yaml-docs.ts` and the bundled `docs/ff-yaml/` files. Keyword extraction from the task description resolves relevant docs. Edit-type detection selects the right workflow from `10-editing-guide.md`. Updated descriptions on `validate_yaml` and `update_project_yaml` nudge agents to call the guide first. Validation failures include doc hints derived from the `fileKey`.

**Tech Stack:** TypeScript, vitest, MCP SDK (`server.tool()`)

---

### Task 1: Extract shared TOPIC_MAP to a utility

The `get_editing_guide` tool needs the same topic→file mapping as `get_yaml_docs`. Extract it to a shared module to avoid duplication.

**Files:**
- Create: `src/utils/topic-map.ts`
- Modify: `src/tools/get-yaml-docs.ts`

**Step 1: Create the shared topic-map module**

Create `src/utils/topic-map.ts` with the TOPIC_MAP constant and the `listDocFiles`/`readDoc` helper functions extracted from `get-yaml-docs.ts`:

```typescript
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DOCS_DIR = path.resolve(__dirname, "../../docs/ff-yaml");

/** Topic-to-file mapping for fuzzy search. */
export const TOPIC_MAP: Record<string, string> = {
  // (copy the full TOPIC_MAP from get-yaml-docs.ts)
};

/** List all doc files recursively. */
export function listDocFiles(dir: string, prefix = ""): string[] {
  // (copy from get-yaml-docs.ts)
}

/** Read a doc file. Returns null if not found. */
export function readDoc(relPath: string): string | null {
  const filePath = path.join(DOCS_DIR, relPath);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}
```

**Step 2: Update `get-yaml-docs.ts` to import from the shared module**

Replace the local TOPIC_MAP, DOCS_DIR, listDocFiles, and readDoc in `src/tools/get-yaml-docs.ts` with imports from `../utils/topic-map.js`.

**Step 3: Run tests to verify nothing broke**

Run: `npm test`
Expected: All existing tests pass — `get_yaml_docs` behavior is unchanged.

**Step 4: Commit**

```bash
git add src/utils/topic-map.ts src/tools/get-yaml-docs.ts
git commit -m "refactor: extract TOPIC_MAP and doc helpers to shared utils/topic-map"
```

---

### Task 2: Create `get_editing_guide` tool with tests

**Files:**
- Create: `src/tools/get-editing-guide.ts`
- Create: `src/tools/get-editing-guide.test.ts`

**Step 1: Write the test file**

Create `src/tools/get-editing-guide.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { createMockServer } from "../__helpers__/mock-server.js";
import { registerGetEditingGuideTool } from "./get-editing-guide.js";

describe("get_editing_guide tool", () => {
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    const mock = createMockServer();
    registerGetEditingGuideTool(mock.server as any);
    getHandler = mock.getHandler;
  });

  it("registers with the correct tool name", () => {
    expect(() => getHandler("get_editing_guide")).not.toThrow();
  });

  it("returns edit-existing workflow for 'change button color'", async () => {
    const handler = getHandler("get_editing_guide");
    const result = await handler({ task: "change button color" });
    const text = result.content[0].text;

    expect(text).toContain("Editing Existing Widgets");
    expect(text).toContain("button");           // relevant widget doc
    expect(text).toContain("inputValue");       // universal rules
  });

  it("returns add-widget workflow for 'add a TextField'", async () => {
    const handler = getHandler("get_editing_guide");
    const result = await handler({ task: "add a TextField to the login page" });
    const text = result.content[0].text;

    expect(text).toContain("Adding New Widgets");
    expect(text).toContain("text-field");       // relevant doc matched
  });

  it("returns create-component workflow for 'create a reusable header'", async () => {
    const handler = getHandler("get_editing_guide");
    const result = await handler({ task: "create a reusable header component" });
    const text = result.content[0].text;

    expect(text).toContain("Creating");
    expect(text).toContain("component");
  });

  it("includes projectId in workflow steps when provided", async () => {
    const handler = getHandler("get_editing_guide");
    const result = await handler({ task: "change text color", projectId: "proj-123" });
    const text = result.content[0].text;

    expect(text).toContain("proj-123");
  });

  it("returns general guide when no keywords match", async () => {
    const handler = getHandler("get_editing_guide");
    const result = await handler({ task: "do something with the project" });
    const text = result.content[0].text;

    // Should still return universal rules and general workflow
    expect(text).toContain("inputValue");
    expect(text).toContain("validate_yaml");
  });

  it("matches multiple widget topics from a single task", async () => {
    const handler = getHandler("get_editing_guide");
    const result = await handler({ task: "add a Button and TextField to the form" });
    const text = result.content[0].text;

    // Should reference both widget docs
    expect(text).toContain("button");
    expect(text).toContain("text-field");
  });
});
```

**Step 2: Run the test to verify it fails**

Run: `npm test -- src/tools/get-editing-guide.test.ts`
Expected: FAIL — module not found.

**Step 3: Create the implementation**

Create `src/tools/get-editing-guide.ts`. The tool:

1. Tokenizes the `task` string into lowercase words
2. Matches tokens against `TOPIC_MAP` keys to find relevant doc files (deduped)
3. Detects edit type from keywords:
   - "add", "new", "create" + "component" → create-component
   - "add", "new", "insert" → add-widget
   - "change", "modify", "update", "edit", "fix", "set", "remove", "delete", "hide", "show", "toggle", "enable", "disable" → edit-existing
   - "configure", "settings", "config", "theme", "auth" → configure-project
   - default → edit-existing
4. Reads the relevant sections from `10-editing-guide.md` based on edit type
5. Reads each matched doc file
6. Assembles response: workflow section + universal rules + relevant docs

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TOPIC_MAP, DOCS_DIR, readDoc } from "../utils/topic-map.js";

// Edit-type keyword sets
const ADD_WIDGET_KEYWORDS = ["add", "new", "insert", "append", "place", "put"];
const COMPONENT_KEYWORDS = ["component", "reusable", "refactor", "extract"];
const EDIT_KEYWORDS = ["change", "modify", "update", "edit", "fix", "set", "remove", "delete", "hide", "show", "toggle", "enable", "disable", "move", "replace", "rename", "resize", "restyle"];
const CONFIG_KEYWORDS = ["configure", "settings", "config", "theme", "auth", "permission", "navigation", "nav", "environment"];

type EditType = "edit-existing" | "add-widget" | "create-component" | "configure-project";

function detectEditType(words: string[]): EditType {
  const hasComponent = words.some(w => COMPONENT_KEYWORDS.includes(w));
  const hasAdd = words.some(w => ADD_WIDGET_KEYWORDS.includes(w));
  const hasConfig = words.some(w => CONFIG_KEYWORDS.includes(w));

  if (hasComponent && (hasAdd || words.includes("create") || words.includes("refactor"))) return "create-component";
  if (hasConfig) return "configure-project";
  if (hasAdd) return "add-widget";
  return "edit-existing";
}

function findRelevantDocs(words: string[]): string[] {
  const matched = new Set<string>();
  for (const word of words) {
    const key = word.replace(/[\s_-]+/g, "");
    if (TOPIC_MAP[key]) matched.add(TOPIC_MAP[key]);
  }
  return [...matched];
}

// Workflow templates per edit type (referencing tool calls with optional projectId)
function getWorkflow(editType: EditType, projectId?: string): string { ... }

export function registerGetEditingGuideTool(server: McpServer) {
  server.tool(
    "get_editing_guide",
    "Get the recommended workflow and relevant documentation for a FlutterFlow editing task. Call this BEFORE modifying any YAML. Describe what you want to do (e.g. 'change button color', 'add a TextField to the login page', 'create a reusable header component') and receive the correct workflow steps, YAML schemas, and critical rules.",
    {
      task: z.string().describe("Natural language description of what you want to do (e.g. 'change button text', 'add an image widget', 'create a card component')"),
      projectId: z.string().optional().describe("Optional project ID to include in workflow steps"),
    },
    async ({ task, projectId }) => {
      const words = task.toLowerCase().split(/\W+/).filter(Boolean);
      const editType = detectEditType(words);
      const relevantDocFiles = findRelevantDocs(words);

      // Build response sections
      const sections: string[] = [];

      // 1. Workflow steps
      sections.push(getWorkflow(editType, projectId));

      // 2. Universal rules (always included)
      sections.push(UNIVERSAL_RULES);

      // 3. Relevant widget/topic docs
      for (const docFile of relevantDocFiles) {
        const content = readDoc(docFile);
        if (content) {
          sections.push(`---\n\n# Reference: ${docFile}\n\n${content}`);
        }
      }

      // 4. If no docs matched, suggest get_yaml_docs
      if (relevantDocFiles.length === 0) {
        sections.push("\n---\n\nNo specific widget/topic docs matched your task. Use `get_yaml_docs(topic: \"...\")` to search for relevant schemas.");
      }

      return {
        content: [{ type: "text" as const, text: sections.join("\n\n") }],
      };
    }
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/tools/get-editing-guide.test.ts`
Expected: All 7 tests PASS.

**Step 5: Commit**

```bash
git add src/tools/get-editing-guide.ts src/tools/get-editing-guide.test.ts
git commit -m "feat: add get_editing_guide tool for agent doc discoverability"
```

---

### Task 3: Update `validate_yaml` description and add response hints

**Files:**
- Modify: `src/tools/validate-yaml.ts`
- Modify: `src/tools/validate-yaml.test.ts`

**Step 1: Write failing tests for the new behavior**

Add to `src/tools/validate-yaml.test.ts`:

```typescript
it("includes doc hint when validation fails with a widget fileKey", async () => {
  const errorResult = { valid: false, errors: ["Unknown field name 'badField'"] };
  mockClient.validateProjectYaml.mockResolvedValue(errorResult);

  const handler = getHandler("validate_yaml");
  const result = await handler({
    projectId: "proj-123",
    fileKey: "page/id-Scaffold_abc/page-widget-tree-outline/node/id-Button_xyz",
    fileContent: "badField: true",
  });

  const text = result.content[0].text;
  expect(text).toContain("get_yaml_docs");
  expect(text).toContain("Button");
});

it("does not include doc hint when validation succeeds", async () => {
  const okResult = { valid: true };
  mockClient.validateProjectYaml.mockResolvedValue(okResult);

  const handler = getHandler("validate_yaml");
  const result = await handler({
    projectId: "proj-123",
    fileKey: "page/id-Scaffold_abc/page-widget-tree-outline/node/id-Button_xyz",
    fileContent: "key: Button_xyz",
  });

  const text = result.content[0].text;
  expect(text).not.toContain("get_yaml_docs");
});
```

**Step 2: Run to verify failure**

Run: `npm test -- src/tools/validate-yaml.test.ts`
Expected: 2 new tests FAIL.

**Step 3: Implement changes in validate-yaml.ts**

Update the description and add response hint logic:

```typescript
server.tool(
  "validate_yaml",
  "Validate YAML content before pushing changes to a FlutterFlow project. Always call this before update_project_yaml. Tip: Call get_editing_guide or get_yaml_docs BEFORE writing YAML to understand the correct schema and field names. Validation catches syntax errors but not semantic mistakes.",
  // ... same params ...
  async ({ projectId, fileKey, fileContent }) => {
    const result = await client.validateProjectYaml(projectId, fileKey, fileContent);

    let text = JSON.stringify(result, null, 2);

    // Add doc hint on validation failure
    const isFailure = result && typeof result === "object" && (result as any).valid === false;
    if (isFailure) {
      const widgetType = extractWidgetTypeFromFileKey(fileKey);
      if (widgetType) {
        text += `\n\nHint: Use get_yaml_docs(topic: "${widgetType}") to look up the correct field schema for ${widgetType} widgets.`;
      } else {
        text += `\n\nHint: Use get_yaml_docs to look up the correct YAML schema for the file you're editing.`;
      }
    }

    return { content: [{ type: "text" as const, text }] };
  }
);
```

Add helper at the top of the file:

```typescript
/** Extract widget type from a node-level fileKey, e.g. "Button" from "node/id-Button_xyz" */
function extractWidgetTypeFromFileKey(fileKey: string): string | null {
  const match = fileKey.match(/node\/id-([A-Z][a-zA-Z]+)_/);
  return match ? match[1] : null;
}
```

**Step 4: Run tests**

Run: `npm test -- src/tools/validate-yaml.test.ts`
Expected: All tests PASS (old + 2 new).

**Step 5: Commit**

```bash
git add src/tools/validate-yaml.ts src/tools/validate-yaml.test.ts
git commit -m "feat: add doc hints to validate_yaml description and failure responses"
```

---

### Task 4: Update `update_project_yaml` description

**Files:**
- Modify: `src/tools/update-yaml.ts`

**Step 1: Update the tool description**

Change the description in `src/tools/update-yaml.ts` from:

```
"Push YAML changes to a FlutterFlow project. IMPORTANT: Always call validate_yaml first to check for errors before updating."
```

To:

```
"Push YAML changes to a FlutterFlow project. IMPORTANT: Always call validate_yaml first to check for errors before updating. For best results, call get_editing_guide before writing YAML to get the correct workflow and schema documentation."
```

**Step 2: Run all tests**

Run: `npm test`
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/tools/update-yaml.ts
git commit -m "feat: update update_project_yaml description to reference get_editing_guide"
```

---

### Task 5: Register tool in index.ts and update CLAUDE.md

**Files:**
- Modify: `src/index.ts`
- Modify: `CLAUDE.md`

**Step 1: Register the tool in index.ts**

Add import and registration call:

```typescript
import { registerGetEditingGuideTool } from "./tools/get-editing-guide.js";
// ... in the registration block:
registerGetEditingGuideTool(server);
```

**Step 2: Update CLAUDE.md tools table**

Add `get_editing_guide` to the tools table in CLAUDE.md:

```
| `get_editing_guide` | `tools/get-editing-guide.ts` | Workflow + doc guide for editing tasks |
```

Update the tool count from 19 to 20.

**Step 3: Build and run full test suite**

Run: `npm run build && npm test`
Expected: Build succeeds, all tests pass.

**Step 4: Commit**

```bash
git add src/index.ts CLAUDE.md
git commit -m "feat: register get_editing_guide tool, update docs"
```

---

### Task 6: Update prompts to reference get_editing_guide

**Files:**
- Modify: `src/prompts/generate-page.ts`
- Modify: `src/prompts/modify-component.ts`

**Step 1: Update generate-page.ts**

Add a step before generating YAML: "Use `get_editing_guide` with a description of the page to get the correct YAML schemas and workflow."

**Step 2: Update modify-component.ts**

Add a step before modifying: "Use `get_editing_guide` with a description of your changes to get the correct YAML schemas."

**Step 3: Build and test**

Run: `npm run build && npm test`
Expected: All pass.

**Step 4: Commit**

```bash
git add src/prompts/generate-page.ts src/prompts/modify-component.ts
git commit -m "feat: update prompts to reference get_editing_guide"
```

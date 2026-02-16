# FlutterFlow MCP Development Guide

> This guide is for AI agents (or developers) using the FlutterFlow MCP server to read and modify FlutterFlow projects. Read this before making any MCP tool calls.

---

## Quick Start: The Golden Workflow

```
list_projects → list_pages → get_page_by_name → (node-level fetch) → validate_yaml → update_project_yaml
```

1. **Find the project** — `list_projects` returns all projects with IDs
2. **Get the page index** — `list_pages(projectId)` returns all pages with human-readable names, scaffold IDs, and folders. Do this FIRST.
3. **Fetch a page by name** — `get_page_by_name(projectId, "Welcome")` resolves the name and returns full YAML
4. **For edits, fetch the specific node** — Use `get_project_yaml` with a node-level file key for targeted edits (see File Keys below)
5. **Validate** — `validate_yaml(projectId, fileKey, yamlContent)` before pushing
6. **Push** — `update_project_yaml(projectId, { fileKey: yamlContent })`

---

## Available Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `list_projects` | List all projects | First step — find the project ID |
| `list_pages` | Get page index (names, scaffold IDs, folders) | **Always use before fetching pages** |
| `get_page_by_name` | Fetch page YAML by human-readable name | When you know the page name |
| `get_project_yaml` | Fetch any YAML file by key | For config files, node-level edits, components |
| `validate_yaml` | Check YAML before pushing | **Always before update** |
| `update_project_yaml` | Push YAML changes | Final step after validation |
| `list_project_files` | List all file keys | Rarely needed — prefer `list_pages` for pages |

---

## File Key System

FlutterFlow projects are split into many YAML files. Understanding file keys is critical.

### Page-Level Keys
```
page/id-Scaffold_XXX                    → Full page YAML (name, entire widget tree, class model)
page/id-Scaffold_XXX/page-widget-tree-outline → Widget tree outline only
page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Widget_YYY → Single widget node
```

### Other Keys
```
folders          → Folder structure and scaffold-to-folder mapping
app-details      → App name, theme, settings
app-assets       → Asset references
authentication   → Auth configuration
collections/id-X → Firestore collections
api-endpoint/id-X → API endpoints
component/id-Container_XXX → Reusable components
```

### Rule: Use Node-Level Keys for Edits

When editing a specific widget (button text, color, padding, etc.), fetch and update the **node-level file**, not the full page:

```
# GOOD — targeted edit on a single button
get_project_yaml(projectId, "page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Button_YYY")

# BAD — fetches entire page, risk of overwriting other changes
get_project_yaml(projectId, "page/id-Scaffold_XXX")
```

To find the widget key, first fetch the full page (via `get_page_by_name`), locate the widget in the tree, note its `key` field (e.g. `Button_7c3kwr61`), then construct the node-level file key.

---

## YAML Conventions (Critical)

### Always Sync inputValue + mostRecentInputValue

Every value in FlutterFlow YAML has two fields. **You MUST update both to the same value.**

```yaml
# CORRECT
textValue:
  inputValue: New Text Here
  mostRecentInputValue: New Text Here

# WRONG — will cause sync issues in FlutterFlow
textValue:
  inputValue: New Text Here
  mostRecentInputValue: Old Text Here
```

### Common Value Patterns

**Text:**
```yaml
textValue:
  inputValue: "Button Label"
  mostRecentInputValue: "Button Label"
```

**Color (theme reference):**
```yaml
colorValue:
  inputValue:
    themeColor: PRIMARY    # PRIMARY, SECONDARY, PRIMARY_BACKGROUND, etc.
  mostRecentInputValue:
    themeColor: PRIMARY
```

**Color (literal ARGB):**
```yaml
colorValue:
  inputValue:
    value: "4294940319"    # ARGB as decimal string
  mostRecentInputValue:
    value: "4294940319"
```

**Dimensions:**
```yaml
dimensions:
  width:
    pixelsValue:
      inputValue: 200
      mostRecentInputValue: 200
  height:
    pixelsValue:
      inputValue: 44
      mostRecentInputValue: 44
```

**Padding:**
```yaml
padding:
  type: FF_PADDING_ONLY    # or FF_PADDING_ALL
  leftValue:
    inputValue: 24
    mostRecentInputValue: 24
  topValue:
    inputValue: 20
    mostRecentInputValue: 20
  rightValue:
    inputValue: 24
    mostRecentInputValue: 24
```

**Border Radius:**
```yaml
borderRadius:
  type: FF_BORDER_RADIUS_ALL
  allValue:
    inputValue: 40
    mostRecentInputValue: 40
```

**Responsive Visibility:**
```yaml
responsiveVisibility:
  phoneHidden: true        # hidden on phone
  tabletHidden: true       # hidden on tablet
  desktopHidden: true      # hidden on desktop
```

### Widget Tree Structure

Pages follow this structure:
```yaml
name: PageName
node:
  key: Scaffold_XXX
  type: Scaffold
  children:
    - key: Column_XXX
      type: Column
      children:
        - key: Widget_XXX
          type: Button/Image/Text/Container/etc.
          props: { ... }
          triggerActions: [ ... ]    # for interactive widgets
  props:
    scaffold:
      safeArea: true
      backgroundColorValue: { ... }
  childPropertyMap:
    body:
      keyRefs:
        - key: Column_XXX
classModel: {}
```

### Trigger Actions (Button Taps, etc.)

```yaml
triggerActions:
  - rootAction:
      key: action_key
      action:
        key: inner_key
        navigate:                    # Navigation action
          pageNodeKeyRef:
            key: Scaffold_TARGET
          allowBack: false
      followUpAction:               # Chain of sequential actions
        key: next_key
        action:
          key: inner_key2
          requestPermissions:
            permissionType: LOCATION
    trigger:
      triggerType: ON_TAP           # ON_TAP, ON_LONG_PRESS, etc.
```

---

## Anti-Patterns (Do NOT Do These)

| Anti-Pattern | What to Do Instead |
|---|---|
| Call `list_project_files` to find pages | Use `list_pages` — returns names and scaffold IDs directly |
| Fetch pages one-by-one looking for a name | Use `get_page_by_name("PageName")` |
| Edit the full page YAML for a single widget change | Fetch and edit the node-level file key |
| Push without validating | Always `validate_yaml` first |
| Update only `inputValue` | Always update both `inputValue` AND `mostRecentInputValue` |
| Construct YAML via shell/bash commands | Use MCP tools directly — they handle serialization correctly |
| Fetch all YAML without a fileName | This downloads everything and may hit buffer limits — always specify a fileName |

---

## Known Limitations

### Buffer Errors on Large Pages
Some very large pages will fail with `Cannot create a Buffer larger than X bytes`. When this happens:
- The page is too large to fetch as a whole
- Use node-level sub-files instead (fetch individual widgets)
- `list_pages` will show these as `(error - could not fetch)` but still reports their scaffold ID and folder

### MCP Response Size Limits
Very large YAML responses may exceed MCP transport token limits. Mitigations:
- Prefer node-level file keys for reads and writes
- Use `list_pages` for discovery instead of fetching full pages

---

## Edit Workflow Example

**Task:** Change a button label from "Old Text" to "New Text" on the Welcome page.

```
Step 1: list_pages(projectId)
        → Find Welcome page: scaffoldId = Scaffold_7o6kzmdm

Step 2: get_page_by_name(projectId, "Welcome")
        → Read full page YAML, find the button widget
        → Button key: Button_7c3kwr61

Step 3: get_project_yaml(projectId,
          "page/id-Scaffold_7o6kzmdm/page-widget-tree-outline/node/id-Button_7c3kwr61")
        → Get fresh node-level YAML for just the button

Step 4: Modify the YAML — change textValue.inputValue AND textValue.mostRecentInputValue

Step 5: validate_yaml(projectId, fileKey, modifiedYaml)
        → Confirm { success: true }

Step 6: update_project_yaml(projectId, { fileKey: modifiedYaml })
        → Confirm { success: true }
```

---

## YAML Content Formatting

When passing YAML content to `validate_yaml` and `update_project_yaml`:
- Pass YAML as a **normal multi-line string**
- Do NOT escape newlines as literal `\n` characters
- Do NOT use shell commands to construct YAML
- The MCP tools handle JSON serialization automatically

---

## Available Prompts

The MCP server includes built-in prompts for common workflows:

| Prompt | Purpose |
|--------|---------|
| `flutterflow-dev-workflow` | Comprehensive workflow guide (this document in prompt form) |
| `inspect-project` | Read and summarize a project's structure |
| `generate-page` | Generate a new page from a description |
| `modify-component` | Modify an existing component |

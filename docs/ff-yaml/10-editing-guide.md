# 10 - Editing FlutterFlow via MCP API

How to use the MCP tools to read, inspect, modify, and push FlutterFlow YAML. This covers the complete workflow from syncing a project to pushing widget changes, including critical rules for adding new widgets.

---

## 1. Reading Workflow

### Step 1: Sync the project to local cache

Download all YAML files for fast offline reads. Run this once per project.

```
sync_project(projectId)
```

This creates a local cache at `.ff-cache/<projectId>/` containing every YAML file in the project. To force a re-sync (e.g., after making changes in the FlutterFlow UI):

```
sync_project(projectId, force: true)
```

### Step 2: Get quick summaries from cache

Use cache-based tools for fast overviews -- no API calls needed.

```
get_page_summary(projectId, pageName: "Welcome")
```

Returns: widget tree structure, actions (with triggers), page parameters, page state variables, and disabled action indicators.

```
get_component_summary(projectId, componentName: "PhoneSignInComponent")
```

Returns: component widget tree, parameters, and actions.

### Step 3: Find navigation flow and component usage

```
find_page_navigations(projectId, pageName: "PaywallPage")
```

Returns: all actions across the project that navigate to the specified page, including the source page, trigger type, disabled status, and any passed parameters.

```
find_component_usages(projectId, componentName: "MyComponent")
```

Returns: every page and component where `MyComponent` is embedded, with parameter pass details.

### Step 4: Fetch specific YAML for detailed reading

For full page YAML (name, widget tree, class model):

```
get_page_by_name(projectId, "Welcome")
```

For a specific file by key (node-level widget, config file, component):

```
get_project_yaml(projectId, "page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Button_YYY")
```

### Reading tool selection guide

| Goal | Tool | API Calls? |
|------|------|------------|
| Quick page overview | `get_page_summary` | No (cache) |
| Quick component overview | `get_component_summary` | No (cache) |
| Find where a component is used | `find_component_usages` | No (cache) |
| Find navigation sources | `find_page_navigations` | No (cache) |
| Full page YAML by name | `get_page_by_name` | Yes |
| Specific node/config YAML | `get_project_yaml` | Yes |
| List all pages with names | `list_pages` | Yes |
| List all file keys | `list_project_files` | Yes |

---

## 2. Editing Workflow

### The standard edit cycle

```
Read  -->  Modify  -->  Validate  -->  Push
```

### Step 1: Read the current YAML

Fetch the **node-level** file for the widget you want to edit (not the full page):

```
get_project_yaml(projectId, "page/id-Scaffold_7o6kzmdm/page-widget-tree-outline/node/id-Button_7c3kwr61")
```

To find the widget key, first fetch the full page via `get_page_by_name`, locate the widget in the tree, and note its `key` field (e.g., `Button_7c3kwr61`).

### Step 2: Modify the YAML

Change the values you need. **Critical rule:** always update BOTH `inputValue` AND `mostRecentInputValue` to the same value.

```yaml
# CORRECT
textValue:
  inputValue: New Label
  mostRecentInputValue: New Label

# WRONG -- will cause sync issues in FlutterFlow
textValue:
  inputValue: New Label
  mostRecentInputValue: Old Label
```

### Step 3: Validate before pushing

```
validate_yaml(projectId, fileKey, modifiedYaml)
```

This returns `{ success: true }` or a list of validation errors. Always validate before pushing.

### Step 4: Push the changes

```
update_project_yaml(projectId, { fileKey: modifiedYaml })
```

Returns `{ success: true }` on success.

### Complete edit example

**Task:** Change a button label from "Old Text" to "New Text" on the Welcome page.

```
Step 1: list_pages(projectId)
        --> Find Welcome page: scaffoldId = Scaffold_7o6kzmdm

Step 2: get_page_by_name(projectId, "Welcome")
        --> Read full page YAML, find the button widget
        --> Button key: Button_7c3kwr61

Step 3: get_project_yaml(projectId,
          "page/id-Scaffold_7o6kzmdm/page-widget-tree-outline/node/id-Button_7c3kwr61")
        --> Get fresh node-level YAML for just the button

Step 4: Modify the YAML -- change textValue.inputValue AND mostRecentInputValue

Step 5: validate_yaml(projectId, fileKey, modifiedYaml)
        --> Confirm { success: true }

Step 6: update_project_yaml(projectId, { fileKey: modifiedYaml })
        --> Confirm { success: true }
```

---

## 3. Adding Widgets (CRITICAL)

Adding new widgets to a page is the most error-prone operation. The full page YAML file (`page/id-Scaffold_XXX`) only stores page metadata -- the server **strips any inline children**. You MUST push widgets as individual node-level files.

### Required files for adding widgets

You need to push **three types of files** in a **single** `update_project_yaml` call:

| File | Key Pattern | Purpose |
|------|-------------|---------|
| Widget tree outline | `page/id-Scaffold_XXX/page-widget-tree-outline` | Defines the tree structure (which children belong to which parent) |
| Parent node | `page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Column_YYY` | The container widget (Column, Row, Stack, etc.) |
| Each child node | `page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Widget_ZZZ` | Individual widget YAML with full props |

### File key pattern breakdown

```
page/id-{ScaffoldKey}                                              # Page metadata
page/id-{ScaffoldKey}/page-widget-tree-outline                     # Tree structure
page/id-{ScaffoldKey}/page-widget-tree-outline/node/id-{WidgetKey} # Individual widget node
```

### Step-by-step example

**Task:** Add a Text widget and Button to the "testing" page (Scaffold_tjgkshke, body Column_gjy4w42f).

**File 1 -- Widget tree outline:**
```yaml
# File key: page/id-Scaffold_tjgkshke/page-widget-tree-outline
node:
  key: Scaffold_tjgkshke
  body:
    key: Column_gjy4w42f
    children:
      - key: Text_mytext01
      - key: Button_mybtn01
```

**File 2 -- Text widget node:**
```yaml
# File key: page/id-Scaffold_tjgkshke/page-widget-tree-outline/node/id-Text_mytext01
key: Text_mytext01
type: Text
props:
  text:
    fontFamily: Open Sans
    themeStyle: BODY_MEDIUM
    isCustomFont: false
    selectable: false
    textValue:
      inputValue: Hello World
    fontSizeValue:
      inputValue: 24
    colorValue:
      inputValue:
        themeColor: PRIMARY_TEXT
    fontWeightValue:
      inputValue: w700
  responsiveVisibility: {}
  opacity:
    opacityValue:
      inputValue: 1
      mostRecentInputValue: 1
name: myText
parameterValues: {}
valueKey: {}
```

**File 3 -- Button widget node:**
```yaml
# File key: page/id-Scaffold_tjgkshke/page-widget-tree-outline/node/id-Button_mybtn01
key: Button_mybtn01
type: Button
props:
  button:
    text:
      themeStyle: TITLE_SMALL
      textValue:
        inputValue: Click Me
        mostRecentInputValue: Click Me
      colorValue:
        inputValue:
          themeColor: PRIMARY_BACKGROUND
      fontWeightValue:
        inputValue: w700
    borderRadius:
      type: FF_BORDER_RADIUS_ALL
      allValue:
        inputValue: 40
        mostRecentInputValue: 40
    dimensions:
      width:
        pixelsValue:
          inputValue: Infinity
          mostRecentInputValue: Infinity
      height:
        pixelsValue:
          inputValue: 48
    elevationValue:
      inputValue: 0
      mostRecentInputValue: 0
    fillColorValue:
      inputValue:
        themeColor: PRIMARY
  responsiveVisibility: {}
  opacity:
    opacityValue:
      inputValue: 1
      mostRecentInputValue: 1
parameterValues: {}
valueKey: {}
```

**Push all files in one call:**
```
update_project_yaml(projectId, {
  "page/id-Scaffold_tjgkshke/page-widget-tree-outline": treeOutlineYaml,
  "page/id-Scaffold_tjgkshke/page-widget-tree-outline/node/id-Column_gjy4w42f": columnNodeYaml,
  "page/id-Scaffold_tjgkshke/page-widget-tree-outline/node/id-Text_mytext01": textNodeYaml,
  "page/id-Scaffold_tjgkshke/page-widget-tree-outline/node/id-Button_mybtn01": buttonNodeYaml
})
```

### Validation tip

Validate the tree outline first. It reports `"File is referenced but is empty"` for missing node files, telling you exactly which node files you still need to create.

---

## 4. Common Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `"Unknown field name 'X'"` | Invalid YAML field name for this widget type | Check the widget YAML reference. Field names are specific to each widget type (e.g., `text:` not `textValue:` at the widget props level). |
| `"Unknown enum value"` | Invalid enum constant (wrong case, typo, or unsupported value) | Use exact enum values: `BODY_MEDIUM`, `ALIGN_CENTER`, `w700`, `FF_PADDING_ALL`, etc. |
| `"File is referenced but is empty"` | The widget tree outline references a node key, but no node file exists for it | Create the missing node file with that key and push it alongside the tree outline. |
| `"Duplicate key"` | Two nodes in the tree have the same key | Generate a unique key for each widget (format: `Type_randomchars`, e.g., `Button_abc12345`). |
| Buffer/size error | Page YAML is too large to fetch or decode | Use node-level sub-files instead of fetching the full page. |

---

## 5. Anti-Patterns (Things That Do NOT Work)

### Embedding widget children in full page YAML

The full page file (`page/id-Scaffold_XXX`) only stores page metadata. The FlutterFlow server strips any inline children from this file. You MUST push widgets as individual node files.

```
BAD:  Push children inside page/id-Scaffold_XXX
GOOD: Push each widget as page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Widget_ZZZ
```

### Using shell commands to construct YAML

Shell escaping (especially with newlines, quotes, and special characters) will corrupt the YAML. The MCP tools handle JSON serialization automatically.

```
BAD:  echo "key: value\ntype: Button" | some_command
GOOD: Pass YAML as a normal multi-line string directly to MCP tools
```

### Forgetting to sync inputValue and mostRecentInputValue

Every value field in FlutterFlow YAML has two copies. If they diverge, the FlutterFlow editor will show inconsistent state and may overwrite your changes.

```yaml
# BAD -- values out of sync
textValue:
  inputValue: New Text
  mostRecentInputValue: Old Text

# GOOD -- always identical
textValue:
  inputValue: New Text
  mostRecentInputValue: New Text
```

### Fetching all YAML without a fileName

Calling `get_project_yaml` without specifying a `fileName` downloads the entire project. This can exceed buffer/transport limits on large projects and is almost never what you want.

```
BAD:  get_project_yaml(projectId)              # Downloads everything
GOOD: get_project_yaml(projectId, "theme.yaml") # Downloads one file
```

### Using list_project_files to find pages

`list_project_files` returns raw file keys, which are scaffold IDs with no human-readable names. Use `list_pages` instead -- it returns page names, scaffold IDs, and folder assignments.

```
BAD:  list_project_files(projectId)   # Returns raw keys like "page/id-Scaffold_abc123"
GOOD: list_pages(projectId)           # Returns { name: "Welcome", scaffoldId: "Scaffold_abc123", folder: "Auth" }
```

### Editing full page YAML for a single widget change

Fetching and re-pushing the full page YAML risks overwriting concurrent changes and is unnecessarily slow. Use node-level file keys for targeted edits.

```
BAD:  get_project_yaml(projectId, "page/id-Scaffold_XXX")  # Full page
GOOD: get_project_yaml(projectId, "page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Button_YYY")  # Just the button
```

### Pushing without validating

Always call `validate_yaml` before `update_project_yaml`. Pushing invalid YAML can corrupt the page state in FlutterFlow.

---

## 6. YAML Content Formatting

When passing YAML content to `validate_yaml` and `update_project_yaml`:

- Pass YAML as a **normal multi-line string**
- Do NOT escape newlines as literal `\n` characters
- Do NOT use shell commands to construct YAML
- The MCP SDK handles JSON serialization automatically

---

## 7. Tool Reference Summary

### Discovery tools

| Tool | Input | Output |
|------|-------|--------|
| `list_projects` | (none) | All projects with IDs |
| `list_pages` | `projectId` | Pages with names, scaffold IDs, folders |
| `list_project_files` | `projectId` | All raw file keys (rarely needed) |

### Cache tools (require `sync_project` first)

| Tool | Input | Output |
|------|-------|--------|
| `sync_project` | `projectId`, optional `force` | Downloads all YAML to local cache |
| `get_page_summary` | `projectId`, `pageName` or `scaffoldId` | Widget tree, actions, params, state |
| `get_component_summary` | `projectId`, `componentName` or `componentId` | Widget tree, params, actions |
| `find_component_usages` | `projectId`, `componentName` or `componentId` | All pages/components using the component |
| `find_page_navigations` | `projectId`, `pageName` or `scaffoldId` | All navigate actions targeting the page |

### Read tools (API calls)

| Tool | Input | Output |
|------|-------|--------|
| `get_page_by_name` | `projectId`, `pageName` | Full page YAML resolved by name |
| `get_project_yaml` | `projectId`, `fileName` | Any YAML file by key |

### Write tools (API calls)

| Tool | Input | Output |
|------|-------|--------|
| `validate_yaml` | `projectId`, `fileKey`, `fileContent` | Validation result |
| `update_project_yaml` | `projectId`, `fileKeyToContent` (map) | Push result |

---

## 8. Recommended Workflow Patterns

### Inspecting a project for the first time

```
list_projects
  --> sync_project(projectId)
  --> get_page_summary(projectId, pageName: "HomePage")
  --> get_component_summary(projectId, componentName: "NavBar")
```

### Editing an existing widget

```
list_pages(projectId)
  --> get_page_by_name(projectId, "PageName")
  --> get_project_yaml(projectId, "page/id-Scaffold_XXX/.../node/id-Widget_YYY")
  --> [modify YAML]
  --> validate_yaml(projectId, fileKey, yaml)
  --> update_project_yaml(projectId, { fileKey: yaml })
```

### Adding new widgets to a page

```
list_pages(projectId)
  --> get_page_by_name(projectId, "PageName")
  --> [construct tree outline + node files]
  --> validate_yaml for each file
  --> update_project_yaml(projectId, { treeOutlineKey: ..., nodeKey1: ..., nodeKey2: ... })
```

### Understanding navigation flow

```
sync_project(projectId)
  --> find_page_navigations(projectId, pageName: "TargetPage")
  --> get_page_summary for each source page
```

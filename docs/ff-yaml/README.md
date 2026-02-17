# FlutterFlow YAML Reference for AI Agents

A structured reference catalog of FlutterFlow's YAML schema, derived from real production projects. Use this to read, create, and modify FlutterFlow project files programmatically via the MCP API. Each document covers one domain with exact field names, valid enum values, and copy-paste-ready templates.

---

## Which file do I need?

| I want to... | Read this |
|---|---|
| Understand FF project structure | `00-overview.md` |
| Read/modify project settings | `01-project-files.md` |
| Work with pages | `02-pages.md` |
| Work with components | `03-components.md` |
| Build/modify a specific widget | `04-widgets/` (see index inside) |
| Add/modify action chains | `05-actions.md` |
| Bind dynamic data to widgets | `06-variables.md` |
| Define data models | `07-data.md` |
| Write custom Dart code | `08-custom-code.md` |
| Customize colors/fonts | `09-theming.md` |
| Push changes via MCP API | `10-editing-guide.md` |

---

## Universal patterns

These four patterns appear across all FlutterFlow YAML files. Internalize them before reading any other document.

### 1. `inputValue` / `mostRecentInputValue` sync

Every settable value uses a dual-field pattern. **Both fields must always contain the same value.** Failing to sync them causes silent data corruption in the FlutterFlow editor.

```yaml
# Correct
textValue:
  inputValue: Hello World
  mostRecentInputValue: Hello World

# Wrong -- will cause sync issues
textValue:
  inputValue: Hello World
  mostRecentInputValue: Old Value
```

This applies to most value types: text, color, numeric, boolean, enum, icon, dimension, opacity, border radius, padding, and alignment values.

**Exceptions — fields that only accept `inputValue`:**
- `fontWeightValue` — does NOT support `mostRecentInputValue`
- `fontSizeValue` — does NOT support `mostRecentInputValue`

Adding `mostRecentInputValue` to these fields will cause a validation error (`Unknown field name 'mostRecentInputValue'`). When in doubt, check the field reference table for the specific widget.

### 2. `identifier: { name, key }` pattern

Named entities (params, state fields, data types, components) are referenced via an identifier block:

```yaml
identifier:
  name: userName          # Human-readable name
  key: Parameter_abc123   # Unique machine key
```

When creating new identifiers, generate a unique key using the pattern `<Type>_<8 alphanumeric chars>` (e.g., `Parameter_k7m2x9p1`).

### 3. Theme color references

Colors can be literal ARGB or theme references. Theme references use a fixed set of token names:

```yaml
# Theme reference (preferred)
colorValue:
  inputValue:
    themeColor: PRIMARY
  mostRecentInputValue:
    themeColor: PRIMARY

# Literal ARGB (decimal string)
colorValue:
  inputValue:
    value: "4294940319"
  mostRecentInputValue:
    value: "4294940319"
```

**Valid `themeColor` tokens:** `PRIMARY`, `SECONDARY`, `TERTIARY`, `ALTERNATE`, `PRIMARY_TEXT`, `SECONDARY_TEXT`, `PRIMARY_BACKGROUND`, `SECONDARY_BACKGROUND`, `ACCENT1`, `ACCENT2`, `ACCENT3`, `ACCENT4`, `SUCCESS`, `WARNING`, `ERROR`, `INFO`.

### 4. File key naming

File keys map directly to API endpoints. The naming convention encodes hierarchy:

```
page/id-Scaffold_XXX                                              # Page metadata
page/id-Scaffold_XXX/page-widget-tree-outline                     # Widget tree structure
page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Widget_YYY  # Individual widget node
component/id-Container_XXX                                        # Component metadata
component/id-Container_XXX/component-widget-tree-outline           # Component widget tree
api-endpoint/id-XXX                                               # API endpoint
custom-actions/id-XXX                                             # Custom action
```

Rules:
- Keys use `/` as separator, never `\`
- IDs are prefixed with `id-`
- Page scaffolds use `Scaffold_` prefix; components use `Container_` prefix
- Widget nodes use type-specific prefixes: `Text_`, `Button_`, `Column_`, `Row_`, `Container_`, `Image_`, `Icon_`, `TextField_`, etc.

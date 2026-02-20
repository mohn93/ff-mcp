# Components

A component in FlutterFlow is a reusable `Container`-rooted widget tree. Components are structurally identical to pages but use `Container` instead of `Scaffold` as the root and support being embedded inside other pages or components via `componentClassKeyRef`.

---

## 1. Component Metadata

**File key:** `component/id-Container_XXX`

### Component with string parameters

```yaml
name: PremuimContentWall
description: "this would be a widget that acts as a blocked content behind pay button, maybe blurred view being a subscripe button\n"
params:
  kw4qti:
    identifier:
      name: title
      key: kw4qti
    dataType:
      scalarType: String
      nonNullable: false
  psru0e:
    identifier:
      name: subtitle
      key: psru0e
    dataType:
      scalarType: String
      nonNullable: false
node:
  key: Container_ffzg5wc5
```

### Component with Action (callback) parameters

```yaml
name: ExtendAnalysisComponent
description: ""
params:
  0qlpdk:
    identifier:
      name: foodId
      key: 0qlpdk
    dataType:
      scalarType: String
      nonNullable: true
  326n4o:
    identifier:
      name: extendAnalysis
      key: 326n4o
    dataType:
      scalarType: Action
      nonNullable: true
  y3mj9l:
    identifier:
      name: deleteFood
      key: y3mj9l
    dataType:
      scalarType: Action
      nonNullable: true
node:
  key: Container_9jc8lryj
```

### Component with state fields

```yaml
name: EditProfile
description: ""
node:
  key: Container_w4a9oyew
classModel:
  stateFields:
    - parameter:
        identifier:
          name: indexAnalysisSelect
          key: ctls8
        dataType:
          scalarType: Integer
    - parameter:
        identifier:
          name: valueAnalysisSelected
          key: o29r4
        dataType:
          scalarType: String
          nonNullable: false
```

### Schema reference

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Human-readable component name |
| `description` | string | no | Component description |
| `params` | map | no | Component parameters keyed by param key hash |
| `node.key` | string | yes | Root Container key (format: `Container_XXXXXXXX`) |
| `classModel` | object | no | State fields (same structure as pages) |

---

## 2. How Components Differ from Pages

| Aspect | Page | Component |
|---|---|---|
| Root widget type | `Scaffold` | `Container` |
| Root key format | `Scaffold_XXXXXXXX` | `Container_XXXXXXXX` |
| Tree outline file key | `page-widget-tree-outline` | `component-widget-tree-outline` |
| File key prefix | `page/id-Scaffold_XXX` | `component/id-Container_XXX` |
| Can be embedded in other widgets | No | Yes (via `componentClassKeyRef`) |
| Supports route params (`params`) | Yes (passed via navigation) | Yes (passed via `parameterValues`) |
| Supports state fields | Yes (`classModel.stateFields`) | Yes (`classModel.stateFields`) |
| Has `isDummyRoot` | No | Yes (root container is a transparent wrapper) |
| Navigation target | Yes | No |
| `body` in tree outline | Yes (`node.body`) | No (`node.children` directly) |

---

## 3. Component Parameters

Parameters are defined in `params` at the top level of the component metadata file.

### Parameter definition schema

```yaml
params:
  <paramKey>:
    identifier:
      name: <paramName>
      key: <paramKey>
    defaultValue:                  # optional
      serializedValue: <value>
    dataType:
      scalarType: <type>
      nonNullable: <bool>
      subType:                     # for Document/DataStruct types
        collectionIdentifier:
          name: <name>
          key: <key>
```

---

## 4. Parameter Types

| scalarType | Description | Extra fields |
|---|---|---|
| `String` | Text value | -- |
| `Integer` | Integer number | -- |
| `Double` | Floating-point number | -- |
| `Boolean` | True/false | -- |
| `Color` | ARGB color value | -- |
| `Action` | Callback function passed from parent. Triggers appear as `CALLBACK-<key>`. | -- |
| `Document` | Firestore document reference | `subType.collectionIdentifier` required |
| `DataStruct` | Custom data type | `subType` with struct definition |

### Action parameter example

When a component defines an Action parameter:

```yaml
params:
  326n4o:
    identifier:
      name: extendAnalysis
      key: 326n4o
    dataType:
      scalarType: Action
      nonNullable: true
```

It is invoked inside the component via `executeCallbackAction`:

```yaml
key: gt91qt34
executeCallbackAction:
  parameterIdentifier:
    name: extendAnalysis
    key: 326n4o
```

The trigger type for callbacks is `CALLBACK-<paramKey>` (e.g., `id-CALLBACK-bins86`).

---

## 5. Component State

State fields work identically to page state fields. Defined in `classModel.stateFields`:

```yaml
classModel:
  stateFields:
    - parameter:
        identifier:
          name: indexAnalysisSelect
          key: ctls8
        dataType:
          scalarType: Integer
    - parameter:
        identifier:
          name: valueAnalysisSelected
          key: o29r4
        dataType:
          scalarType: String
          nonNullable: false
```

State updates from actions use `stateVariableType: WIDGET_CLASS_STATE`:

```yaml
localStateUpdate:
  updates:
    - fieldIdentifier:
        key: o29r4
      setValue:
        variable:
          source: LOCAL_STATE
          baseVariable:
            localState:
              fieldIdentifier:
                name: user
                key: cxensw6z
              stateVariableType: APP_STATE
  updateType: WIDGET
  stateVariableType: WIDGET_CLASS_STATE
key: qe82s7k1
```

---

## 6. Referencing a Component from Another Widget

To embed a component inside a page or another component, the host widget uses `componentClassKeyRef` and `parameterValues`.

### Minimal reference (no params passed)

```yaml
key: Container_jdtt4zdw
type: Container
props: {}
parameterValues:
  widgetClassNodeKeyRef:
    key: Container_qtmqdlq9
componentClassKeyRef:
  key: Container_qtmqdlq9
```

### Reference with parameter passes

```yaml
key: Container_h7c8oc57
type: Container
props:
  expanded:
    expandedType: EXPANDED
parameterValues:
  parameterPasses:
    w2td86:
      paramIdentifier:
        name: isPage
        key: w2td86
      inputValue:
        serializedValue: "true"
  widgetClassNodeKeyRef:
    key: Container_od80u8ml
componentClassKeyRef:
  key: Container_od80u8ml
```

### Reference with `updateContainingClassOnSetState`

When the component's state changes should trigger a rebuild of the parent:

```yaml
key: Container_j48t6fjy
type: Container
props:
  expanded:
    expandedType: UNEXPANDED
  responsiveVisibility: {}
parameterValues:
  updateContainingClassOnSetState: true
  widgetClassNodeKeyRef:
    key: Container_ngmk9lon
componentClassKeyRef:
  key: Container_ngmk9lon
```

### Required fields for component references

| Field | Description |
|---|---|
| `componentClassKeyRef.key` | The root Container key of the referenced component |
| `parameterValues.widgetClassNodeKeyRef.key` | Must match `componentClassKeyRef.key` |
| `parameterValues.parameterPasses` | Map of parameter values to pass (optional) |
| `parameterValues.updateContainingClassOnSetState` | Whether parent rebuilds on component state change (optional) |

### Parameter pass value sources

Parameter values can come from multiple sources:

**Static value:**
```yaml
paramIdentifier:
  name: isPage
  key: w2td86
inputValue:
  serializedValue: "true"
```

**Variable reference:**
```yaml
paramIdentifier:
  name: endDate
  key: 0u8o42
variable:
  source: GLOBAL_PROPERTIES
  baseVariable:
    globalProperties:
      property: CURRENT_TIMESTAMP
```

**Widget property pass-through:**
```yaml
paramIdentifier:
  name: dimensions
  key: 5f7c90
widgetProperty:
  dimensions:
    width:
      pixelsValue:
        inputValue: Infinity
    height:
      pixelsValue:
        inputValue: 460
```

**Translatable text (i18n):**

Use `translatableText` inside `inputValue` to pass a string that should be translated at runtime based on the app's current locale. This is the correct way to make component parameter text translatable.

```yaml
paramIdentifier:
  name: title
  key: p1titl
inputValue:
  translatableText:
    translationIdentifier:
      key: ms01ttl1              # References languages/translation/id-ms01ttl1
    textValue:
      inputValue: Histamine / Low DAO   # English default / editor preview
```

Each `translationIdentifier.key` must have a corresponding `languages/translation/id-<key>` file with translations for all supported languages (see `01-project-files.md` for the translation file schema).

> **Note:** `translationIdentifier` is NOT valid as a direct sibling of `paramIdentifier` on a parameterPass — it must be nested inside `inputValue.translatableText`. Placing it at the wrong level causes a validation error.

---

## 7. isDummyRoot

Every component's root Container node has `isDummyRoot: true`. This marks it as a transparent wrapper that FlutterFlow uses internally. The root container typically has minimal styling (transparent background, no dimensions).

```yaml
key: Container_ffzg5wc5
type: Container
props:
  container:
    boxDecoration:
      colorValue:
        inputValue:
          value: "0"                 # fully transparent
name: PremuimContentWall
isDummyRoot: true
```

The `isDummyRoot` flag tells FlutterFlow to treat this Container as the component boundary, not as a visible widget. The actual visual content starts with the first child.

---

## 8. Component Widget Tree Outline

**File key:** `component/id-Container_XXX/component-widget-tree-outline`

Structurally similar to page tree outlines, but uses `children` directly under the root node instead of `body`:

```yaml
node:
  key: Container_ffzg5wc5
  children:
    - key: Container_tfliyp8f
      children:
        - key: Stack_xkb3xt70
          children:
            - key: Container_bwqw67by
              children:
                - key: Column_413255jc
                  children:
                    - key: Container_yl6sd9jh
                    - key: Container_2txrctco
                    - key: Container_056rmdev
                    - key: Container_dxsdiyyn
            - key: Blur_1c9k5x0n
              children:
                - key: Container_q7m3k7c9
            - key: Container_1k4ettsz
              children:
                - key: Column_ue835m8w
                  children:
                    - key: Icon_28qttdd5
                    - key: Text_vo3w8rsz
                    - key: Text_tg7gbbph
                    - key: Button_drlhww71
```

---

## 9. File Key Patterns

| Pattern | Purpose |
|---|---|
| `component/id-Container_XXX` | Component metadata (name, params, classModel) |
| `component/id-Container_XXX/component-widget-tree-outline` | Widget tree hierarchy (keys only) |
| `component/id-Container_XXX/component-widget-tree-outline/node/id-Widget_YYY` | Individual widget definition |
| `component/id-Container_XXX/component-widget-tree-outline/node/id-Widget_YYY/trigger_actions/id-ON_TAP` | Action trigger |
| `component/id-Container_XXX/component-widget-tree-outline/node/id-Widget_YYY/trigger_actions/id-ON_TAP/action/id-ACTIONKEY` | Individual action |
| `component/id-Container_XXX/component-widget-tree-outline/node/id-Widget_YYY/trigger_actions/id-CALLBACK-<paramKey>/action/id-ACTIONKEY` | Callback action (for Action-type params) |

### Notes

- **Component node files** follow the exact same structure as page node files. The only difference is the file key prefix (`component/` vs `page/`).
- **The tree outline key** is `component-widget-tree-outline` (not `page-widget-tree-outline`).
- **CALLBACK triggers** appear when an Action parameter is executed from a child widget that is itself a component reference. The trigger key includes the param key (e.g., `CALLBACK-bins86`).

---

## 10. Components in Summary Output

The `get_page_summary` and `get_component_summary` tools resolve component references and display them with a distinct format in the widget tree. This makes it easy to distinguish regular widgets from embedded components at a glance.

### Format

Component instances appear as `[ComponentName] (Container_ID)` instead of just `Container`:

```
FeedHomePage (Scaffold_e5ows2lg) — folder: home

ON_INIT_STATE → [customAction: checkNotificationPermissionResult, ...]

Widget Tree:
└── [body] Container
    └── Column
        └── Column
            ├── [Header] (Container_ur4ml9qw)
            ├── [SearchBar] (Container_qw4kqc4l)
            └── Container
                └── [PostsList] (Container_pgvko7fz)
```

### Reading the output

| Element | Meaning |
|---|---|
| `Container`, `Column`, `Row`, etc. | Regular widget — defined inline on this page/component |
| `[Header] (Container_ur4ml9qw)` | Component instance — `Header` is the component name, `Container_ur4ml9qw` is the component ID |
| `[body]`, `[appBar]`, etc. | Slot prefix — which slot of the parent widget this node fills |
| `→ ON_TAP → [navigate: to page]` | Trigger — action(s) attached to this widget |

### Drilling into components

The component ID in parentheses (e.g. `Container_ur4ml9qw`) can be used to retrieve the full component structure:

- **`get_component_summary`** — pass `componentId: "Container_ur4ml9qw"` (or `componentName: "Header"`) to see the component's internal widget tree, params, and actions
- **`get_project_yaml`** — pass `fileName: "component/id-Container_ur4ml9qw"` to get the raw component metadata YAML
- **`find_component_usages`** — pass `componentId: "Container_ur4ml9qw"` to find all pages and components where this component is used

### Nested components

Components can contain other components. The same `[Name] (ID)` format appears at any nesting level:

```
PostsList (Container_pgvko7fz)
Params: customAudienceFilter (Enum), profileUserId (String), fetchType (Enum), itemId (String)

Widget Tree:
└── ConditionalBuilder
    ├── PlaceholderWidget
    │   └── ListView
    │       └── [PostCard] (Container_abc12345) → CALLBACK → [updateState]
    └── PlaceholderWidget
        └── Column
            └── [EmptyState] (Container_xyz98765)
```

---

## 11. Creating a New Component

Creating a component requires pushing multiple files in a **single** `update_project_yaml` call, similar to adding widgets to a page.

### Required files

| # | File Key | Purpose |
|---|----------|---------|
| 1 | `component/id-Container_XXX` | Component metadata (name, params, state) |
| 2 | `component/id-Container_XXX/component-widget-tree-outline` | Widget tree hierarchy |
| 3 | `component/id-Container_XXX/component-widget-tree-outline/node/id-Container_XXX` | Root Container node (`isDummyRoot: true`) |
| 4 | `component/id-Container_XXX/component-widget-tree-outline/node/id-Widget_YYY` | One file per child widget |

### Step-by-step example

**Task:** Create a reusable `DealCard` component with `title` (String), `subtitle` (String), and `onTap` (Action) parameters.

**File 1 — Component metadata:**
```yaml
# File key: component/id-Container_dc01root
name: DealCard
description: "Reusable card displaying a deal with title, subtitle, and tap action"
params:
  p1titl:
    identifier:
      name: title
      key: p1titl
    dataType:
      scalarType: String
      nonNullable: true
  p2subt:
    identifier:
      name: subtitle
      key: p2subt
    dataType:
      scalarType: String
      nonNullable: false
  p3tap:
    identifier:
      name: onTap
      key: p3tap
    dataType:
      scalarType: Action
      nonNullable: false
node:
  key: Container_dc01root
```

**File 2 — Widget tree outline:**
```yaml
# File key: component/id-Container_dc01root/component-widget-tree-outline
node:
  key: Container_dc01root
  children:
    - key: Container_dc01card
      children:
        - key: Column_dc01col
          children:
            - key: Text_dc01titl
            - key: Text_dc01sub
```

**File 3 — Root Container node:**
```yaml
# File key: component/id-Container_dc01root/component-widget-tree-outline/node/id-Container_dc01root
key: Container_dc01root
type: Container
props:
  container:
    boxDecoration:
      colorValue:
        inputValue:
          value: "0"
        mostRecentInputValue:
          value: "0"
name: DealCard
isDummyRoot: true
```

> The root Container must have `isDummyRoot: true` and a transparent background (`value: "0"`). This marks it as the component boundary — the actual visual content starts with the first child.

**File 4 — Card container node:**
```yaml
# File key: component/id-Container_dc01root/component-widget-tree-outline/node/id-Container_dc01card
key: Container_dc01card
type: Container
props:
  container:
    boxDecoration:
      colorValue:
        inputValue:
          themeColor: SECONDARY_BACKGROUND
        mostRecentInputValue:
          themeColor: SECONDARY_BACKGROUND
      borderRadiusValue:
        inputValue: 12
        mostRecentInputValue: 12
  paddingValue:
    inputValue: "16,16,16,16"
    mostRecentInputValue: "16,16,16,16"
  widthValue:
    inputValue: "double.infinity"
    mostRecentInputValue: "double.infinity"
  responsiveVisibility: {}
parameterValues: {}
valueKey: {}
```

**File 5 — Column node:**
```yaml
# File key: component/id-Container_dc01root/component-widget-tree-outline/node/id-Column_dc01col
key: Column_dc01col
type: Column
props:
  column:
    crossAxisAlignmentValue:
      inputValue: START
      mostRecentInputValue: START
  responsiveVisibility: {}
parameterValues: {}
valueKey: {}
```

**File 6 — Title text (references component parameter):**
```yaml
# File key: component/id-Container_dc01root/component-widget-tree-outline/node/id-Text_dc01titl
key: Text_dc01titl
type: Text
props:
  text:
    themeStyle: TITLE_MEDIUM
    selectable: false
    textValue:
      variable:
        source: WIDGET_CLASS_PARAMETER
        baseVariable:
          widgetClass:
            paramIdentifier:
              name: title
              key: p1titl
        nodeKeyRef:
          key: Container_dc01root
    colorValue:
      inputValue:
        themeColor: PRIMARY_TEXT
    fontWeightValue:
      inputValue: w600
  responsiveVisibility: {}
parameterValues: {}
valueKey: {}
```

> To display a component parameter, use `source: WIDGET_CLASS_PARAMETER` with `baseVariable.widgetClass.paramIdentifier` pointing to the param key. `nodeKeyRef.key` must point to the component's root Container ID.

**File 7 — Subtitle text:**
```yaml
# File key: component/id-Container_dc01root/component-widget-tree-outline/node/id-Text_dc01sub
key: Text_dc01sub
type: Text
props:
  text:
    themeStyle: BODY_MEDIUM
    selectable: false
    textValue:
      variable:
        source: WIDGET_CLASS_PARAMETER
        baseVariable:
          widgetClass:
            paramIdentifier:
              name: subtitle
              key: p2subt
        nodeKeyRef:
          key: Container_dc01root
    colorValue:
      inputValue:
        themeColor: SECONDARY_TEXT
  responsiveVisibility: {}
parameterValues: {}
valueKey: {}
```

**Push all files in one call:**
```
update_project_yaml(projectId, {
  "component/id-Container_dc01root": metadataYaml,
  "component/id-Container_dc01root/component-widget-tree-outline": treeOutlineYaml,
  "component/id-Container_dc01root/component-widget-tree-outline/node/id-Container_dc01root": rootNodeYaml,
  "component/id-Container_dc01root/component-widget-tree-outline/node/id-Container_dc01card": cardNodeYaml,
  "component/id-Container_dc01root/component-widget-tree-outline/node/id-Column_dc01col": columnNodeYaml,
  "component/id-Container_dc01root/component-widget-tree-outline/node/id-Text_dc01titl": titleNodeYaml,
  "component/id-Container_dc01root/component-widget-tree-outline/node/id-Text_dc01sub": subtitleNodeYaml
})
```

### Using the new component in a page

After creating the component, embed it in a page by adding a Container node with `componentClassKeyRef`:

```yaml
# Node in the host page
key: Container_hostref1
type: Container
props:
  expanded:
    expandedType: UNEXPANDED
  responsiveVisibility: {}
parameterValues:
  parameterPasses:
    p1titl:
      paramIdentifier:
        name: title
        key: p1titl
      inputValue:
        serializedValue: "50% Off Coffee"
    p2subt:
      paramIdentifier:
        name: subtitle
        key: p2subt
      inputValue:
        serializedValue: "Valid until end of month"
  widgetClassNodeKeyRef:
    key: Container_dc01root
componentClassKeyRef:
  key: Container_dc01root
```

For Action-type parameters, use `executeCallbackAction` inside the component:
```yaml
# Action inside the component that invokes the onTap callback
key: act01tap
executeCallbackAction:
  parameterIdentifier:
    name: onTap
    key: p3tap
```

---

## 12. Refactoring Page Widgets into a Component

To extract existing page widgets into a reusable component:

### Step 1: Identify the widget subtree to extract

Use `get_page_summary` or `get_page_by_name` to find the subtree you want to extract. Note the root widget key and all descendant keys.

### Step 2: Decide on component parameters

Any data that was previously hardcoded or came from page state/params needs to become a component parameter. Common patterns:

| Was | Becomes |
|-----|---------|
| Hardcoded text | String parameter |
| Page state variable | Parameter passed from page |
| Page parameter | Parameter passed from page |
| Navigation action | Action (callback) parameter |
| API call result | Parameter or kept internal |

### Step 3: Create component files

1. **Metadata file** — Define `name`, `params`, and optionally `classModel.stateFields`
2. **Tree outline** — Copy the subtree from the page's `page-widget-tree-outline`, wrapping it under a new root Container with `isDummyRoot: true`
3. **Root node** — Create the `isDummyRoot: true` Container
4. **Child nodes** — Copy existing node files from the page, changing file key prefix from `page/id-Scaffold_XXX/page-widget-tree-outline/node/` to `component/id-Container_XXX/component-widget-tree-outline/node/`
5. **Update data references** — Replace hardcoded values with `WIDGET_CLASS_PARAMETER` variable references

### Step 4: Update the page

1. **Remove extracted nodes** from the page's tree outline
2. **Replace with a component reference** — Add a single Container node with `componentClassKeyRef` pointing to the new component
3. **Pass parameters** via `parameterValues.parameterPasses`

### Step 5: Push everything in one call

Push all component files AND the updated page files in a single `update_project_yaml` call to avoid an inconsistent state.

### Checklist

- [ ] Component metadata has correct `name` and `node.key`
- [ ] All params have unique keys (5-6 char alphanumeric)
- [ ] Root Container has `isDummyRoot: true` and transparent background
- [ ] Tree outline uses `children` (not `body`) under the root node
- [ ] All file keys use `component/` prefix (not `page/`)
- [ ] Tree outline key is `component-widget-tree-outline` (not `page-widget-tree-outline`)
- [ ] Parameter references use `source: WIDGET_CLASS_PARAMETER` with correct `nodeKeyRef`
- [ ] Host Container has both `componentClassKeyRef.key` and `parameterValues.widgetClassNodeKeyRef.key` pointing to the same component root ID
- [ ] Action callbacks use `executeCallbackAction` with correct `parameterIdentifier`
- [ ] Validated all files before pushing

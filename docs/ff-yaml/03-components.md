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

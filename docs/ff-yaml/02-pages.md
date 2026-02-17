# Pages

A page in FlutterFlow is a `Scaffold`-rooted widget tree stored across multiple YAML files: a metadata file, a widget tree outline, and individual node files for each widget.

---

## 1. Page Metadata File

**File key:** `page/id-Scaffold_XXX`

The metadata file defines the page name, description, parameters (route params), and class model (state fields, database request managers).

### Minimal page (no params, no state)

```yaml
name: Welcome
node:
  key: Scaffold_7o6kzmdm
classModel: {}
```

### Page with route parameters

```yaml
name: ForgotPassword
description: ""
params:
  ea1mfx:                          # param key (short hash)
    identifier:
      name: forhotOrChange
      key: ea1mfx
    defaultValue:
      serializedValue: Forgot
    dataType:
      scalarType: String
      nonNullable: true
node:
  key: Scaffold_084rppkk
```

### Page with Document-type route parameters

```yaml
name: GoldPassLocationDealsNew
description: ""
params:
  9sv9w2:
    identifier:
      name: establishment
      key: 9sv9w2
    dataType:
      scalarType: Document
      nonNullable: true
      subType:
        collectionIdentifier:
          name: Establishments
          key: k2ktdun9
  66hyy2:
    identifier:
      name: redeemedDeel
      key: 66hyy2
    dataType:
      scalarType: Document
      nonNullable: false
      subType:
        collectionIdentifier:
          name: EstablishmentDeals
          key: kynkvveh
node:
  key: Scaffold_4qdr9nq8
classModel:
  stateFields:
    - ...
```

### Schema reference

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Human-readable page name |
| `description` | string | no | Page description |
| `params` | map | no | Route parameters keyed by param key hash |
| `params.<key>.identifier` | `{name, key}` | yes | Parameter identity |
| `params.<key>.defaultValue` | `{serializedValue}` | no | Default value |
| `params.<key>.dataType` | object | yes | Type definition (`scalarType`, `nonNullable`, `subType`) |
| `node.key` | string | yes | Scaffold widget key (format: `Scaffold_XXXXXXXX`) |
| `classModel` | object | no | State fields and database request managers |

---

## 2. Widget Tree Outline

**File key:** `page/id-Scaffold_XXX/page-widget-tree-outline`

Defines the hierarchical parent-child structure of widgets. Contains only keys -- no props, no styling. The Scaffold's `body` is the entry point.

```yaml
node:
  key: Scaffold_084rppkk
  body:
    key: Container_3fyaj5aa
    children:
      - key: Column_ama70fo8
        children:
          - key: IconButton_5n2qcf1m
          - key: Column_cbgwkyuy
            children:
              - key: Text_lrclq8sc
              - key: Text_888c0du0
          - key: Form_wsu51ee2
            children:
              - key: TextField_hsymipjw
          - key: Column_46ybd5zs
            children:
              - key: Button_uaqbabys
```

### Key format

Widget keys follow the pattern `WidgetType_XXXXXXXX` where the suffix is an 8-character alphanumeric hash. Examples:
- `Scaffold_084rppkk`
- `Column_ama70fo8`
- `Text_lrclq8sc`
- `Button_uaqbabys`
- `Container_3fyaj5aa`

### Structure rules

- The root is always `node.key` matching the Scaffold key.
- `body` contains the top-level child (typically a Container).
- `children` is an ordered array of child widget key references.
- Leaf widgets have no `children` field.

---

## 3. Node Files

**File key:** `page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Widget_YYY`

Each widget in the tree has its own node file containing the full widget definition: type, props, name, and parameter values.

### Universal node structure

```yaml
key: Widget_XXXXXXXX          # matches the key in the tree outline
type: WidgetType               # Flutter widget type
props:
  <widgetType>:                # type-specific props object
    ...
  padding: {}                  # optional padding
  responsiveVisibility: {}     # optional responsive settings
  opacity:                     # optional opacity
    opacityValue:
      inputValue: 1
    animatedOpacity: {}
name: OptionalWidgetName       # human-readable name (optional)
parameterValues: {}            # parameter pass-through values (optional)
valueKey: {}                   # form value key (optional)
```

### Scaffold node

```yaml
key: Scaffold_084rppkk
type: Scaffold
props:
  scaffold:
    safeArea: true
    hideKeyboardOnTap: true
    backgroundColorValue:
      variable:
        source: FUNCTION_CALL
        functionCall:
          conditionalValue: ...
    navBarItem:
      navIcon: ...
      show: false
name: ForgotPassword
```

### Text node

```yaml
key: Text_lrclq8sc
type: Text
props:
  text:
    themeStyle: HEADLINE_MEDIUM
    selectable: false
    textValue:
      variable:
        source: WIDGET_CLASS_PARAMETER
        defaultValue:
          serializedValue: Forgot
        baseVariable:
          widgetClass:
            paramIdentifier:
              name: forhotOrChange
              key: ea1mfx
        nodeKeyRef:
          key: Scaffold_084rppkk
      mostRecentInputValue: Forgot
    colorValue:
      inputValue:
        themeColor: PRIMARY_TEXT
    fontWeightValue:
      inputValue: w600
  padding: {}
```

### Button node

```yaml
key: Button_uaqbabys
type: Button
props:
  button:
    text:
      themeStyle: TITLE_MEDIUM
      textValue:
        inputValue: Send OTP
      colorValue:
        inputValue:
          value: "4279506971"
    borderRadius:
      type: FF_BORDER_RADIUS_ALL
      allValue:
        inputValue: 8
    dimensions:
      width:
        pixelsValue:
          inputValue: Infinity       # Infinity = match parent
      height:
        pixelsValue:
          inputValue: 50
    elevationValue:
      inputValue: 0
    fillColorValue:
      inputValue:
        value: "4287097512"          # ARGB integer as string
  padding: {}
name: SendLinkButton
```

### TextField node

```yaml
key: TextField_hsymipjw
type: TextField
props:
  textField:
    textStyle:
      themeStyle: BODY_MEDIUM
    inputDecoration:
      inputBorderType: outline
      borderRadius:
        type: FF_BORDER_RADIUS_ALL
        allValue:
          inputValue: 8
      hintText:
        textValue:
          inputValue: Email
      filledValue:
        inputValue: true
      fillColorValue:
        inputValue:
          themeColor: SECONDARY_BACKGROUND
    keyboardType: EMAIL_ADDRESS
    maxLinesValue:
      inputValue: 1
  padding: {}
name: emailTextField
parameterValues: {}
valueKey: {}
```

### Column node

```yaml
key: Column_ama70fo8
type: Column
props:
  column:
    crossAxisAlignment: cross_axis_start
    listSpacing:
      spacingValue:
        inputValue: 24
    minSizeValue:
      inputValue: false
  padding:
    leftValue:
      inputValue: 24
    topValue:
      inputValue: 24
    rightValue:
      inputValue: 24
    bottomValue:
      inputValue: 24
```

### Container node (body wrapper)

```yaml
key: Container_3fyaj5aa
type: Container
props:
  container:
    dimensions: {}
    boxDecoration:
      boxShadow: {}
      image: {}
    maxDimensions: {}
    minDimensions: {}
  responsiveVisibility: {}
  opacity:
    opacityValue:
      inputValue: 1
    animatedOpacity: {}
valueKey: {}
```

---

## 4. Action Triggers

**File key:** `page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Widget_YYY/trigger_actions/id-ON_TAP`

Action triggers define what happens when a user interacts with a widget. Each trigger file contains the action chain root and its type.

### Trigger file

```yaml
rootAction:
  key: w96eorw3
  action:
    key: 3xmlbwbu                  # references the first action file
trigger:
  triggerType: ON_TAP
```

### Common trigger types

| Trigger | Description |
|---|---|
| `ON_TAP` | Widget tap/click |
| `ON_INIT_STATE` | Widget initialization |
| `ON_PAGE_LOAD` | Page load |
| `CALLBACK-<key>` | Callback from Action parameter (e.g., `CALLBACK-bins86`) |

### Chained actions

When multiple actions run sequentially, `followUpAction` chains them:

```yaml
rootAction:
  key: hahdlax9
  action:
    key: rpdoow9v                  # first action
  followUpAction:
    key: v3ka0b6f
    action:
      key: 3pkrta9w                # second action
    followUpAction:
      key: fkllh8cj
      conditionActions:            # conditional branching
        trueActions:
          - condition:
              variable:
                source: ACTION_OUTPUTS
                ...
            trueAction:
              key: gznngoyf
              action:
                key: di4vmbca
        falseAction:
          key: x8ovbrlm
          action:
            key: xw8zabog
trigger:
  triggerType: ON_TAP
```

### Action files

**File key:** `page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Widget_YYY/trigger_actions/id-ON_TAP/action/id-ACTIONKEY`

Each action is a separate file. The action type is the top-level key.

**Navigate back:**

```yaml
navigate:
  isNavigateBack: true
  navigateToRootPageOnFailure: true
key: 3xmlbwbu
```

**Navigate to page with params:**

```yaml
navigate:
  allowBack: true
  passedParameters:
    parameterPasses:
      kawias:
        paramIdentifier:
          name: isChange
          key: kawias
        inputValue: {}
    widgetClassNodeKeyRef:
      key: Scaffold_tydsj8ql
  isNavigateBack: false
  pageNodeKeyRef:
    key: Scaffold_tydsj8ql
key: f334uqb4
```

**Validate form:**

```yaml
outputVariableName: validateEmail
validateFormAction:
  formNodeKeyPath:
    keyPath:
      - key: Form_wsu51ee2
key: rpdoow9v
```

**Execute callback (Action parameter):**

```yaml
key: gt91qt34
executeCallbackAction:
  parameterIdentifier:
    name: extendAnalysis
    key: 326n4o
```

---

## 5. Page Parameters (Route Params)

Page parameters are defined in `params` at the top level of the page metadata file. They are passed when navigating to the page.

### Parameter definition schema

```yaml
params:
  <paramKey>:
    identifier:
      name: <paramName>            # human-readable name
      key: <paramKey>              # short hash key
    defaultValue:                  # optional
      serializedValue: <value>
    dataType:
      scalarType: <type>           # String, Integer, Boolean, Document, etc.
      nonNullable: <bool>          # optional, defaults to false
      subType:                     # required for Document type
        collectionIdentifier:
          name: <CollectionName>
          key: <collectionKey>
```

### Referencing a page parameter in a widget

Use `source: WIDGET_CLASS_PARAMETER` in a value expression:

```yaml
textValue:
  variable:
    source: WIDGET_CLASS_PARAMETER
    defaultValue:
      serializedValue: Forgot
    baseVariable:
      widgetClass:
        paramIdentifier:
          name: forhotOrChange
          key: ea1mfx
    nodeKeyRef:
      key: Scaffold_084rppkk       # the page's Scaffold key
  mostRecentInputValue: Forgot     # must match inputValue
```

---

## 6. Page State Fields

State fields are defined in `classModel.stateFields` in the page metadata file. They are mutable local state scoped to the page.

### State field definition

```yaml
classModel:
  stateFields:
    - parameter:
        identifier:
          name: isEntitled
          key: llh25
        defaultValue:
          serializedValue: "false"
        dataType:
          scalarType: Boolean
          nonNullable: true
      serializedDefaultValue:
        - "false"
    - parameter:
        identifier:
          name: selectedDeal
          key: cxtga
        dataType:
          scalarType: Document
          subType:
            collectionIdentifier:
              name: EstablishmentDeals
              key: kynkvveh
```

### Database request managers

Pages can also have `databaseRequestManagers` in their classModel for backend queries:

```yaml
classModel:
  databaseRequestManagers:
    - identifier:
        name: dealsNumber
        key: 92hgj
      originalNodeKeyRef:
        key: Container_jpvj37wl
```

### Updating state from an action

The `localStateUpdate` action type modifies state fields:

```yaml
localStateUpdate:
  updates:
    - fieldIdentifier:
        key: o29r4                 # matches stateField key
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

## 7. File Key Patterns

| Pattern | Purpose |
|---|---|
| `page/id-Scaffold_XXX` | Page metadata (name, params, classModel) |
| `page/id-Scaffold_XXX/page-widget-tree-outline` | Widget tree hierarchy (keys only) |
| `page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Widget_YYY` | Individual widget definition |
| `page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Widget_YYY/trigger_actions/id-ON_TAP` | Action trigger (ON_TAP, ON_INIT_STATE, etc.) |
| `page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Widget_YYY/trigger_actions/id-ON_TAP/action/id-ACTIONKEY` | Individual action in the chain |

### Notes

- **Page metadata is separate from the widget tree.** The `page/id-Scaffold_XXX` file only stores name, params, and classModel. Widget children embedded inline are stripped by the server.
- **Use node-level file keys for targeted edits.** Editing a single widget does not require re-uploading the entire page.
- **Action triggers nest under node files.** The trigger type is the folder name (`id-ON_TAP`, `id-ON_INIT_STATE`, `id-CALLBACK-<key>`).
- **Action chains are separate files.** Each action in a chain has its own file under the trigger's `action/` subdirectory.

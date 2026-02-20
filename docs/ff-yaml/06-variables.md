# Variables and Data Binding

Variables are the data binding mechanism in FlutterFlow YAML. They appear anywhere a widget property or action parameter needs a dynamic value -- text content, colors, visibility conditions, action arguments, and more.

---

## Variable Structure

Every variable follows a universal schema:

```yaml
variable:
  source: SOURCE_TYPE
  baseVariable: { ... }        # Source-specific accessor
  operations: [ ... ]          # Optional chained transformations
  nodeKeyRef: { key: ... }     # Widget/page context reference
  defaultValue:                # Fallback when value is null
    serializedValue: "-"
  uiBuilderValue:              # Preview value shown in UI builder
    serializedValue: "Example"
  actionComponentKeyRef: {}    # Reference when inside action component
```

All fields except `source` are optional depending on context. The `nodeKeyRef` references the containing widget or page scaffold, providing context for where the variable is evaluated.

---

## Variable Sources

### `WIDGET_CLASS_PARAMETER` -- Page/Component Parameter

Accesses a parameter passed to the current page or component.

```yaml
variable:
  source: WIDGET_CLASS_PARAMETER
  defaultValue:
    serializedValue: "-"
  baseVariable:
    widgetClass:
      paramIdentifier:
        name: dealTitle
        key: t8j0tg
  nodeKeyRef:
    key: Container_qsdo2h11
```

| Field | Description |
|---|---|
| `widgetClass.paramIdentifier.name` | Human-readable parameter name |
| `widgetClass.paramIdentifier.key` | Unique parameter key |
| `nodeKeyRef.key` | Key of the widget class (page scaffold or component container) |

### `WIDGET_STATE` -- Widget State Value

Reads the current value of an interactive widget (TextField, RatingBar, etc.).

```yaml
variable:
  source: WIDGET_STATE
  baseVariable:
    widgetState:
      returnParameter:
        allowedDestinationTypes:
          - Integer
          - Double
          - Boolean
          - ImagePath
          - VideoPath
          - AudioPath
        dataType:
          scalarType: String
  nodeKeyRef:
    key: TextField_mxlvp4hj
```

| Field | Description |
|---|---|
| `widgetState.returnParameter.dataType` | Data type the widget returns |
| `widgetState.returnParameter.allowedDestinationTypes` | Compatible type conversions |
| `nodeKeyRef.key` | Key of the widget whose state is being read |

### `LOCAL_STATE` -- Component or App State

Accesses a state variable defined on the component or at the app level.

```yaml
variable:
  source: LOCAL_STATE
  defaultValue:
    serializedValue: "-"
  baseVariable:
    localState:
      fieldIdentifier:
        name: activeSub
        key: y5j8n
      stateVariableType: WIDGET_CLASS_STATE
  nodeKeyRef:
    key: Container_hn5rs9xq
```

| Field | Description |
|---|---|
| `localState.fieldIdentifier.name` | State field name |
| `localState.fieldIdentifier.key` | Unique field key |
| `localState.stateVariableType` | `WIDGET_CLASS_STATE` (component-level) or `APP_STATE` (app-level) |

### `FIREBASE_AUTH_USER` -- Authenticated User Data

Accesses properties of the currently authenticated Firebase user.

```yaml
variable:
  source: FIREBASE_AUTH_USER
  baseVariable:
    auth:
      property: USER_REFERENCE
```

With user document fields:

```yaml
variable:
  source: FIREBASE_AUTH_USER
  baseVariable:
    auth:
      property: USERS_DATA_FIELD
      usersDataField:
        name: zipCode
```

**Available `property` values:**

| Property | Description |
|---|---|
| `EMAIL` | User's email address |
| `DISPLAY_NAME` | User's display name |
| `UID` | Firebase user ID |
| `PHONE_NUMBER` | User's phone number |
| `JWT_TOKEN` | Current JWT auth token |
| `USER_REFERENCE` | Firestore document reference to the user |
| `USERS_DATA_FIELD` | Access a field from the user's Firestore document (requires `usersDataField.name`) |

### `GLOBAL_PROPERTIES` -- System Properties

Accesses platform and runtime properties.

```yaml
variable:
  source: GLOBAL_PROPERTIES
  baseVariable:
    globalProperties:
      property: CURRENT_TIMESTAMP
```

**Available `property` values:**

| Property | Description |
|---|---|
| `CURRENT_TIMESTAMP` | Current date/time |
| `CURRENT_DEVICE_LOCATION` | Device GPS location (LatLng) |
| `IS_IOS` | Whether the device is iOS |

### `ACTION_OUTPUTS` -- Previous Action Result

Reads the output of a previously executed action in the same trigger chain.

```yaml
variable:
  source: ACTION_OUTPUTS
  defaultValue:
    serializedValue: "-"
  baseVariable:
    actionOutput:
      outputVariableIdentifier:
        name: actSub
      actionKeyRef:
        key: dq212dg5
  nodeKeyRef:
    key: Container_62tpyf7s
  actionComponentKeyRef: {}
```

| Field | Description |
|---|---|
| `actionOutput.outputVariableIdentifier.name` | Name matching the producing action's `outputVariableName` |
| `actionOutput.actionKeyRef.key` | Key of the action that produced the output |
| `actionComponentKeyRef.key` | Key of the action component (if output comes from a reusable action block) |

### `FUNCTION_CALL` -- Computed/Conditional Values

Evaluates functions, conditions, string interpolation, code expressions, or custom functions. This is the most versatile source type.

**String interpolation:**

```yaml
variable:
  source: FUNCTION_CALL
  functionCall:
    stringInterpolation: {}
    values:
      - inputValue:
          serializedValue: "An OTP code has been sent to +1 *** **"
      - variable:
          source: FUNCTION_CALL
          functionCall:
            values:
              - variable:
                  source: WIDGET_STATE
                  baseVariable:
                    widgetState:
                      returnParameter:
                        dataType:
                          scalarType: String
                  nodeKeyRef:
                    key: TextField_hci45i6l
            codeExpression:
              arguments:
                - identifier:
                    name: var1
                  dataType:
                    scalarType: String
                    nonNullable: true
              returnParameter:
                dataType:
                  scalarType: String
                  nonNullable: true
              expression: var1.substring(var1.length - 2)
              valid: true
```

**Conditional value (if/else):**

```yaml
variable:
  source: FUNCTION_CALL
  functionCall:
    conditionalValue:
      ifConditionalValues:
        - condition:
            source: FUNCTION_CALL
            functionCall:
              values:
                - variable:
                    source: LOCAL_STATE
                    baseVariable:
                      localState:
                        fieldIdentifier:
                          name: NavBarStatus
                          key: p4n8k8yh
                        stateVariableType: APP_STATE
                - variable:
                    source: ENUMS
                    baseVariable:
                      enumVariable:
                        enumIdentifier:
                          name: NavBar
                          key: qik04
                        enumElementIdentifier:
                          name: profile
                          key: fnvnd
              condition:
                relation: EQUAL_TO
          value:
            inputValue:
              color:
                themeColor: PRIMARY
      elseValue:
        inputValue:
          color:
            value: "4279966491"
      returnParameter:
        dataType:
          scalarType: Color
```

**Custom function call:**

```yaml
variable:
  source: FUNCTION_CALL
  functionCall:
    values:
      - variable:
          source: GLOBAL_PROPERTIES
          baseVariable:
            globalProperties:
              property: CURRENT_DEVICE_LOCATION
      - variable:
          source: FIRESTORE_REQUEST
          baseVariable:
            firestore: {}
          operations:
            - accessDocumentField:
                fieldIdentifier:
                  name: latLon
          nodeKeyRef:
            key: GridView_gi0dnunq
    customFunction:
      name: distanceBetween2PointsMiles
      key: 3thuk
```

### `ENUMS` -- Enum Values

References a specific enum element.

```yaml
variable:
  source: ENUMS
  baseVariable:
    enumVariable:
      enumIdentifier:
        name: subscription
        key: 8a348
      enumElementIdentifier:
        name: monthly
        key: 3lp2p
```

### `DATA_STRUCTS` -- Create Data Struct Inline

Creates a data struct value inline with field values.

```yaml
variable:
  source: DATA_STRUCTS
  baseVariable:
    createDataStruct:
      dataStructIdentifier:
        name: Deal
        key: lpezy
      fields:
        - fieldIdentifier:
            name: Name
            key: htoak
          value:
            variable:
              source: LOCAL_STATE
              baseVariable:
                localState:
                  fieldIdentifier:
                    name: selectedDeal
                    key: cxtga
                  stateVariableType: WIDGET_CLASS_STATE
              operations:
                - accessDocumentField:
                    fieldIdentifier:
                      name: Name
              nodeKeyRef:
                key: Scaffold_4qdr9nq8
```

### `CONSTANTS` -- Literal Constants

References built-in constant values.

```yaml
variable:
  source: CONSTANTS
  baseVariable:
    constants:
      value: EMPTY_STRING
```

### `GENERATOR_VARIABLE` -- List Item Variable

Accesses the current item in a generated list (ListView, GridView). Only valid inside widgets that iterate over a data source.

```yaml
variable:
  source: GENERATOR_VARIABLE
  baseVariable:
    generatorVariable: {}
  operations:
    - accessDocumentField:
        fieldIdentifier:
          name: Name
  nodeKeyRef:
    key: ListView_8lh3xfe2
```

### `FIRESTORE_REQUEST` -- Backend Query Result

References data from a Firestore query bound to a widget (via `databaseRequest` on the widget node).

```yaml
variable:
  source: FIRESTORE_REQUEST
  baseVariable:
    firestore: {}
  operations:
    - accessDocumentField:
        fieldIdentifier:
          name: latLon
  nodeKeyRef:
    key: GridView_gi0dnunq
```

### `LIST_MAP` -- List Map Variable

Used inside list operations to reference the current item during mapping/filtering.

```yaml
variable:
  source: LIST_MAP
  baseVariable:
    listMap:
      containingParentReturnParameter:
        dataType:
          listType:
            scalarType: Document
          subType:
            collectionIdentifier:
              name: RedeemedUserDeals
              key: lzo3gj3d
  operations:
    - accessDocumentField:
        fieldIdentifier:
          name: Deal
```

### `FIREBASE_REMOTE_CONFIG` -- Remote Config Values

Reads Firebase Remote Config fields.

```yaml
variable:
  source: FIREBASE_REMOTE_CONFIG
  baseVariable:
    firebaseRemoteConfig:
      fieldIdentifier:
        name: newiOSVersion
```

---

## Operations

Operations are chained transformations applied to a variable value. They are evaluated in order, each transforming the result of the previous.

### `accessDocumentField` -- Access Document Field

Reads a field from a Firestore document.

```yaml
operations:
  - accessDocumentField:
      fieldIdentifier:
        name: Name
```

Access the document reference itself:

```yaml
operations:
  - accessDocumentField:
      documentProperty: REFERENCE
```

### `accessDataStructField` -- Access Data Struct Field

Reads a field from a custom data struct.

```yaml
operations:
  - accessDataStructField:
      fieldIdentifier:
        name: nextBillingDate
        key: "14e46"
```

### `listItemAtIndex` -- Access List Item

Gets a specific item from a list by position.

```yaml
operations:
  - listItemAtIndex:
      type: FIRST
      index:
        inputValue:
          serializedValue: "0"
```

| `type` value | Description |
|---|---|
| `FIRST` | First item in the list |
| `LAST` | Last item in the list |
| (index only) | Item at the specified index |

### `numberFormat` -- Format Number

Formats a numeric value as a string.

```yaml
operations:
  - numberFormat:
      formatType: CUSTOM
      customFormat: "###.#"
```

With currency formatting:

```yaml
operations:
  - numberFormat:
      formatType: CUSTOM
      isCurrency: true
      currencySymbol: $
      customFormat: "#,##0.##"
```

### `dateTimeFormat` -- Format Date/Time

Formats a DateTime value as a string.

```yaml
operations:
  - dateTimeFormat:
      format: yMd
      isCustom: false
```

### `listWhereOperation` -- Filter a List

Filters a list based on a condition.

```yaml
operations:
  - listWhereOperation:
      conditionVariable:
        source: FUNCTION_CALL
        functionCall:
          values:
            - variable:
                source: LIST_MAP
                baseVariable:
                  listMap:
                    containingParentReturnParameter:
                      dataType:
                        listType:
                          scalarType: Document
                operations:
                  - accessDocumentField:
                      fieldIdentifier:
                        name: DealRef
            - variable:
                source: GENERATOR_VARIABLE
                baseVariable:
                  generatorVariable: {}
                operations:
                  - accessDocumentField:
                      documentProperty: REFERENCE
          condition:
            relation: EQUAL_TO
```

### `listSortOperation` -- Sort a List

Sorts a list by a key field.

```yaml
operations:
  - listSortOperation:
      sortKey:
        source: LIST_MAP
        baseVariable:
          listMap:
            containingParentReturnParameter:
              dataType:
                listType:
                  scalarType: Document
        operations:
          - accessDocumentField:
              fieldIdentifier:
                name: RedeemedAt
      isDescending: true
```

### `listMapOperation` -- Map Over a List

Transforms each item in a list.

```yaml
operations:
  - listMapOperation:
      listMapVariable:
        source: LIST_MAP
        baseVariable:
          listMap:
            containingParentReturnParameter:
              dataType:
                listType:
                  scalarType: Document
        operations:
          - accessDocumentField:
              fieldIdentifier:
                name: Deal
          - accessDataStructField:
              fieldIdentifier:
                name: Value
                key: tij66
```

### Chaining Multiple Operations

Operations are applied left to right. This example accesses a struct field, then formats the date:

```yaml
operations:
  - accessDataStructField:
      fieldIdentifier:
        name: nextBillingDate
        key: "14e46"
  - dateTimeFormat:
      format: yMd
      isCustom: false
```

This example sorts a list, takes the first item, then accesses a field:

```yaml
operations:
  - listSortOperation:
      sortKey: { ... }
      isDescending: true
  - listItemAtIndex:
      type: FIRST
      index:
        inputValue:
          serializedValue: "0"
  - accessDocumentField:
      fieldIdentifier:
        name: RedeemedAt
```

---

## Condition Patterns

Conditions use `FUNCTION_CALL` with a `condition` block to compare values.

### Comparison

```yaml
variable:
  source: FUNCTION_CALL
  functionCall:
    values:
      - variable:
          source: LOCAL_STATE
          baseVariable:
            localState:
              fieldIdentifier:
                name: NavBarStatus
                key: p4n8k8yh
              stateVariableType: APP_STATE
      - variable:
          source: ENUMS
          baseVariable:
            enumVariable:
              enumIdentifier:
                name: NavBar
                key: qik04
              enumElementIdentifier:
                name: profile
                key: fnvnd
    condition:
      relation: EQUAL_TO
```

### Existence Check

```yaml
functionCall:
  values:
    - variable:
        source: WIDGET_STATE
        baseVariable:
          widgetState:
            returnParameter:
              dataType:
                scalarType: String
        nodeKeyRef:
          key: TextField_h9mnfddk
    - {}
  condition:
    relation: EXISTS_AND_NON_EMPTY
```

### Null/Empty Check

```yaml
functionCall:
  values:
    - variable:
        source: FIREBASE_AUTH_USER
        baseVariable:
          auth:
            property: USERS_DATA_FIELD
            usersDataField:
              name: push_notifications
    - inputValue: {}
  condition:
    relation: DOES_NOT_EXIST_OR_IS_EMPTY
```

### Available Condition Relations

| Relation | Description |
|---|---|
| `EQUAL_TO` | Values are equal |
| `NOT_EQUAL_TO` | Values are not equal |
| `GREATER_THAN` | Left value is greater |
| `LESS_THAN` | Left value is less |
| `GREATER_THAN_OR_EQUAL` | Left value is greater or equal |
| `LESS_THAN_OR_EQUAL` | Left value is less or equal |
| `EXISTS_AND_NON_EMPTY` | Value exists and is not empty |
| `DOES_NOT_EXIST_OR_IS_EMPTY` | Value is null, missing, or empty |

### Conditional Values (If/Else)

Used to compute a value based on conditions (not for control flow -- for that, see `conditionActions` in the Actions guide):

```yaml
functionCall:
  conditionalValue:
    ifConditionalValues:
      - condition:
          source: GLOBAL_PROPERTIES
          baseVariable:
            globalProperties:
              property: IS_IOS
        value:
          variable:
            source: FIREBASE_REMOTE_CONFIG
            baseVariable:
              firebaseRemoteConfig:
                fieldIdentifier:
                  name: newiOSVersion
    elseValue:
      variable:
        source: FIREBASE_REMOTE_CONFIG
        baseVariable:
          firebaseRemoteConfig:
            fieldIdentifier:
              name: newAndroidVersion
    returnParameter:
      dataType:
        scalarType: String
        nonNullable: true
```

---

## Code Expressions

Inline Dart expressions can be used inside `FUNCTION_CALL` for string manipulation and computation:

```yaml
functionCall:
  values:
    - variable:
        source: WIDGET_STATE
        baseVariable:
          widgetState:
            returnParameter:
              dataType:
                scalarType: String
        nodeKeyRef:
          key: TextField_hci45i6l
  codeExpression:
    arguments:
      - identifier:
          name: phone
        dataType:
          scalarType: String
          nonNullable: true
    returnParameter:
      dataType:
        scalarType: String
        nonNullable: true
    expression: "phone.replaceAll(RegExp(r'[-()\\s]'),\"\")"
    valid: true
```

| Field | Description |
|---|---|
| `arguments` | Named parameters with types, mapped to `values` in order |
| `returnParameter.dataType` | Return type of the expression |
| `expression` | Dart expression string |
| `valid` | Whether the expression has been validated |

---

## Value Patterns Summary

Values can appear in three forms across the YAML:

**Literal value:**
```yaml
inputValue:
  serializedValue: "hello"
mostRecentInputValue:
  serializedValue: "hello"    # Must match inputValue
```

**Variable binding:**
```yaml
variable:
  source: WIDGET_CLASS_PARAMETER
  baseVariable:
    widgetClass:
      paramIdentifier:
        name: title
        key: abc123
  nodeKeyRef:
    key: Container_xyz
```

**Color values use a special format:**
```yaml
inputValue:
  color:
    themeColor: PRIMARY        # Theme color reference
```
```yaml
inputValue:
  color:
    value: "4294967295"        # ARGB integer as string
```

**Translatable text (i18n):**

Used when passing a string that should be translated at runtime based on the app's locale. Wraps `translationIdentifier` and `textValue` inside `inputValue.translatableText`. Commonly used in component parameter passes to make per-instance text translatable.

```yaml
inputValue:
  translatableText:
    translationIdentifier:
      key: ms01ttl1            # References languages/translation/id-ms01ttl1
    textValue:
      inputValue: Histamine / Low DAO   # English default
```

Each key must have a corresponding translation file at `languages/translation/id-<key>` with entries for all supported languages. See `01-project-files.md` for the translation file schema.

The `mostRecentInputValue` field must always stay in sync with `inputValue` when both are present.

# Custom Code

FlutterFlow supports four types of custom code: **Custom Actions** (async Dart functions with side effects), **Custom Functions** (pure synchronous Dart functions), **Custom Widgets** (Flutter widgets with parameters), and **AI Agents** (LLM-powered processing pipelines). Additionally, **App Action Components** provide reusable action chains that can be invoked from any page.

---

## Custom Actions

Custom Actions are async Dart functions that can perform side effects (network calls, database writes, navigation, etc.). Each action has a YAML definition file and a companion Dart code file.

### File layout

```
custom-actions/
  id-2qajc.yaml              # Action definition (metadata, arguments, return type)
  id-2qajc/
    action-code.dart.yaml     # Dart implementation code
```

### YAML definition

```yaml
identifier:
  name: getSymptomsForDay
  key: 2qajc
arguments:
  - identifier:
      name: date
      key: m0t714
    dataType:
      scalarType: DateTime
      nonNullable: true
returnParameter:
  identifier:
    key: taftyf
  dataType:
    listType:
      scalarType: String
    nonNullable: true
includeContext: false
description: ""
```

### Definition fields

| Field | Required | Description |
|-------|----------|-------------|
| `identifier` | Yes | `name` (function name in Dart) and `key` (unique ID) |
| `arguments` | No | List of typed parameters passed to the action |
| `returnParameter` | No | Return type definition. Omit for void actions |
| `includeContext` | Yes | Whether `BuildContext` is passed as the first argument |
| `description` | No | Human-readable description |

### Arguments format

Each argument has:

```yaml
arguments:
  - identifier:
      name: email              # Parameter name in Dart
      key: 46tdix              # Unique key
    dataType:
      scalarType: String       # Type (any scalar type)
      nonNullable: true        # Whether the parameter is required
```

### Return parameter

The return parameter defines the action's return type:

```yaml
returnParameter:
  identifier:
    key: taftyf                # Unique key for the return value
  dataType:
    listType:
      scalarType: String       # Can be scalar, list, or complex type
    nonNullable: true
```

### Dart code file

The companion file at `id-<key>/action-code.dart.yaml` contains the raw Dart implementation. The function signature matches the YAML definition:

```dart
Future<List<String>> getSymptomsForDay(DateTime date) async {
  try {
    final userId = SupaFlow.client.auth.currentUser?.id;
    if (userId == null) {
      return [];
    }

    final dateStr =
        '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

    final response = await SupaFlow.client
        .from('symptoms')
        .select('name')
        .eq('user_id', userId)
        .eq('date', dateStr);

    final List<dynamic> data = response ?? [];
    final List<String> symptoms = [];

    for (var row in data) {
      if (row is Map<String, dynamic>) {
        final name = row['name']?.toString();
        if (name != null && name.isNotEmpty) {
          symptoms.add(name);
        }
      }
    }

    return symptoms;
  } catch (e) {
    print('Error fetching symptoms for day: $e');
    return [];
  }
}
```

### Minimal action (no arguments, no return)

An action can have no arguments and no return value:

```yaml
identifier:
  name: revCatLogout
  key: 97vdi
includeContext: false
description: ""
```

### Action with BuildContext

When `includeContext: true`, the Dart function receives `BuildContext` as its first parameter, enabling navigation, showing dialogs, and accessing inherited widgets:

```yaml
identifier:
  name: selectMediaWithSourceBottomSheetCustom
  key: ho9d3
returnParameter:
  identifier:
    key: gquf0a
  dataType:
    scalarType: UploadedFile
    nonNullable: false
includeContext: true
description: ""
```

---

## Custom Functions

Custom Functions are pure, synchronous Dart functions with no side effects. They are used for data transformation, formatting, and computation. Like actions, each function has a YAML definition and a Dart code file.

### File layout

```
custom-functions/
  id-006vd.yaml                # Function definition
  id-006vd/
    function-code.dart.yaml    # Dart implementation code
```

### YAML definition

```yaml
identifier:
  name: getDateOnly
  key: 006vd
arguments:
  - identifier:
      name: fullDateTime
      key: zebhey
    dataType:
      scalarType: DateTime
      nonNullable: false
returnParameter:
  dataType:
    scalarType: DateTime
    nonNullable: false
```

### Key differences from Custom Actions

| Aspect | Custom Actions | Custom Functions |
|--------|---------------|-----------------|
| Async | Yes (`Future<T>`) | No (synchronous) |
| Side effects | Allowed | Not allowed (pure) |
| `includeContext` | Available | Not available |
| Dart code file | `action-code.dart.yaml` | `function-code.dart.yaml` |
| Return type identifier | Has `identifier.key` | No identifier on return |
| Use case | API calls, DB writes, navigation | Data transforms, formatting |

### Return parameter (functions vs actions)

Functions have a simpler `returnParameter` without an `identifier` block:

```yaml
# Custom Function return (no identifier)
returnParameter:
  dataType:
    scalarType: DateTime
    nonNullable: false

# Custom Action return (has identifier with key)
returnParameter:
  identifier:
    key: taftyf
  dataType:
    listType:
      scalarType: String
    nonNullable: true
```

### Dart code file

The function code at `id-<key>/function-code.dart.yaml` contains only the function body (no signature wrapper):

```dart

  if (fullDateTime == null) {
    return null;
  }

  return DateTime(
    fullDateTime.year,
    fullDateTime.month,
    fullDateTime.day,
  );
```

Note: The function signature is generated from the YAML definition. The code file contains only the body.

### Special scalar types in functions

Functions can use Supabase-specific types via `subType`:

```yaml
identifier:
  name: supabaseRowAsString
  key: 1y1zx
arguments:
  - identifier:
      name: row
      key: vy5lc3
    dataType:
      scalarType: PostgresRow
      nonNullable: true
      subType:
        tableIdentifier:
          name: food
returnParameter:
  dataType:
    scalarType: String
    nonNullable: true
description: // Convert all values to strings and join with commas
```

The `PostgresRow` scalar type uses `subType.tableIdentifier` to specify which Supabase table the row comes from.

### List arguments and returns

Functions can accept and return lists:

```yaml
identifier:
  name: getFlexes
  key: puab3
arguments:
  - identifier:
      name: ts
      key: u4k7gx
    dataType:
      listType:
        scalarType: Integer
      nonNullable: true
returnParameter:
  dataType:
    listType:
      scalarType: Integer
    nonNullable: true
```

### Test definitions

Functions can include test cases for the FlutterFlow test runner:

```yaml
identifier:
  name: getIngredientsAsJson
  key: 489er
arguments:
  - identifier:
      name: ingredients
      key: x6twxl
    dataType:
      listType:
        scalarType: String
      nonNullable: false
returnParameter:
  dataType:
    scalarType: JSON
tests:
  - parameterValues:
      values:
        x6twxl: "[\"apple\",\"sugar\",\"water\"]"
```

Each test entry contains `parameterValues.values` mapping argument keys to serialized test values.

---

## Custom Widgets

Custom Widgets are Flutter widgets defined with typed parameters. They live under `custom-widgets/id-<key>.yaml`.

### YAML definition

```yaml
identifier:
  name: SmartDateXAxis
  key: exs5d
parameters:
  - identifier:
      name: dimensions
      key: k4tdyl
    dataType:
      scalarType: WidgetProperty
      subType:
        widgetPropertyType: DIMENSIONS
  - identifier:
      name: timestamps
      key: g66qo8
    dataType:
      listType:
        scalarType: Integer
      nonNullable: true
  - identifier:
      name: maxLabels
      key: c1b1qp
    dataType:
      scalarType: Integer
      nonNullable: true
description: ""
```

### Parameters

Widget parameters use the same `dataType` system as other definitions, plus widget-specific types:

| Type | Description |
|------|-------------|
| `WidgetProperty` with `widgetPropertyType: DIMENSIONS` | Width/height constraints from the parent |
| `Action` | Callback that triggers a FlutterFlow action chain |
| Standard scalars | `String`, `Integer`, `Boolean`, `DateTime`, `Double`, etc. |
| List types | `listType` with any scalar |

### Callback parameters with nested params

The `Action` scalar type supports `nestedParams` -- values that the widget passes back to the action chain when the callback fires:

```yaml
identifier:
  name: VerticalCalendar
  key: 7svm8
parameters:
  - identifier:
      name: dimensions
      key: 5f7c90
    dataType:
      scalarType: WidgetProperty
      nonNullable: true
      subType:
        widgetPropertyType: DIMENSIONS
  - identifier:
      name: startDate
      key: bw48jf
    dataType:
      scalarType: DateTime
      nonNullable: true
  - identifier:
      name: endDate
      key: 0u8o42
    dataType:
      scalarType: DateTime
      nonNullable: true
  - identifier:
      name: onAddButtonTapped
      key: bins86
    dataType:
      scalarType: Action
      nonNullable: true
      nestedParams:
        - identifier:
            name: date
            key: rr2oy1
          dataType:
            scalarType: DateTime
            nonNullable: true
        - identifier:
            name: symptoms
            key: 0fkgnr
          dataType:
            listType:
              scalarType: String
            nonNullable: true
  - identifier:
      name: onSymptomTapped
      key: oxwyhs
    dataType:
      scalarType: Action
      nonNullable: false
      nestedParams:
        - identifier:
            name: symptomName
          dataType:
            scalarType: String
            nonNullable: true
        - identifier:
            name: date
            key: 1nn0ds
          dataType:
            scalarType: DateTime
            nonNullable: true
previewValues: {}
description: ""
```

### Nested params structure

Each nested param in an `Action` callback:

| Property | Required | Description |
|----------|----------|-------------|
| `identifier.name` | Yes | Parameter name passed back from the widget |
| `identifier.key` | No | Unique key (sometimes omitted) |
| `dataType` | Yes | Type of the passed-back value |

These nested params are available in the FlutterFlow action editor as callback outputs when wiring up the widget's action.

---

## AI Agents

AI Agents define LLM-powered processing pipelines. They live under `agent/id-<key>.yaml`.

### YAML definition

```yaml
status: LIVE
identifier:
  name: correlatorFoodSymptoms
  key: pb2xn
name: CorrelatorFoodSymptoms
description: Correlates food with symptoms.
aiModel:
  provider: GOOGLE
  model: gemini-2.0-flash
  parameters:
    temperature:
      inputValue: 1
    maxTokens:
      inputValue: 8192
    topP:
      inputValue: 0.95
  messages:
    - role: SYSTEM
      text: "Act as an expert in nutrition..."
requestOptions:
  requestTypes:
    - PLAINTEXT
responseOptions:
  responseType: JSON
```

### Top-level fields

| Field | Required | Description |
|-------|----------|-------------|
| `status` | Yes | `LIVE` or `DRAFT` |
| `identifier` | Yes | Internal `name` and `key` |
| `name` | Yes | Display name for the agent |
| `description` | Yes | Human-readable description |
| `aiModel` | Yes | Model configuration block |
| `requestOptions` | Yes | Accepted input types |
| `responseOptions` | Yes | Expected output format |

### AI model configuration

```yaml
aiModel:
  provider: GOOGLE                   # Provider: GOOGLE, OPENAI, ANTHROPIC
  model: gemini-2.0-flash            # Specific model identifier
  parameters:
    temperature:
      inputValue: 1                  # Creativity (0-2)
    maxTokens:
      inputValue: 8192              # Maximum response tokens
    topP:
      inputValue: 0.95              # Nucleus sampling
  messages:
    - role: SYSTEM                   # SYSTEM or USER
      text: "System prompt text..."
```

### Request options

Defines what input types the agent accepts:

```yaml
requestOptions:
  requestTypes:
    - PLAINTEXT          # Accept text input
    - IMAGE              # Accept image input
```

### Response options

Defines the expected output format:

```yaml
responseOptions:
  responseType: JSON     # JSON or PLAINTEXT
```

### Multi-modal agent example

An agent that accepts both text and image input:

```yaml
status: LIVE
identifier:
  name: ingredientsExtractor
  key: ysf2z
name: Ingredients extractor
description: "Extracts ingredients from a photo."
aiModel:
  provider: GOOGLE
  model: gemini-2.0-flash
  parameters:
    temperature:
      inputValue: 1
    maxTokens:
      inputValue: 8192
    topP:
      inputValue: 0.95
  messages:
    - role: SYSTEM
      text: "Act as an ingredients extractor..."
requestOptions:
  requestTypes:
    - PLAINTEXT
    - IMAGE
responseOptions:
  responseType: JSON
```

---

## App Action Components

App Action Components are reusable action chains that can be invoked from any page or component. They live under `app-action-components/id-<key>.yaml`.

### YAML definition

```yaml
identifier:
  name: checkUpdateBlock
  key: ld3jo3
actions:
  rootAction:
    key: dmm3dw7g
    action:
      customAction:
        customActionIdentifier:
          name: checkAppUpdateStatus
          key: zjg1l
        argumentValues:
          arguments:
            fr6rim:
              value:
                variable:
                  source: FIREBASE_AUTH_USER
                  baseVariable:
                    auth:
                      property: USERS_DATA_FIELD
                      usersDataField:
                        name: app_version
            wmmt5g:
              value:
                variable:
                  source: FUNCTION_CALL
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
                        identifier:
                          name: newVersion
                          key: wmmt5g
                        dataType:
                          scalarType: String
                          nonNullable: true
      outputVariableName: updateState
      key: 00tn7yxo
    followUpAction:
      key: isp97zrh
      conditionActions:
        trueActions:
          - condition:
              # ... condition checking action output against enum value
            trueAction:
              key: g4iwdyck
              action:
                alertDialog:
                  customDialog:
                    passedParameters:
                      parameterPasses:
                        3p0j01:
                          paramIdentifier:
                            name: showIgnore
                            key: 3p0j01
                          inputValue:
                            serializedValue: "false"
                      widgetClassNodeKeyRef:
                        key: Container_gtqk3kbu
                    dimensions:
                      width:
                        percentOfScreenSizeValue:
                          inputValue: 80
                    nonDismissible: true
                    isGlobal: true
description: ""
```

### Structure

| Field | Required | Description |
|-------|----------|-------------|
| `identifier` | Yes | `name` and `key` for the reusable action |
| `actions.rootAction` | Yes | The first action in the chain |
| `actions.rootAction.followUpAction` | No | Chained actions after the root |
| `description` | No | Human-readable description |

### Action chain pattern

App Action Components follow the same action chain pattern used in page actions:

1. **`rootAction`** -- The entry point action, typically a `customAction` call or built-in action
2. **`outputVariableName`** -- Stores the action's return value for use in follow-up conditions
3. **`followUpAction`** -- Conditional or sequential actions that run after the root

### Variable sources used in action components

Action components can reference values from many sources:

| Source | Description | Example |
|--------|-------------|---------|
| `FIREBASE_AUTH_USER` | Authenticated user data | `auth.property: USERS_DATA_FIELD` |
| `FIREBASE_REMOTE_CONFIG` | Remote config values | `firebaseRemoteConfig.fieldIdentifier.name` |
| `GLOBAL_PROPERTIES` | Platform checks | `globalProperties.property: IS_IOS` |
| `ACTION_OUTPUTS` | Previous action results | `actionOutput.outputVariableIdentifier` |
| `ENUMS` | Enum value references | `enumVariable.enumIdentifier` |
| `FUNCTION_CALL` | Inline function evaluation | `functionCall.conditionalValue` |

### Referencing action components from pages

Action components are referenced by their `key` when invoked. The output of a root action within a component is accessed via `actionComponentKeyRef`:

```yaml
variable:
  source: ACTION_OUTPUTS
  baseVariable:
    actionOutput:
      outputVariableIdentifier:
        name: updateState
      actionKeyRef:
        key: 00tn7yxo
  actionComponentKeyRef:
    key: ld3jo3                  # References the app action component
```

---

## File Key Patterns Summary

| Code type | Definition file | Code file | Directory |
|-----------|----------------|-----------|-----------|
| Custom Action | `custom-actions/id-<key>.yaml` | `custom-actions/id-<key>/action-code.dart.yaml` | `custom-actions/` |
| Custom Function | `custom-functions/id-<key>.yaml` | `custom-functions/id-<key>/function-code.dart.yaml` | `custom-functions/` |
| Custom Widget | `custom-widgets/id-<key>.yaml` | (code embedded or separate) | `custom-widgets/` |
| AI Agent | `agent/id-<key>.yaml` | N/A (no code file) | `agent/` |
| App Action Component | `app-action-components/id-<key>.yaml` | N/A (actions are inline) | `app-action-components/` |

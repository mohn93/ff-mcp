# Actions

Actions define the behavior triggered by user interactions or lifecycle events in FlutterFlow. Each action is stored as an individual YAML file inside a widget node's `trigger_actions/` directory.

---

## File Location Pattern

Actions follow a strict directory hierarchy:

```
page/id-Scaffold_{id}/
  page-widget-tree-outline/
    node/id-{Widget}_{id}/
      trigger_actions/
        id-{TRIGGER_TYPE}/          # Trigger YAML file (orchestrator)
          action/
            id-{actionKey}.yaml     # Individual action files
```

For components the path mirrors pages:

```
component/id-Container_{id}/
  component-widget-tree-outline/
    node/id-{Widget}_{id}/
      trigger_actions/
        id-{TRIGGER_TYPE}/
          action/
            id-{actionKey}.yaml
```

Each trigger directory contains:
- A **trigger YAML file** (`id-ON_TAP.yaml`) that defines the `rootAction` tree -- the execution order, conditional branching, and references to action keys
- An **`action/` subdirectory** with one YAML file per action, each keyed by its unique action ID

---

## Trigger Types

| Trigger | Directory Name | When It Fires |
|---|---|---|
| `ON_TAP` | `id-ON_TAP` | Widget tapped |
| `ON_INIT_STATE` | `id-ON_INIT_STATE` | Page or component initializes |
| `ON_TEXTFIELD_CHANGE` | `id-ON_TEXTFIELD_CHANGE` | TextField value changes |
| `ON_TOGGLE_ON` | `id-ON_TOGGLE_ON` | Switch/toggle turned on |
| `ON_TOGGLE_OFF` | `id-ON_TOGGLE_OFF` | Switch/toggle turned off |
| `ON_LONG_PRESS` | `id-ON_LONG_PRESS` | Widget long-pressed |
| `ON_TIMER_END` | `id-ON_TIMER_END` | Timer widget completes |
| `CALLBACK-{id}` | `id-CALLBACK-{id}` | Named callback from parent component |

---

## Trigger YAML Structure

The trigger file (`id-ON_TAP.yaml`) defines execution order using a `rootAction` tree. Each node in the tree references action files by `key`:

```yaml
rootAction:
  key: 5ycxygcz
  action:
    key: qsw0br81          # References action/id-qsw0br81.yaml
  followUpAction:
    key: jmvd96i3
    action:
      key: 54wwjscn        # Next action in sequence
trigger:
  triggerType: ON_TAP
```

Simple trigger (single action, no chaining):

```yaml
rootAction:
  key: 2xwagsw6
  action:
    key: 2b2dwjgo
trigger:
  triggerType: ON_TAP
```

---

## Action Types

### `navigate` -- Navigate to Page

Navigates to another page, optionally passing parameters.

```yaml
navigate:
  allowBack: true
  replaceRoute: false
  isNavigateBack: false
  pageNodeKeyRef:
    key: Scaffold_r4acaui6
  passedParameters:
    parameterPasses:
      xd2r1k:
        paramIdentifier:
          name: establishment
          key: xd2r1k
        variable:
          source: WIDGET_CLASS_PARAMETER
          baseVariable:
            widgetClass:
              paramIdentifier:
                name: estableshment
                key: 974ngd
          nodeKeyRef:
            key: Container_qsdo2h11
    widgetClassNodeKeyRef:
      key: Scaffold_r4acaui6
key: udyk1rjj
```

| Field | Type | Description |
|---|---|---|
| `allowBack` | boolean | Whether back navigation is allowed |
| `replaceRoute` | boolean | Replace current route instead of push |
| `isNavigateBack` | boolean | Navigate back (pop) instead of forward |
| `pageNodeKeyRef.key` | string | Scaffold key of the target page |
| `passedParameters.parameterPasses` | map | Parameters passed to the target page |

### `localStateUpdate` -- Update Widget or App State

Updates one or more state variables.

```yaml
localStateUpdate:
  updates:
    - fieldIdentifier:
        key: gdgw8
      setValue:
        inputValue:
          serializedValue: "1"
    - fieldIdentifier:
        key: ty6re
      setValue:
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
  updateType: WIDGET
  stateVariableType: WIDGET_CLASS_STATE
key: ebx7vt69
```

| Field | Type | Description |
|---|---|---|
| `updates` | list | Fields to update |
| `updates[].fieldIdentifier.key` | string | Key of the state field |
| `updates[].setValue` | value | New value (literal `inputValue` or `variable`) |
| `updates[].clearValue` | `{}` | Clear the field instead of setting |
| `updateType` | enum | `WIDGET` for component state |
| `stateVariableType` | enum | `WIDGET_CLASS_STATE` or `APP_STATE` |

### `database.firestoreQuery` -- Firestore Query

Queries a Firestore collection with filters.

```yaml
database:
  firestoreQuery:
    collectionIdentifier:
      name: stripe_customer_subscriptions
      key: 94977h9r
    hideOnEmpty: false
    singleTimeQuery: true
    where:
      filters:
        - baseFilter:
            collectionFieldIdentifier:
              name: customer_phone
            relation: EQUAL_TO
            variable:
              source: FIREBASE_AUTH_USER
              baseVariable:
                auth:
                  property: PHONE_NUMBER
        - baseFilter:
            collectionFieldIdentifier:
              name: expiration_date
            relation: GREATER_THAN
            variable:
              source: GLOBAL_PROPERTIES
              baseVariable:
                globalProperties:
                  property: CURRENT_TIMESTAMP
      isAnd: true
  returnParameter:
    dataType:
      listType:
        scalarType: Document
      subType:
        collectionIdentifier:
          name: stripe_customer_subscriptions
          key: 94977h9r
outputVariableName: subscribedUser
key: 30vd1j0o
```

| Field | Type | Description |
|---|---|---|
| `collectionIdentifier` | name+key | Target Firestore collection |
| `singleTimeQuery` | boolean | Query once (not a stream) |
| `where.filters` | list | Filter conditions |
| `where.filters[].baseFilter.relation` | enum | `EQUAL_TO`, `GREATER_THAN`, etc. |
| `where.isAnd` | boolean | AND vs OR filters |
| `outputVariableName` | string | Name for the action output variable |
| `returnParameter.dataType` | type | Return type (usually `listType: Document`) |

### `database.createDocument` -- Create Firestore Document

Creates a new document in a Firestore collection.

```yaml
database:
  createDocument:
    collectionIdentifier:
      name: RedeemedUserDeals
      key: lzo3gj3d
    write:
      updates:
        UserRef:
          fieldIdentifier:
            name: UserRef
          variable:
            source: FIREBASE_AUTH_USER
            baseVariable:
              auth:
                property: USER_REFERENCE
        RedeemedAt:
          fieldIdentifier:
            name: RedeemedAt
          variable:
            source: GLOBAL_PROPERTIES
            baseVariable:
              globalProperties:
                property: CURRENT_TIMESTAMP
    parentReference:
      source: WIDGET_CLASS_PARAMETER
      baseVariable:
        widgetClass:
          paramIdentifier:
            name: establishment
            key: u32pu8
      nodeKeyRef:
        key: Container_p61gj0ld
key: u00ieh05
```

| Field | Type | Description |
|---|---|---|
| `collectionIdentifier` | name+key | Target collection |
| `write.updates` | map | Field name to value mappings |
| `write.updates.{field}.fieldIdentifier.name` | string | Firestore field name |
| `write.updates.{field}.inputValue` | value | Literal value |
| `write.updates.{field}.variable` | variable | Dynamic value |
| `write.updates.{field}.dataStructFieldUpdate` | object | Nested data struct value |
| `parentReference` | variable | Parent document reference (for subcollections) |

### `database.updateDocument` -- Update Firestore Document

Updates fields on an existing document.

```yaml
database:
  updateDocument:
    write:
      updates:
        push_notifications:
          fieldIdentifier:
            name: push_notifications
          inputValue:
            serializedValue: "true"
    reference:
      source: FIREBASE_AUTH_USER
      baseVariable:
        auth:
          property: USER_REFERENCE
key: 2d5pxkrp
```

| Field | Type | Description |
|---|---|---|
| `write.updates` | map | Fields to update |
| `reference` | variable | Document reference to update |

### `database.apiCall` -- Call API Endpoint

Calls a configured API endpoint.

```yaml
database:
  apiCall:
    endpointIdentifier:
      name: SendDiscountEmail
      key: qegob
    variables:
      - variableIdentifier:
          name: token
          key: b7vj02x7
        variable:
          source: FIREBASE_AUTH_USER
          baseVariable:
            auth:
              property: JWT_TOKEN
outputVariableName: apiResultrla
key: km9eei8s
```

| Field | Type | Description |
|---|---|---|
| `endpointIdentifier` | name+key | API endpoint identifier |
| `variables` | list | API call parameters |
| `outputVariableName` | string | Name for the response output |

### `customAction` -- Execute Custom Action

Calls a custom Dart function.

```yaml
customAction:
  customActionIdentifier:
    name: linkAnonymousUser
    key: nujdl
  argumentValues:
    arguments:
      snaq9d:
        value:
          variable:
            source: WIDGET_STATE
            baseVariable:
              widgetState:
                returnParameter:
                  dataType:
                    scalarType: String
            nodeKeyRef:
              key: TextField_mxlvp4hj
outputVariableName: linkUserResult
key: ww6ook8u
```

| Field | Type | Description |
|---|---|---|
| `customActionIdentifier` | name+key | Custom action reference |
| `argumentValues.arguments` | map | Argument key to value mappings |
| `outputVariableName` | string | Name for the return value |

### `snackBar` -- Show Snack Bar Notification

Displays a snack bar message.

```yaml
snackBar:
  textMessage:
    inputValue:
      serializedValue: Code sent!
  textStyle:
    variableColor:
      inputValue:
        color:
          themeColor: PRIMARY_TEXT
  durationMillis: 4000
  subAction:
    action:
      navigate:
        allowBack: true
  shouldHidePreviousSnackbar: false
  backgroundColor:
    inputValue:
      color:
        themeColor: PRIMARY
key: 72bzwegp
```

The `textMessage` can also use a `variable` for dynamic text (string interpolation, etc.) instead of a literal `inputValue`.

| Field | Type | Description |
|---|---|---|
| `textMessage` | value | Message text (literal or variable) |
| `durationMillis` | integer | Display duration in milliseconds |
| `backgroundColor` | color | Background color |
| `textStyle.variableColor` | color | Text color |
| `shouldHidePreviousSnackbar` | boolean | Dismiss existing snack bar first |
| `subAction` | action | Action to execute when snack bar is tapped |

### `revenueCat.paywall` -- Show RevenueCat Paywall

Displays the RevenueCat paywall for a given entitlement.

```yaml
revenueCat:
  paywall:
    entitlementId:
      inputValue:
        serializedValue: Pro
key: erd8m4q2
```

### `revenueCat.restore` -- Restore RevenueCat Purchases

```yaml
revenueCat:
  restore: {}
key: 81j500xc
```

### `pageView` -- Control PageView Widget

Programmatically navigates a PageView widget.

```yaml
pageView:
  type: JUMP_TO
  jumpToIndex:
    inputValue:
      serializedValue: "1"
  pageViewNodeKeyRef:
    key: PageView_txxkvt09
key: 9u9dws4x
```

| Field | Type | Description |
|---|---|---|
| `type` | enum | `JUMP_TO`, `NEXT`, `PREVIOUS` |
| `jumpToIndex` | value | Target page index (for `JUMP_TO`) |
| `pageViewNodeKeyRef.key` | string | Key of the target PageView widget |

### `timer` -- Start or Stop Timer

Controls a Timer widget.

```yaml
timer:
  type: START_TIMER
key: yfifxw3z
```

```yaml
timer:
  type: STOP_TIMER
key: ucm9biyi
```

### `executeCallbackAction` -- Execute Component Callback

Invokes a callback parameter defined on a parent component.

```yaml
executeCallbackAction:
  parameterIdentifier:
    name: onManage
    key: aulgkx
  argumentValues: {}
key: 2b2dwjgo
```

| Field | Type | Description |
|---|---|---|
| `parameterIdentifier` | name+key | Callback parameter to invoke |
| `argumentValues` | map | Arguments to pass to the callback |

### `alertDialog` -- Show Dialog

Displays a dialog, either a custom component or dismisses an existing one.

Show a custom dialog:

```yaml
alertDialog:
  customDialog:
    passedParameters:
      parameterPasses:
        t8j0tg:
          paramIdentifier:
            name: dealTitle
            key: t8j0tg
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
      widgetClassNodeKeyRef:
        key: Container_qsdo2h11
    dimensions:
      width:
        percentOfScreenSizeValue:
          inputValue: 80
    barrierColor: {}
    nonDismissible: true
    isGlobal: true
    componentClassNodeKeyRef:
      key: Container_gtqk3kbu
key: u43n5c2l
```

Dismiss dialog:

```yaml
alertDialog:
  dismissDialog: {}
key: b5f5u42p
```

### `waitAction` -- Wait/Delay

Pauses execution for a specified duration.

```yaml
waitAction:
  durationMillisValue:
    inputValue: 4000
key: pzxnwi4u
```

### `requestPermissions` -- Request Device Permissions

```yaml
requestPermissions:
  permissionType: NOTIFICATIONS
key: lu5gfw3c
```

```yaml
requestPermissions:
  permissionType: LOCATION
key: wgmnqfwt
```

---

## Conditional Actions

Conditional branching is defined in the trigger YAML file (not in individual action files) using `conditionActions`. The structure supports single conditions, multiple conditions, and nested conditions.

### Basic Conditional (true/false branch)

```yaml
rootAction:
  key: 5ycxygcz
  action:
    key: qsw0br81
  followUpAction:
    key: jmvd96i3
    conditionActions:
      trueActions:
        - condition:
            variable:
              source: FUNCTION_CALL
              functionCall:
                values:
                  - variable:
                      source: GLOBAL_PROPERTIES
                      baseVariable:
                        globalProperties:
                          property: IS_IOS
                  - inputValue:
                      serializedValue: "true"
                condition:
                  relation: EQUAL_TO
      falseAction:
        key: opj63zwi
        action:
          key: 54wwjscn
      hasMultiConditions: false
      key: ugl3mgen
trigger:
  triggerType: ON_TAP
```

### Multiple Conditions

When `hasMultiConditions: true`, the `trueActions` list contains multiple condition branches evaluated in order:

```yaml
conditionActions:
  trueActions:
    - condition:
        variable:
          source: FUNCTION_CALL
          functionCall:
            values:
              - variable:
                  source: ACTION_OUTPUTS
                  baseVariable:
                    actionOutput:
                      outputVariableIdentifier:
                        name: updateState
                      actionKeyRef:
                        key: 00tn7yxo
              - variable:
                  source: ENUMS
                  baseVariable:
                    enumVariable:
                      enumIdentifier:
                        name: AppUpdateState
                        key: fta87
                      enumElementIdentifier:
                        name: forceUpdate
                        key: biqqk
            condition:
              relation: EQUAL_TO
      trueAction:
        key: g4iwdyck
        action:
          key: u43n5c2l
    - condition:
        # Second condition...
      trueAction:
        key: riqztjef
        action:
          key: dkb400cy
  hasMultiConditions: true
  key: 2jfp921u
```

### Combined Conditions (AND/OR)

Multiple conditions can be combined using `combineConditions`:

```yaml
conditionActions:
  trueActions:
    - condition:
        variable:
          source: FUNCTION_CALL
          functionCall:
            values:
              - variable:
                  source: LOCAL_STATE
                  baseVariable:
                    localState:
                      fieldIdentifier:
                        name: isAnonymous
                        key: bfu0ivv2
                      stateVariableType: APP_STATE
              - variable:
                  source: LOCAL_STATE
                  baseVariable:
                    localState:
                      fieldIdentifier:
                        name: doneFree
                        key: e4yygjed
                      stateVariableType: APP_STATE
            combineConditions:
              operator: AND_OP     # or OR_OP
```

### RevenueCat Entitlement Condition

A special condition type for RevenueCat subscription checks:

```yaml
conditionActions:
  trueActions:
    - condition:
        revenueCatEntitlementResponse: {}
      trueAction:
        key: lewj54wz
        action:
          key: l00bd53j
  falseAction:
    key: p5lhm9f5
    action:
      key: 50132f9w
```

---

## Action Chaining

Actions execute sequentially using `followUpAction`. Each node in the chain can contain an `action` reference, another `conditionActions` block, or `terminate` to stop execution.

### Sequential Execution

```yaml
rootAction:
  key: 5dyi3ba5
  action:
    key: first_action
  followUpAction:
    key: abc123
    action:
      key: second_action
    followUpAction:
      key: def456
      action:
        key: third_action
      followUpAction:
        key: ghi789
        action:
          key: fourth_action
```

### Terminate Execution

`terminate: {}` stops the action chain early, typically used inside conditional branches:

```yaml
trueAction:
  key: bc1vt0ak
  action:
    navigate:
      allowBack: false
      pageNodeKeyRef:
        key: Scaffold_u52v700s
  followUpAction:
    key: r6wrgnpz
    terminate: {}
```

---

## Disabled Actions

Actions can be conditionally disabled using a `disableAction` wrapper. When the condition evaluates to true, the wrapped action executes; the chain terminates otherwise.

```yaml
key: hfzr0kmk
disableAction:
  actionNode:
    key: 6zoe9nca
    conditionActions:
      trueActions:
        - condition:
            variable:
              source: FUNCTION_CALL
              functionCall:
                values:
                  - variable:
                      source: FIREBASE_AUTH_USER
                      baseVariable:
                        auth:
                          property: USERS_DATA_FIELD
                          usersDataField:
                            name: zipCode
                  - inputValue:
                      serializedValue: "0"
                condition:
                  relation: EQUAL_TO
          trueAction:
            key: 664phh8p
            action:
              localStateUpdate:
                # ...action body inline...
            followUpAction:
              key: pqmxin3v
              terminate: {}
      hasMultiConditions: false
      key: xsa3loej
```

Note: In `disableAction`, the action body can be inlined directly rather than referenced by key.

---

## Action Output Variables

Actions that produce results use `outputVariableName` to store the value. Subsequent actions can reference these outputs via the `ACTION_OUTPUTS` variable source:

**Producing an output:**

```yaml
database:
  firestoreQuery:
    collectionIdentifier:
      name: RedeemedUserDeals
      key: lzo3gj3d
    # ...query config...
outputVariableName: deals
key: iw14lghd
```

**Consuming an output:**

```yaml
variable:
  source: ACTION_OUTPUTS
  baseVariable:
    actionOutput:
      outputVariableIdentifier:
        name: deals
      actionKeyRef:
        key: iw14lghd
  nodeKeyRef:
    key: Scaffold_4qdr9nq8
  actionComponentKeyRef: {}
```

The `actionKeyRef.key` must match the `key` of the action that produced the output. When the output comes from an action component (reusable action block), `actionComponentKeyRef.key` references the component.

---

## App Action Components

Reusable action sequences can be defined as **app action components** and referenced across pages. These live under `app-action-components/`:

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
      outputVariableName: updateState
      key: 00tn7yxo
    followUpAction:
      key: isp97zrh
      conditionActions:
        # ...branching logic...
description: ""
```

App action components use the same action and chaining structures but are not tied to any specific widget trigger.

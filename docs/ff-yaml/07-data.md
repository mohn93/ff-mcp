# Data Models

FlutterFlow projects define their data layer through four primary constructs stored as YAML files in the project cache: **Collections** (Firestore schemas), **Data Structs** (local typed objects), **Enums** (named constant sets), and **API Endpoints** (external HTTP integrations).

---

## Collections

Collections represent Firestore document schemas. Each collection file lives under `collections/id-<key>.yaml`.

### Structure

```yaml
identifier:
  name: Establishments           # Human-readable collection name
  key: k2ktdun9                  # Unique identifier key
fields:
  Name:                          # Field name (map key = field name)
    identifier:
      name: Name
    dataType:
      scalarType: String         # Scalar type for the field
  latLon:
    identifier:
      name: latLon
    dataType:
      scalarType: LatLng         # Geographic coordinate type
  LogoURL:
    identifier:
      name: LogoURL
    dataType:
      scalarType: ImagePath      # Firebase Storage image reference
  Active:
    identifier:
      name: Active
    dataType:
      scalarType: Boolean
  ContractEnds:
    identifier:
      name: ContractEnds
    dataType:
      scalarType: DateTime
description: ""
```

### Field layout

Every field in a collection is a map entry keyed by the field name. The value contains:

| Property | Required | Description |
|----------|----------|-------------|
| `identifier.name` | Yes | Field name (matches the map key) |
| `dataType.scalarType` | Yes | One of the supported scalar types (see table below) |
| `dataType.subType` | Only for references | Sub-type details (e.g., target collection for `DocumentReference`) |

### DocumentReference fields

Fields that reference other documents use `scalarType: DocumentReference` with a `subType.collectionIdentifier` pointing to the target collection:

```yaml
uid:
  identifier:
    name: uid
  dataType:
    scalarType: DocumentReference
    subType:
      collectionIdentifier:
        name: PushNotificationUsers
        key: g115cee9
```

### Sub-collections

A collection can be nested under a parent collection using `parentCollectionIdentifier`:

```yaml
identifier:
  name: review
  key: 9ijnlv0r
fields:
  rating:
    identifier:
      name: rating
    dataType:
      scalarType: Integer
  comment:
    identifier:
      name: comment
    dataType:
      scalarType: String
  user:
    identifier:
      name: user
    dataType:
      scalarType: DocumentReference
      subType:
        collectionIdentifier:
          name: PushNotificationUsers
          key: g115cee9
parentCollectionIdentifier:       # Makes this a sub-collection
  name: Establishments
  key: k2ktdun9
```

The `parentCollectionIdentifier` block references the parent collection by `name` and `key`. In Firestore this translates to `/Establishments/{docId}/review/{reviewId}`.

### Full collection example

```yaml
identifier:
  name: Receipts
  key: hj26cdh4
fields:
  url:
    identifier:
      name: url
    dataType:
      scalarType: ImagePath
  uid:
    identifier:
      name: uid
    dataType:
      scalarType: DocumentReference
      subType:
        collectionIdentifier:
          name: PushNotificationUsers
          key: g115cee9
  establishment_name:
    identifier:
      name: establishment_name
    dataType:
      scalarType: String
  establishment_location:
    identifier:
      name: establishment_location
    dataType:
      scalarType: LatLng
  establishement_reference:
    identifier:
      name: establishement_reference
    dataType:
      scalarType: DocumentReference
      subType:
        collectionIdentifier:
          name: Establishments
          key: k2ktdun9
  created_date:
    identifier:
      name: created_date
    dataType:
      scalarType: DateTime
```

---

## Data Structs

Data Structs are local typed objects (not stored in Firestore). They live under `data-structs/id-<key>.yaml`. Unlike collections, their fields use an **array** format rather than a map.

### Structure

```yaml
identifier:
  name: SubscriptionInfo
  key: pjr4u
fields:
  - identifier:
      name: productName
      key: aa4nr
    dataType:
      scalarType: String
    description: ""
  - identifier:
      name: price
      key: pge5t
    dataType:
      scalarType: Double
    description: ""
  - identifier:
      name: isActive
      key: gp4z4
    dataType:
      scalarType: Boolean
    description: ""
  - identifier:
      name: expirationDate
      key: tq0ql
    dataType:
      scalarType: DateTime
    description: ""
description: ""
```

### Key differences from collections

| Aspect | Collections | Data Structs |
|--------|------------|--------------|
| Fields format | Map (keyed by field name) | Array of objects |
| Field identifiers | `name` only | `name` + `key` |
| `description` | On field (optional) | On each field + top-level |
| Storage | Firestore documents | In-memory / local |

### List types

A field can hold a list of scalars using `listType` instead of `scalarType`:

```yaml
- identifier:
    name: ingredients
    key: lu6lm
  dataType:
    listType:
      scalarType: String
  description: ""
```

### Nested struct references

A data struct can reference another data struct via `listType` with `scalarType: DataStruct` and a `subType.dataStructIdentifier`:

```yaml
identifier:
  name: CorelationSymptom
  key: zu4s2
fields:
  - identifier:
      name: symptom_name
      key: cu81s
    dataType:
      scalarType: String
    description: ""
  - identifier:
      name: food
      key: 3vypf
    dataType:
      listType:
        scalarType: DataStruct        # References another struct
      subType:
        dataStructIdentifier:
          name: food
          key: 2dns4
    description: ""
description: ""
```

### Default values

Fields can specify default values using `defaultValue`:

```yaml
- identifier:
    name: isEligibleForTrial
    key: 0emsg
  dataType:
    scalarType: Boolean
  description: ""
```

When no `defaultValue` is present, the field defaults to null (or the Dart default for the type).

---

## Enums

Enums define named constant sets. They live under `enums/id-<key>.yaml`.

### Structure

```yaml
identifier:
  name: subscription
  key: 8a348
elements:
  - identifier:
      name: monthly
      key: 3lp2p
  - identifier:
      name: annual
      key: jqsvd
  - identifier:
      name: free_trial
      key: 5i7ti
description: ""
```

### Element format

Each element has:

| Property | Required | Description |
|----------|----------|-------------|
| `identifier.name` | Yes | The enum value name |
| `identifier.key` | Yes | Unique key for the element |
| `description` | No | Optional description of the element |

### Larger enum example

```yaml
identifier:
  name: category_food
  key: 7n3rj
elements:
  - identifier:
      name: alcoholic
      key: uzgsa
  - identifier:
      name: bread_and_bakery
      key: 4movm
  - identifier:
      name: breakfastFoods
      key: kvzi2
    description: ""
  - identifier:
      name: poultry
      key: 5tmy7
    description: ""
  - identifier:
      name: coffee_and_tea
      key: jb054
  - identifier:
      name: dairyProducts
      key: 0f3b2
  # ... additional elements
description: ""
```

### Referencing enums in actions

Enums are referenced in action logic via the `ENUMS` source:

```yaml
variable:
  source: ENUMS
  baseVariable:
    enumVariable:
      enumIdentifier:
        name: AppUpdateState
        key: fta87
      enumElementIdentifier:
        name: forceUpdate
        key: biqqk
```

---

## API Endpoints

API Endpoints define external HTTP calls. They live under `api-endpoint/id-<key>.yaml`.

### Structure (GET request)

```yaml
identifier:
  name: Distance Matrix API Google
  key: gpcto
url: "https://maps.googleapis.com/maps/api/distancematrix/json?destinations=[destination]&origins=[origin]&units=imperial&key=..."
callType: GET
variables:
  - identifier:
      name: destination
      key: destination
    type: String
    testValue: Orem%20Utah
  - identifier:
      name: origin
      key: origin
    type: String
    testValue: Pocatello%20Idaho
jsonPathDefinitions:
  - identifier:
      name: Distance
      key: Distance
    jsonPath:
      jsonPath: "$.rows[0].elements[0].distance.text"
      returnParameter:
        dataType:
          scalarType: String
endpointSettings: {}
parameters:
  - identifier:
      name: destination
      key: destination
    variableIdentifier:
      name: destination
      key: destination
  - identifier:
      name: origin
      key: origin
    variableIdentifier:
      name: origin
      key: origin
```

### Structure (POST request with body)

```yaml
identifier:
  name: CreateStripeBillingPortal
  key: hx3jx
url: https://stripe-createbillingportalsession-zlackvbzaa-uc.a.run.app
callType: POST
variables:
  - identifier:
      name: token
      key: b7vj02x7
    type: String
    testValue: "eyJhbGciOi..."
    value:
      inputValue: {}
  - identifier:
      name: customer_id
      key: lnaoydbh
    type: String
    testValue: cus_S40aYcculStinV
    value:
      inputValue: {}
  - identifier:
      name: is_live_mode
      key: 0b92rcbo
    type: Boolean
    testValue: "false"
    value:
      inputValue:
        serializedValue: "true"
bodyType: JSON
body: "{\n  \"data\": {\n    \"customer_id\": \"<customer_id>\",\n    \"is_live_mode\": <is_live_mode>\n  }\n}"
jsonPathDefinitions:
  - identifier:
      name: resultUrl
      key: w8h6xhwf
    jsonPath:
      jsonPath: $.result.url
      returnParameter:
        dataType:
          scalarType: String
    inferredParameter:
      dataType:
        scalarType: String
headers:
  - "Authorization: Bearer [token]"
  - "Content-Type: application/json"
endpointSettings:
  escapeVariablesInRequestBody: true
parameters:
  - identifier:
      name: customer_id
      key: wrfgis3r
    variableIdentifier:
      name: customer_id
      key: lnaoydbh
  - identifier:
      name: is_live_mode
      key: cyi1yf4b
    variableIdentifier:
      name: is_live_mode
      key: 0b92rcbo
```

### Top-level fields

| Field | Required | Description |
|-------|----------|-------------|
| `identifier` | Yes | `name` and `key` for the endpoint |
| `url` | Yes | Full URL. Variables are interpolated using `[varName]` in query strings or `<varName>` in bodies |
| `callType` | Yes | HTTP method: `GET`, `POST`, `PUT`, `DELETE`, `PATCH` |
| `variables` | No | List of variables used in the request |
| `headers` | No | List of header strings (variables use `[varName]` syntax) |
| `bodyType` | No | Body encoding: `JSON`, `TEXT`, `X_WWW_FORM_URL_ENCODED` |
| `body` | No | Body template string (variables use `<varName>` syntax) |
| `jsonPathDefinitions` | No | JSON path extractors for parsing the response |
| `endpointSettings` | No | Additional settings (e.g., `escapeVariablesInRequestBody`) |
| `parameters` | No | Maps parameter identifiers to variable identifiers |

### Variable definition

```yaml
variables:
  - identifier:
      name: customer_id
      key: lnaoydbh
    type: String                    # Variable type: String, Boolean, Integer, etc.
    testValue: cus_S40aYcculStinV   # Test value for API testing panel
    value:                          # Optional default value
      inputValue: {}
```

### JSON path definitions

Extract values from API responses using JSONPath:

```yaml
jsonPathDefinitions:
  - identifier:
      name: resultUrl
      key: w8h6xhwf
    jsonPath:
      jsonPath: $.result.url        # JSONPath expression
      returnParameter:
        dataType:
          scalarType: String        # Expected return type
    inferredParameter:              # Optional: auto-inferred type
      dataType:
        scalarType: String
```

### Variable interpolation

Variables are referenced differently depending on context:

| Context | Syntax | Example |
|---------|--------|---------|
| URL query parameters | `[varName]` | `?key=[apiKey]&q=[query]` |
| Request body | `<varName>` | `"customer_id": "<customer_id>"` |
| Headers | `[varName]` | `Authorization: Bearer [token]` |

---

## Scalar Types Reference

The following scalar types are supported across Collections, Data Structs, and custom code definitions:

| Scalar Type | Description | Dart Type | Used In |
|-------------|-------------|-----------|---------|
| `String` | Text value | `String` | All |
| `Integer` | Whole number | `int` | All |
| `Double` | Floating-point number | `double` | All |
| `Boolean` | True/false | `bool` | All |
| `DateTime` | Date and time | `DateTime` | All |
| `ImagePath` | Firebase Storage image URL | `String` | Collections |
| `LatLng` | Geographic coordinates | `LatLng` | Collections |
| `DocumentReference` | Firestore document reference | `DocumentReference` | Collections |
| `JSON` | Arbitrary JSON value | `dynamic` | Functions, API |
| `DataStruct` | Reference to a Data Struct type | Generated class | Data Structs |
| `UploadedFile` | File upload handle | `FFUploadedFile` | Custom code |
| `Action` | Callback action reference | `Future Function()` | Custom widgets |
| `WidgetProperty` | Widget configuration property | Varies | Custom widgets |
| `PostgresRow` | Supabase row reference | `SupabaseRow` | Custom code |
| `Color` | Color value | `Color` | Widgets, params |
| `SupabaseRow` | Supabase database row | `SupabaseRow` | Custom code |

### Type modifiers

Scalar types can be wrapped with modifiers:

```yaml
# Nullable scalar (default)
dataType:
  scalarType: String

# Non-nullable scalar
dataType:
  scalarType: String
  nonNullable: true

# List of scalars
dataType:
  listType:
    scalarType: String

# Non-nullable list
dataType:
  listType:
    scalarType: String
  nonNullable: true

# Scalar with sub-type (DocumentReference, DataStruct, PostgresRow)
dataType:
  scalarType: DocumentReference
  subType:
    collectionIdentifier:
      name: Users
      key: abc123

# List of Data Structs
dataType:
  listType:
    scalarType: DataStruct
  subType:
    dataStructIdentifier:
      name: food
      key: 2dns4
```

### File key patterns

| Data type | File key pattern | Directory |
|-----------|-----------------|-----------|
| Collection | `collections/id-<key>` | `collections/` |
| Data Struct | `data-structs/id-<key>` | `data-structs/` |
| Enum | `enums/id-<key>` | `enums/` |
| API Endpoint | `api-endpoint/id-<key>` | `api-endpoint/` |

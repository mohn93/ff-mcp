# 01 - FlutterFlow Project-Level YAML Files

Reference catalog of project-level YAML files returned by the FlutterFlow API. These files configure app-wide settings and are not tied to individual pages or components.

---

## app-details.yaml

**Purpose:** Core app identity, routing configuration, and environment-specific package names.

**Top-level keys:**
- `name`
- `authPageInfo`
- `appSettings`
- `routingSettings`
- `initialPageKeyRef`
- `allAppNames`

**Schema:**
```yaml
name: "MyApp"                          # App display name in FF editor

authPageInfo:
  homePageNodeKeyRef:
    key: Scaffold_XXXXXXXX             # Scaffold ID of the post-auth landing page
  signInPageNodeKeyRef:
    key: Scaffold_XXXXXXXX             # Scaffold ID of the sign-in page

appSettings:
  advancedSettings:
    webBuildSettings: {}               # Web-specific build config (often empty)

routingSettings:
  enableRouting: true                  # Enable named routes
  pagesAreSubroutesOfRoot: false       # If true, pages are nested under root

initialPageKeyRef:
  key: Scaffold_XXXXXXXX              # Scaffold ID of the app entry page (often same as homePage)

allAppNames:
  appNames:
    PROD:                              # Environment key (PROD, DEV, etc.)
      packageName: com.example.app     # Android package / iOS bundle ID
      displayName: "MyApp"             # App store display name
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `name` | string | Required. Editor-level app name. |
| `authPageInfo.homePageNodeKeyRef.key` | Scaffold ID | Required when auth is active. Where users land after login. |
| `authPageInfo.signInPageNodeKeyRef.key` | Scaffold ID | Required when auth is active. Login/signup page. |
| `initialPageKeyRef.key` | Scaffold ID | Required. First page loaded on app start. |
| `allAppNames.appNames.<ENV>.packageName` | string | Bundle/package identifier per environment. |
| `routingSettings.enableRouting` | bool | Enables Flutter named routes. |

---

## authentication.yaml

**Purpose:** Authentication provider configuration (Firebase, Supabase) and platform credentials.

**Top-level keys:**
- `active`
- `supabase`
- `firebaseConfigFileInfos`

**Schema:**
```yaml
active: true                           # Whether auth is enabled

supabase: {}                           # Supabase config (empty if not used)

firebaseConfigFileInfos:
  - androidPath: users/.../google-services.json      # GCS path to Android config
    iosPath: users/.../GoogleService-Info.plist       # GCS path to iOS config
    webConfig: "firebase.initializeApp({...});\n"     # Inline JS init snippet
    androidPackageNames:
      - com.example.app                              # Registered Android packages
    iosBundleId: com.example.app                     # iOS bundle identifier
    environment:
      name: Production                               # Environment label
      key: PROD                                      # Environment key
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `active` | bool | Required. Master toggle for auth features. |
| `firebaseConfigFileInfos` | list | One entry per environment. Contains platform credentials. |
| `firebaseConfigFileInfos[].webConfig` | string | Raw JS snippet with Firebase config object. Escaped newlines. |
| `firebaseConfigFileInfos[].environment.key` | string | Matches keys in `app-details.yaml > allAppNames.appNames`. |
| `supabase` | object | Populated when Supabase is the auth provider instead of Firebase. |

---

## folders.yaml

**Purpose:** Defines page/component folder structure and maps each widget class (Scaffold/Container) to its folder.

**Top-level keys:**
- `rootFolders`
- `widgetClassKeyToFolderKey`

**Schema:**
```yaml
rootFolders:
  - key: abcd1234                      # Unique folder key
    name: auth                         # Human-readable folder name
  - key: efgh5678
    name: pages

widgetClassKeyToFolderKey:
  Scaffold_XXXXXXXX: abcd1234          # Page scaffold -> folder key
  Container_XXXXXXXX: efgh5678         # Component container -> folder key
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `rootFolders` | list | Required. Defines all top-level folders. |
| `rootFolders[].key` | string | 8-char alphanumeric key. Referenced by widget mappings. |
| `rootFolders[].name` | string | Folder name displayed in FF editor sidebar. |
| `widgetClassKeyToFolderKey` | map | Maps every `Scaffold_*` (page) and `Container_*` (component) to a folder key. |

---

## permissions.yaml

**Purpose:** Platform permission declarations with user-facing explanation messages.

> **Important — this is an abstraction layer, not a native file.**
> This file is NOT the `AndroidManifest.xml` or `Info.plist` — it is FlutterFlow's own configuration that gets **mapped to native platform files at build time**. When FF generates the app:
> - `permissionMessages` entries are mapped to the correct native declarations on both platforms (e.g., `LOCATION` → `<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>` in AndroidManifest.xml + `NSLocationWhenInUseUsageDescription` in Info.plist).
> - `userDefinedPermissions` entries let you specify the exact iOS (`iosName`) and Android (`androidName`) keys when FF's built-in types don't cover your needs.
> - The `message.textValue.inputValue` strings become the permission rationale text shown to users when the app requests access.
>
> You cannot directly edit `AndroidManifest.xml`, `Info.plist`, or `build.gradle` through the FlutterFlow API. This file is the input that drives their generation.

**Top-level keys:**
- `permissionMessages`
- `userDefinedPermissions`

**Schema:**
```yaml
permissionMessages:
  - permissionType: CAMERA                       # FF built-in permission enum
    message:
      translationIdentifier:
        key: k2j9ttsz                            # i18n key
      textValue:
        inputValue: "This app requires camera access..."
        mostRecentInputValue: "This app requires camera access..."

userDefinedPermissions:
  - names:
      iosName: NSCameraUsageDescription          # iOS Info.plist key
      androidName: android.permission.CAMERA     # Android manifest permission
    message:
      translationIdentifier:
        key: 6c6yuxd5
      textValue:
        inputValue: "This app requires camera access..."
  - type: NOTIFICATIONS                          # Alternative: type-based custom permission
    message:
      translationIdentifier:
        key: fsh8sleo
      textValue:
        inputValue: "We use push notifications..."
        mostRecentInputValue: "We use push notifications..."
```

**Two sections, different use cases:**

| Section | When to use | How FF maps it |
|---|---|---|
| `permissionMessages` | Standard permissions (CAMERA, LOCATION, etc.) | FF knows the exact native keys for both platforms — you just pick the type and provide a message. |
| `userDefinedPermissions` | Custom or platform-specific permissions | You manually specify the `iosName` (Info.plist key) and/or `androidName` (Android permission string). Can also use `type` for known types like `NOTIFICATIONS`. |

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `permissionMessages` | list | Built-in FF permission types: `CAMERA`, `PHOTO_LIBRARY`, `MICROPHONE`, `LOCATION`, `NOTIFICATIONS`, etc. |
| `permissionMessages[].permissionType` | enum string | Required. Must be a recognized FF permission type. |
| `userDefinedPermissions` | list | Custom platform-level permission entries. |
| `userDefinedPermissions[].type` | enum string | Optional. Known type like `NOTIFICATIONS`. Alternative to specifying `names`. |
| `userDefinedPermissions[].names.iosName` | string | iOS `Info.plist` key (e.g., `NSPhotoLibraryUsageDescription`). |
| `userDefinedPermissions[].names.androidName` | string | Android manifest permission string (e.g., `android.permission.CAMERA`). |
| `*.message.textValue.inputValue` | string | User-facing permission rationale string. |
| `*.message.textValue.mostRecentInputValue` | string | Should match `inputValue` — keep both in sync. |
| `*.message.translationIdentifier.key` | string | Links to `languages.yaml` translations. |

---

## nav-bar.yaml

**Purpose:** Bottom navigation bar configuration including visibility, style, page tabs, labels, and colors.

**Top-level keys:**
- `show`
- `navBarType`
- `pageKeyRefOrder`
- `labels`
- `backgroundColor`
- `selectedIconColor`
- `unselectedIconColor`

**Schema:**
```yaml
show: true                             # Whether the nav bar is visible

navBarType: FLOATING                   # Nav bar style: FLOATING | GOOGLE | MATERIAL3

pageKeyRefOrder:                       # Ordered list of pages shown as nav bar tabs
  - key: Scaffold_XXXXXXXX            # Scaffold key ref for first tab
  - key: Scaffold_YYYYYYYY            # Scaffold key ref for second tab
  - key: Scaffold_ZZZZZZZZ            # Scaffold key ref for third tab

labels: true                           # Show text labels beneath tab icons

backgroundColor:
  themeColor: PRIMARY_BACKGROUND       # Theme color token

selectedIconColor:
  themeColor: PRIMARY                  # Active tab icon color

unselectedIconColor:
  themeColor: SECONDARY_TEXT           # Inactive tab icon color
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `show` | bool | Master visibility toggle for the bottom nav bar. |
| `navBarType` | enum | Nav bar style variant. Known values: `FLOATING`, `GOOGLE`, `MATERIAL3`. |
| `pageKeyRefOrder` | list | Ordered list of scaffold key refs defining the tab order. Each entry has a `key` field referencing a `Scaffold_*` ID. |
| `labels` | bool | Whether text labels are displayed beneath tab icons. |
| `backgroundColor.themeColor` | theme token | One of: `PRIMARY`, `SECONDARY`, `PRIMARY_BACKGROUND`, `SECONDARY_BACKGROUND`, `PRIMARY_TEXT`, `SECONDARY_TEXT`, `ACCENT1`-`ACCENT4`, etc. |
| `selectedIconColor` | color ref | Color when tab is active. |
| `unselectedIconColor` | color ref | Color when tab is inactive. |

> Note: The individual tab icon and label for each page are configured in the page scaffold YAML, not here. This file controls the nav bar structure, style, and colors.

---

## app-bar.yaml

**Purpose:** Default app bar template applied to new pages.

**Top-level keys:**
- `templateType`
- `backgroundColor`
- `elevation`
- `defaultIcon`
- `textStyle`
- `addOnNewPages`

**Schema:**
```yaml
templateType: LARGE_HEADER             # LARGE_HEADER | SMALL_HEADER | NONE

backgroundColor:
  value: "4930031"                     # Raw ARGB int as string (no 0x prefix)

elevation: 0                           # Shadow elevation (0 = flat)

defaultIcon:
  sizeValue:
    inputValue: 30                     # Icon size in logical pixels
  colorValue:
    inputValue:
      themeColor: PRIMARY_TEXT         # Icon color
  iconDataValue:
    inputValue:
      codePoint: 62834                 # Unicode code point
      family: MaterialIcons            # Icon font family
      matchTextDirection: true
      name: arrow_back_rounded         # Icon name

textStyle:
  themeStyle: HEADLINE_MEDIUM          # Theme text style token
  fontSizeValue:
    inputValue: 22                     # Font size override
  colorValue:
    inputValue:
      themeColor: PRIMARY_TEXT

addOnNewPages: true                    # Auto-add this app bar to newly created pages
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `templateType` | enum | Required. `LARGE_HEADER`, `SMALL_HEADER`, or `NONE`. |
| `backgroundColor.value` | string | Raw ARGB integer as string (e.g., `"4930031"` = dark color). Not hex. |
| `elevation` | int | Material elevation. 0 = no shadow. |
| `defaultIcon.iconDataValue.inputValue.codePoint` | int | Material icon Unicode code point. |
| `defaultIcon.iconDataValue.inputValue.name` | string | Flutter icon name (e.g., `arrow_back_rounded`). |
| `textStyle.themeStyle` | theme token | `HEADLINE_SMALL`, `HEADLINE_MEDIUM`, `HEADLINE_LARGE`, `TITLE_SMALL`, etc. |
| `addOnNewPages` | bool | Whether this app bar is auto-added to new pages. |

---

## miscellaneous.yaml

**Purpose:** Miscellaneous app-level settings and feature flags.

**Top-level keys:**
- `appSettings`

**Schema:**
```yaml
appSettings:
  checkCustomCodeReferences: true      # Validate custom code references on build
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `appSettings.checkCustomCodeReferences` | bool | When true, FF validates that all custom code references resolve at build time. |

> Note: This file is a catch-all. Additional keys may appear depending on project features enabled.

---

## revenue-cat.yaml

**Purpose:** RevenueCat in-app purchase/subscription integration configuration.

**Top-level keys:**
- `enabled`
- `appStoreKey`
- `playStoreKey`
- `debugLoggingEnabled`
- `loadDataAfterAppLaunch`

**Schema:**
```yaml
enabled: true                          # Master toggle
appStoreKey: appl_XXXXXXXXXXXX         # RevenueCat Apple API key
playStoreKey: goog_XXXXXXXXXXXX        # RevenueCat Google API key
debugLoggingEnabled: false             # Enable RC debug logs
loadDataAfterAppLaunch: true           # Fetch entitlements on app start
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `enabled` | bool | Required. Enables RevenueCat integration. |
| `appStoreKey` | string | RevenueCat public API key for Apple App Store. Prefix: `appl_`. |
| `playStoreKey` | string | RevenueCat public API key for Google Play. Prefix: `goog_`. |
| `debugLoggingEnabled` | bool | Verbose RC SDK logging. Should be `false` in production. |
| `loadDataAfterAppLaunch` | bool | If true, RC data is fetched immediately at app launch. |

---

## languages.yaml

**Purpose:** Internationalization (i18n) configuration, supported languages, and all preset/system text strings.

**Top-level keys:**
- `languages`
- `primaryLanguage`
- `displayLanguage`
- `presetTexts`
- `persistLanguageSelection`

**Schema:**
```yaml
languages:
  - language: en                       # ISO 639-1 language code
  - language: es

primaryLanguage:
  language: en                         # Default/fallback language

displayLanguage:
  language: en                         # Language shown in FF editor

presetTexts:
  authMessages:                        # Auth-related system strings
    error:
      translationIdentifier:
        key: 7mu1hspb                  # Unique i18n key
      textValue:
        inputValue: "Invalid credentials!"
    passwordResetEmailSent:
      translationIdentifier:
        key: 59zs8v4b
      textValue:
        inputValue: "Password reset email sent!"
    emailRequired: { ... }
    phoneNumberValidation: { ... }
    passwordsDoNotMatch: { ... }
    enterSmsVerificationCode: { ... }
    reauthenticateForUserDelete: { ... }
    reauthenticateForEmailUpdate: { ... }
    emailChangeConfirmation: { ... }
    emailAlreadyInUse: { ... }
    invalidCredentials: { ... }

  uploadDataMessages:                  # File upload system strings
    invalidFileFormat: { ... }
    uploadingFile: { ... }
    success: { ... }
    error: { ... }
    sendingPhoto: { ... }
    chooseSource: { ... }
    gallery: { ... }
    galleryPhoto: { ... }
    galleryVideo: { ... }
    camera: { ... }
    empty: { ... }

  paymentMessages:                     # Payment system strings
    processingMessage: { ... }
    success: { ... }
    error: { ... }

persistLanguageSelection: true         # Remember user's language choice
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `languages` | list | Required. All supported languages as ISO 639-1 codes. |
| `primaryLanguage.language` | string | Required. Fallback language code. |
| `displayLanguage.language` | string | Language used in the FF editor UI. |
| `presetTexts.authMessages` | object | System-generated auth UI strings (errors, prompts). |
| `presetTexts.uploadDataMessages` | object | File/media upload UI strings. |
| `presetTexts.paymentMessages` | object | Payment flow UI strings. |
| `persistLanguageSelection` | bool | If true, selected language is saved to device. |

> Translation text pattern: Every translatable string uses `{ translationIdentifier: { key }, textValue: { inputValue } }`. The `key` links to translation entries in the FF translation system.

---

## languages/translation/id-{key} (Translation Files)

**Purpose:** Individual translation entries for user-defined translatable strings. Each file maps a unique key to translated text across all supported languages.

**File key pattern:** `languages/translation/id-<key>` (e.g., `languages/translation/id-ttk654j0`)

**Schema:**
```yaml
translationIdentifier:
  key: ttk654j0                # Unique translation key (8-char alphanumeric)
translations:
  - language:
      language: en             # ISO 639-1 code (must match languages.yaml)
    text: Continue             # Translated text for this language
  - language:
      language: es
    text: Continuar
isFixed: false                 # false = user-editable, true = system/preset string
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `translationIdentifier.key` | string | Unique key matching the file key suffix. Referenced by widgets and parameter passes. |
| `translations` | list | One entry per language. Must include all languages from `languages.yaml`. |
| `translations[].language.language` | string | ISO 639-1 code (`en`, `es`, `fr`, etc.) |
| `translations[].text` | string | Translated text. Empty string `""` = untranslated (falls back to primary language). |
| `isFixed` | bool | `true` for system preset strings, `false` for user-defined translations. |

### Where translation keys are referenced

Translation keys appear in two contexts:

**1. On Text widgets** — via `translationIdentifier` in the `text` prop:
```yaml
# Widget-level translation (static, per-widget)
text:
  translationIdentifier:
    key: ttk654j0
  textValue:
    inputValue: Continue       # English default / editor preview
```

**2. On component parameter passes** — via `translatableText` inside `inputValue`:
```yaml
# Parameter-level translation (per-instance, used when passing
# translated strings to component parameters)
paramIdentifier:
  name: title
  key: p1titl
inputValue:
  translatableText:
    translationIdentifier:
      key: ms01ttl1
    textValue:
      inputValue: Histamine / Low DAO    # English default
```

> **Important:** The `translatableText` wrapper is the correct way to pass translated strings as component parameters. Do NOT use `translationIdentifier` directly on the parameterPass (it will fail validation with "Unknown field name"). Instead, nest it inside `inputValue.translatableText`.

---

## app-state.yaml

**Purpose:** App-level state variables (global state accessible from any page/component).

**Top-level keys:**
- `fields`
- `securePersistedValues`

**Schema:**
```yaml
fields:
  - parameter:
      identifier:
        name: email                    # Variable name (camelCase)
        key: x2tvdt22                  # Unique key
      dataType:
        scalarType: String             # Scalar: String, Integer, Double, Boolean, LatLng, Enum, etc.
      description: ""                  # Optional description
    persisted: true                    # Survives app restart (local storage)
    serializedDefaultValue:
      - ""                             # Default value as single-element list of strings

  - parameter:
      identifier:
        name: Favorites
        key: noxdj87d
      dataType:
        listType:                      # List type instead of scalar
          scalarType: String
    persisted: true
    # No serializedDefaultValue = empty list default

  - parameter:
      identifier:
        name: NavBarStatus
        key: p4n8k8yh
      dataType:
        scalarType: Enum
        subType:                       # Required for Enum type
          enumIdentifier:
            name: NavBar
            key: qik04
      description: ""
    persisted: false
    serializedDefaultValue:
      - fxjp3                          # Enum value key (not label)

securePersistedValues: false           # If true, persisted values use secure storage
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `fields` | list | Required. All app state variables. |
| `fields[].parameter.identifier.name` | string | Variable name. Used in code and bindings. |
| `fields[].parameter.identifier.key` | string | Immutable unique key. Used in YAML references. |
| `fields[].parameter.dataType.scalarType` | enum | `String`, `Integer`, `Double`, `Boolean`, `LatLng`, `Enum`, `DateTime`, `Color`, `JSON`, etc. |
| `fields[].parameter.dataType.listType` | object | Present instead of `scalarType` for list-typed variables. Contains its own `scalarType`. |
| `fields[].parameter.dataType.subType` | object | Required for `Enum` scalar type. References the enum definition. |
| `fields[].persisted` | bool | Required. If true, value is saved to local storage across app restarts. |
| `fields[].serializedDefaultValue` | list of strings | Default value. Always a single-element string list (even for numbers/bools). Booleans: `"true"`/`"false"`. Enums: the enum value key. |
| `securePersistedValues` | bool | Use platform secure storage (Keychain/Keystore) for persisted values. |

---

## app-constants.yaml

**Purpose:** Compile-time constants accessible app-wide. Unlike app state, these cannot be changed at runtime.

**Top-level keys:**
- `fields`

**Schema:**
```yaml
fields:
  - parameter:
      identifier:
        name: Distances                # Constant name
        key: eghxy5                    # Unique key
      dataType:
        listType:
          scalarType: Integer          # List of integers
      description: ""
    serializedValue:                   # Constant value (not "default" -- this IS the value)
      - "50"
      - "100"
      - "200"
      - "500"

  - parameter:
      identifier:
        name: isLive
        key: a0hp9r
      dataType:
        scalarType: Boolean
      description: ""
    serializedValue:
      - "true"
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `fields` | list | Required. All app constants. |
| `fields[].parameter.identifier` | object | Same `{ name, key }` pattern as app-state. |
| `fields[].parameter.dataType` | object | Same type system as app-state (`scalarType` or `listType`). |
| `fields[].serializedValue` | list of strings | The constant value. For scalars: single-element list. For lists: one element per item. All values are strings regardless of type. |

> Key difference from `app-state.yaml`: Uses `serializedValue` (the actual value) instead of `serializedDefaultValue` (a default). No `persisted` field since constants are baked in at compile time.

---

## environment-settings.yaml

**Purpose:** Per-environment configuration values (API URLs, API keys, feature flags, etc.) that can vary between environments like Production and Development.

**Top-level keys:**
- `currentEnvironment`
- `environmentValues`

**Schema:**
```yaml
currentEnvironment:
  name: Production                     # Human-readable environment name
  key: PROD                            # Environment key (matches app-details allAppNames)

environmentValues:
  - parameter:
      identifier:
        name: PublicSupabaseURL         # Variable name
        key: actmw6                     # Unique key
      dataType:
        scalarType: String              # Data type (String, Integer, etc.)
    valuesMap:
      PROD:
        serializedValue: https://example.supabase.co
    isPrivate: false                    # If true, value is hidden in the FF UI
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `currentEnvironment.key` | string | Active environment key (e.g., `PROD`, `DEV`). Determines which values are used at runtime. |
| `currentEnvironment.name` | string | Display name for the active environment. |
| `environmentValues` | list | All environment-specific variables. |
| `environmentValues[].parameter.identifier` | object | Same `{ name, key }` pattern as app-state variables. |
| `environmentValues[].parameter.dataType.scalarType` | enum | Variable data type (`String`, `Integer`, `Double`, `Boolean`, etc.). |
| `environmentValues[].valuesMap.<ENV>.serializedValue` | string | The value for a specific environment key. |
| `environmentValues[].isPrivate` | bool | When true, the value is obscured in the FF editor UI. Useful for API keys. |

---

## dependencies.yaml

**Purpose:** FlutterFlow library/package dependencies -- other FlutterFlow projects imported and used as reusable libraries.

**Top-level keys:**
- `dependencies`

**Schema:**
```yaml
dependencies:
  - projectId: common-utility-lib-hy7wrl   # FF project ID of the library
    name: common-utility-lib               # Library display name
    version: 0.0.15                        # Pinned version
    commitId: 4ydionKBbeDiBENNLcAf         # Specific commit in the library project
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `dependencies` | list | All imported FlutterFlow library dependencies. |
| `dependencies[].projectId` | string | The FlutterFlow project ID of the library being imported. |
| `dependencies[].name` | string | Human-readable library name. |
| `dependencies[].version` | string | Semver version string of the pinned library version. |
| `dependencies[].commitId` | string | Specific commit hash in the library project that this version references. |

---

## custom-code-dependencies.yaml

**Purpose:** Dart/Flutter pub package dependencies used by custom code within the project.

**Top-level keys:**
- `pubspecDependencies`

**Schema:**
```yaml
pubspecDependencies:
  - name: blurhash_dart                # Pub package name
    version: 1.2.1                     # Exact version
  - name: geocoding
    version: ^3.0.0                    # Version constraint (caret syntax)
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `pubspecDependencies` | list | All Dart/Flutter pub packages added for custom code. |
| `pubspecDependencies[].name` | string | Package name as it appears on pub.dev. |
| `pubspecDependencies[].version` | string | Version constraint. Supports exact (`1.2.1`), caret (`^3.0.0`), and range syntax. |

---

## supabase.yaml

**Purpose:** Supabase project connection configuration and full database schema including table definitions, field types, primary keys, and foreign key relationships.

**Top-level keys:**
- `projectConfig`
- `databaseConfig`

**Schema:**
```yaml
projectConfig:
  enabled: true                        # Whether Supabase integration is active
  supabaseUrl:
    variable:
      source: DEV_ENVIRONMENT          # Pulls value from environment-settings
      baseVariable:
        environmentValue:
          identifier:
            name: PublicSupabaseURL
            key: actmw6
  anonKey:
    variable:
      source: DEV_ENVIRONMENT
      baseVariable:
        environmentValue:
          identifier:
            name: PublicSupabaseAnonKey
            key: q60j8s

databaseConfig:
  tables:
    - identifier:
        name: lists                    # Table name
      fields:
        - identifier:
            name: id                   # Column name
          type:
            dataType:
              scalarType: String
          isPrimaryKey: true
          hasDefault: true             # Has a DB-level default value
          isRequired: true             # NOT NULL constraint
          postgresType: uuid           # Postgres-specific type
        - identifier:
            name: owner_id
          type:
            dataType:
              scalarType: String
          postgresType: uuid
          foreignKey: users.id         # Foreign key reference (table.column)
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `projectConfig.enabled` | bool | Master toggle for the Supabase integration. |
| `projectConfig.supabaseUrl` | variable ref | Supabase project URL. Typically references an environment variable via `source: DEV_ENVIRONMENT`. |
| `projectConfig.anonKey` | variable ref | Supabase anonymous/public key. Same environment variable pattern. |
| `databaseConfig.tables` | list | Full database schema. One entry per table. |
| `databaseConfig.tables[].identifier.name` | string | Postgres table name. |
| `databaseConfig.tables[].fields` | list | All columns in the table. |
| `databaseConfig.tables[].fields[].identifier.name` | string | Column name. |
| `databaseConfig.tables[].fields[].type.dataType.scalarType` | enum | FF data type mapping (`String`, `Integer`, `Double`, `Boolean`, etc.). |
| `databaseConfig.tables[].fields[].isPrimaryKey` | bool | Whether this column is the primary key. |
| `databaseConfig.tables[].fields[].hasDefault` | bool | Whether the column has a database-level default value. |
| `databaseConfig.tables[].fields[].isRequired` | bool | Whether the column has a NOT NULL constraint. |
| `databaseConfig.tables[].fields[].postgresType` | string | Raw Postgres type (e.g., `uuid`, `text`, `int4`, `timestamptz`). |
| `databaseConfig.tables[].fields[].foreignKey` | string | Foreign key reference in `table.column` format (e.g., `users.id`). |

---

## Firebase Services

Three separate YAML files configure Firebase service integrations. Each follows a simple `enabled` toggle pattern.

### firebase-analytics.yaml

**Purpose:** Firebase Analytics event tracking configuration.

**Schema:**
```yaml
enabled: true                          # Master toggle

automaticEventSettings:
  onPageLoad: true                     # Log screen_view on page navigation
  onIndividualActions: true            # Log events for individual user actions
  onAuth: true                         # Log auth-related events (login, signup)
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `enabled` | bool | Master toggle for Firebase Analytics. |
| `automaticEventSettings.onPageLoad` | bool | Automatically log `screen_view` events on page transitions. |
| `automaticEventSettings.onIndividualActions` | bool | Log events for user interactions with individual widgets/actions. |
| `automaticEventSettings.onAuth` | bool | Log authentication events (sign-in, sign-up, sign-out). |

### firebase-crashlytics.yaml

**Purpose:** Firebase Crashlytics crash reporting.

**Schema:**
```yaml
enabled: true                          # Master toggle
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `enabled` | bool | Enables crash reporting via Firebase Crashlytics. |

### firebase-performance-monitoring.yaml

**Purpose:** Firebase Performance Monitoring for network and rendering metrics.

**Schema:**
```yaml
enabled: true                          # Master toggle
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `enabled` | bool | Enables performance monitoring traces and network request metrics. |

---

## push-notifications.yaml

**Purpose:** Push notification settings including whether to auto-prompt users for notification permissions.

**Top-level keys:**
- `enabled`
- `autoPromptUsersForNotificationsPermission`

**Schema:**
```yaml
enabled: false                                    # Master toggle
autoPromptUsersForNotificationsPermission: true   # Show permission dialog on app launch
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `enabled` | bool | Master toggle for push notification support. |
| `autoPromptUsersForNotificationsPermission` | bool | If true, automatically prompts the user for notification permissions on first launch. |

---

## google-maps.yaml

**Purpose:** Google Maps API key configuration per platform.

**Top-level keys:**
- `androidKey`
- `iosKey`
- `webKey`

**Schema:**
```yaml
androidKey: AIzaSy...                  # Google Maps API key for Android
iosKey: AIzaSy...                      # Google Maps API key for iOS
webKey: AIzaSy...                      # Google Maps API key for Web
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `androidKey` | string | Google Maps JavaScript/Android API key. |
| `iosKey` | string | Google Maps iOS SDK API key. |
| `webKey` | string | Google Maps JavaScript API key for web builds. |

---

## ad-mob.yaml

**Purpose:** Google AdMob advertising integration configuration.

**Top-level keys:**
- `showTestAds`
- `enabled`

**Schema:**
```yaml
showTestAds: true                      # Use test ad units (for development)
enabled: false                         # Master toggle
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `enabled` | bool | Master toggle for AdMob integration. |
| `showTestAds` | bool | When true, displays Google test ads instead of real ads. Should be `true` during development, `false` in production. |

---

## app-assets.yaml

**Purpose:** App icon, splash screen, error placeholder image, and adaptive icon configuration.

**Top-level keys:**
- `appIconPath`
- `splashImage`
- `errorImagePath`
- `androidAdaptiveIcon`

**Schema:**
```yaml
appIconPath: projects/xxx/assets/icon.jpg           # GCS path to app icon

splashImage:
  path: projects/xxx/assets/splash.png              # GCS path to splash image
  fit: FF_BOX_FIT_COVER                             # Image fit mode
  dimensions:
    width:
      percentOfScreenSizeValue:
        inputValue: 60                              # Width as % of screen
    height: {}                                      # Auto height
  backgroundColor:
    themeColor: PRIMARY_BACKGROUND                  # Splash background color
  preLoadingColor:
    value: "4294967295"                             # Color shown before splash loads (white)
  disableForWeb: true                               # Skip splash on web platform

errorImagePath: projects/xxx/assets/default-image.png  # Fallback image for broken images

androidAdaptiveIcon:
  foregroundImagePath: projects/xxx/assets/icon.jpg # Adaptive icon foreground layer
  backgroundColor:
    value: "4294967295"                             # Adaptive icon background color (white)
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `appIconPath` | string | GCS storage path to the main app icon image. |
| `splashImage.path` | string | GCS storage path to the splash screen image. |
| `splashImage.fit` | enum | Image box fit. `FF_BOX_FIT_COVER`, `FF_BOX_FIT_CONTAIN`, `FF_BOX_FIT_FILL`, etc. |
| `splashImage.dimensions.width.percentOfScreenSizeValue.inputValue` | int | Splash image width as a percentage of screen width. |
| `splashImage.backgroundColor` | color ref | Background color behind the splash image. Uses theme token or raw ARGB value. |
| `splashImage.preLoadingColor.value` | string | Raw ARGB int shown before splash assets load. `"4294967295"` = white. |
| `splashImage.disableForWeb` | bool | If true, splash screen is not shown on web builds. |
| `errorImagePath` | string | GCS path to the placeholder image shown when an image fails to load. |
| `androidAdaptiveIcon.foregroundImagePath` | string | Foreground layer image for Android adaptive icons. |
| `androidAdaptiveIcon.backgroundColor` | color ref | Background layer color for Android adaptive icons. |

---

## platforms.yaml

**Purpose:** Platform build target toggles.

**Top-level keys:**
- `enableWeb`

**Schema:**
```yaml
enableWeb: true                        # Enable web platform build target
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `enableWeb` | bool | Whether the project supports web as a build target. |

---

## library-values.yaml

**Purpose:** Values passed to FlutterFlow library dependencies. When a project imports another FF project as a library, the library may define parameters that the consuming project must supply.

**Top-level keys:**
- `libraryValues`

**Schema:**
```yaml
libraryValues:
  - parameter:
      identifier:
        name: appName                  # Parameter name defined by the library
        key: vdy3rp                    # Parameter key
        projectId: flogger-lib-oanjax  # Library project ID that owns this param
      defaultValue: {}                 # Library-defined default (often empty)
      dataType:
        scalarType: String
        nonNullable: true              # Whether null is allowed
    value:
      inputValue:
        serializedValue: veriXXa       # The value this project passes to the library
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `libraryValues` | list | All parameter values being passed to imported libraries. |
| `libraryValues[].parameter.identifier.name` | string | Parameter name as defined by the library. |
| `libraryValues[].parameter.identifier.key` | string | Unique parameter key. |
| `libraryValues[].parameter.identifier.projectId` | string | The FF project ID of the library that defines this parameter. |
| `libraryValues[].parameter.dataType` | object | Same type system as app-state (`scalarType`, `listType`, `nonNullable`). |
| `libraryValues[].value.inputValue.serializedValue` | string | The actual value this project supplies to the library parameter. |

---

## library-configurations/

**Purpose:** Route overrides for pages imported from FlutterFlow library dependencies. One file per imported library.

**File pattern:** `library-configurations/id-{projectId}.yaml`

**Schema:**
```yaml
projectId: common-utility-lib-hy7wrl   # Library project ID

routeOverrides:
  - pageKey: Scaffold_5j0fh6iw        # Scaffold key of the library page to override
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `projectId` | string | The FF project ID of the library. Matches the file name pattern. |
| `routeOverrides` | list | Pages from the library whose routes are overridden in this project. |
| `routeOverrides[].pageKey` | Scaffold ID | The scaffold key of the library page being overridden. |

> Note: Each imported library gets its own file under `library-configurations/`. The file key follows the pattern `library-configurations/id-{projectId}`.

---

## download-code-settings.yaml

**Purpose:** Settings controlling how code is generated and exported when downloading or pushing to GitHub.

**Top-level keys:**
- `applyFixesToGithub`
- `applyFixesToDownload`

**Schema:**
```yaml
applyFixesToGithub: true               # Apply FF auto-fixes when pushing to GitHub
applyFixesToDownload: false            # Apply FF auto-fixes when downloading code
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `applyFixesToGithub` | bool | When true, FlutterFlow applies automatic code fixes during GitHub push. |
| `applyFixesToDownload` | bool | When true, FlutterFlow applies automatic code fixes when downloading code as a ZIP. |

---

## tests.yaml

**Purpose:** FlutterFlow integration test definitions.

**Top-level keys:**
- `rootGroup`

**Schema:**
```yaml
rootGroup: {}                          # Root test group (empty when no tests defined)
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `rootGroup` | object | The root test group container. Empty object `{}` when no integration tests have been created. |

> Note: This file is a placeholder when no tests are defined. Test groups and individual test cases are nested within `rootGroup` when tests are created through the FF editor.

---

## custom-file/id-MAIN

**Purpose:** Startup action configuration for the app's `main()` function. Controls which custom actions run before and after app initialization (Firebase, state management, RevenueCat, etc.). The related sub-file `custom-file/id-MAIN/custom-file-code.dart` contains the generated Dart source for `main.dart`.

> **This file only exists when it has content.** If all actions and parameters are removed (via UI or API), the file disappears from the server (API returns 404). It reappears when a user adds an action or parameter in the FF editor.

> **WARNING: Pushing any `custom-file` deletes siblings.** The API treats all `custom-file/id-*` keys as a single collection. Pushing this file alone will delete all other custom files (ANDROID_MANIFEST, PROGUARD, BUILD_GRADLE, etc.). **Always include all existing `custom-file` entries in the same push payload.** See [API Limitation #10](../flutterflow-api-limitations.md#10-pushing-one-custom-file-deletes-all-other-custom-file-entries).

> **Important — this is an abstraction layer.**
> The config file (`custom-file/id-MAIN`) controls what actions run at startup, and FlutterFlow generates the actual `main.dart` from it at build time. The Dart sub-file (`custom-file/id-MAIN/custom-file-code.dart`) is visible and readable but is **generated/read-only** — editing the config is the supported way to modify startup behavior.

> **`isUnlocked` behavior:**
> - `false` (default) — FF fully manages `main.dart`. You can only add/remove INITIAL/FINAL actions via the config. The Dart code is regenerated from project settings at build time.
> - `true` — Raw Dart editing is enabled in the FF editor. When unlocked, a `fullContent` field appears on the config containing the full Dart source as an escaped string. The Dart sub-file is still readable via the API.
>
> **Cannot push code via the API when unlocked.** Attempting to push to the `.dart` sub-file collapses the content into the `fullContent` field on the config and does not actually update the editor. To modify `main.dart` when unlocked, **instruct the user to edit it directly in the FlutterFlow editor**.

**Top-level keys:**
- `type`
- `identifier` (appears once the file has been customized in FF editor)
- `isUnlocked`
- `fullContent` (only when `isUnlocked: true`)
- `actions`
- `parameters`

**Schema:**
```yaml
type: MAIN                               # File type identifier (always MAIN for this file)
identifier:
  name: main.dart                        # Appears once the file has been customized in FF editor
isUnlocked: false                        # Whether custom Dart edits are unlocked in FF editor

actions:
  - type: INITIAL_ACTION                 # Runs BEFORE app initialization
    identifier:
      name: changeStatusBarColorRed      # Custom action name
      key: d8rqwp                        # Unique action key
  - type: FINAL_ACTION                   # Runs AFTER app initialization but before runApp()
    identifier:
      key: 4lla8                         # Name is optional if action has no display name
  - type: INITIAL_ACTION
    identifier:
      name: refreshRemoteConfigForDev
      key: hfpkf
  - type: FINAL_ACTION
    identifier:
      name: pushfireInitialize (PushFire-Lib)
      key: mtd59
      projectId: push-fire-lib-mblt3v    # Library project ID (present for library actions)

parameters:                              # Template variables (same structure as ANDROID_MANIFEST)
  kdq2rm:                                # Parameter ID
    parameter:
      identifier:
        name: myVar                      # Variable name — use {{myVar}} in unlocked code
      dataType:
        scalarType: String               # Data type
    value:
      inputValue:
        serializedValue: some value      # Default value
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `type` | string | Always `MAIN` for this file. |
| `identifier.name` | string | Always `main.dart`. Appears once the file has been customized. |
| `isUnlocked` | bool | If `false`, FF manages `main.dart` automatically. If `true`, raw Dart editing is enabled in FF editor and `fullContent` field appears. |
| `fullContent` | string | Only present when `isUnlocked: true`. Contains the full Dart source as an escaped string. **Read-only via API** — cannot be pushed; instruct users to edit in FF editor. |
| `actions` | list | Ordered list of custom actions that run during app startup. |
| `actions[].type` | enum | `INITIAL_ACTION` (runs before app init) or `FINAL_ACTION` (runs after app init, before `runApp()`). |
| `actions[].identifier.name` | string | Human-readable action name. Optional — some actions only have a key. |
| `actions[].identifier.key` | string | Unique action key. Required. |
| `actions[].identifier.projectId` | string | Present only for library actions. References the FF project ID of the library that defines the action. |
| `parameters` | map | Template variables, keyed by parameter ID. Same structure as `custom-file/id-ANDROID_MANIFEST` parameters. Use `{{variableName}}` syntax in unlocked Dart code. |

### Generated Dart execution order

The sub-file `custom-file/id-MAIN/custom-file-code.dart` contains the full generated `main()` function. Actions map to specific positions in the execution order:

```
1.  Library value setup          (library FINAL_ACTIONs with projectId — e.g. pushfire API key)
2.  await initFirebase()
3.  // Start initial custom actions code
4.    await actions.changeStatusBarColorRed()    ← INITIAL_ACTION
5.    await actions.refreshRemoteConfigForDev()  ← INITIAL_ACTION
6.  // End initial custom actions code
7.  FFAppState init + persisted state
8.  RevenueCat init
9.  Crashlytics setup
10. RemoteConfig + AppCheck init
11. // Start final custom actions code
12.   await actions.oneSignalInitializer()       ← FINAL_ACTION
13. // End final custom actions code
14. runApp()
```

- **INITIAL_ACTIONs** run early — after Firebase init but **before** app state, RevenueCat, Crashlytics, and other service initialization.
- **FINAL_ACTIONs** run late — **after** all service initialization, just before `runApp()`.
- **Library actions** (with `projectId`) are handled separately via library value setup at the top of `main()`, not in the initial/final action blocks.
- The Dart code is **regenerated by FF at build time**. When `isUnlocked: true`, the source also appears as `fullContent` on the config, but **pushing edits to either file does not work** — the API accepts the push but changes are not reflected correctly in the FF editor. Always instruct users to make `main.dart` edits directly in FlutterFlow.

---

## custom-file/id-ANDROID_MANIFEST

**Purpose:** Allows injecting custom XML snippets into specific locations of the generated `AndroidManifest.xml`. Like `permissions.yaml`, this is an abstraction layer — you don't edit the manifest directly. Instead you define "hooks" (XML injection points) and "parameters" (template variables).

> **This file only exists when it has content.** If all hooks and parameters are removed (via UI or API), the file disappears from the server (API returns 404). It reappears when a user adds a hook or parameter in the FF editor.

> **WARNING: Pushing any `custom-file` deletes siblings.** The API treats all `custom-file/id-*` keys as a single collection. Pushing this file alone will delete all other custom files (MAIN, PROGUARD, BUILD_GRADLE, etc.). **Always include all existing `custom-file` entries in the same push payload.** See [API Limitation #10](../flutterflow-api-limitations.md#10-pushing-one-custom-file-deletes-all-other-custom-file-entries).

> **Important — this is NOT the AndroidManifest.xml itself.**
> This is FlutterFlow's configuration that controls **XML injection into the generated manifest** at build time. The file only appears after a user adds at least one custom tag in the FF editor (Settings > Custom Code > Custom Files > AndroidManifest.xml).

**Top-level keys:**
- `type`
- `identifier`
- `hooks`
- `parameters`

### Hook Types

Three hook types control where XML is injected in the generated `AndroidManifest.xml`:

| Hook Type | Where it injects in AndroidManifest.xml |
|---|---|
| `MANIFEST_ACTIVITY_TAG` | Inside the `<activity>` tag — use for intent filters, meta-data on the main activity |
| `MANIFEST_APPLICATION_TAG` | Inside the `<application>` tag — use for services, receivers, meta-data at app level |
| `MANIFEST_APP_COMPONENT_TAG` | Top-level, outside `<application>` — use for `<uses-permission>`, `<queries>`, or other root-level elements |

### Parameters (Template Variables)

- Parameters are template variables defined with a name, data type, and value.
- Referenced in hook `content` using `{{variableName}}` syntax (double curly braces).
- At build time, FF replaces `{{variableName}}` with the parameter's value in the generated manifest.
- Useful for keeping values like API keys, hosts, or schemes configurable without editing each hook.

**Schema:**
```yaml
type: ANDROID_MANIFEST                     # File type identifier (always ANDROID_MANIFEST)
identifier:
  name: AndroidManifest.xml                # Always AndroidManifest.xml

hooks:                                     # List of XML injection hooks
  - type: MANIFEST_ACTIVITY_TAG            # Injects inside <activity> tag
    identifier:
      name: metadata                       # Human-readable hook name
      key: uren6h                          # Unique 6-char alphanumeric key
    content: <data android:scheme="http" android:host="perkspass.page.link"/>  # Raw XML to inject

  - type: MANIFEST_APPLICATION_TAG         # Injects inside <application> tag
    identifier:
      name: appplication tag
      key: 9kbunj
    content: <data android:scheme="http" android:host="perkspass.page.link"/>

  - type: MANIFEST_APP_COMPONENT_TAG       # Injects at top level, outside <application>
    identifier:
      name: app component tag
      key: 2tw0gd
    content: <data android:scheme="http" android:host="perkspass.page.link"/>

parameters:                                # Template variables referenced in hook content
  upm7wd:                                  # Parameter key
    parameter:
      identifier:
        name: newVar                       # Variable name (referenced as {{newVar}} in hook content)
      dataType:
        scalarType: String                 # Data type (String, Integer, etc.)
    value:
      inputValue:
        serializedValue: This is the var value  # The variable's value at build time
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `type` | string | Always `ANDROID_MANIFEST` for this file. |
| `identifier.name` | string | Always `AndroidManifest.xml`. |
| `hooks` | list | List of XML injection hooks. Each hook injects content at a specific location in the manifest. |
| `hooks[].type` | enum | `MANIFEST_ACTIVITY_TAG`, `MANIFEST_APPLICATION_TAG`, or `MANIFEST_APP_COMPONENT_TAG`. |
| `hooks[].identifier.name` | string | Human-readable hook name. **Must not contain hyphens** — the FF editor rejects them but the API accepts them (validation gap). |
| `hooks[].identifier.key` | string | Unique 6-char alphanumeric key. |
| `hooks[].content` | string | Raw XML string to inject. Must be properly quoted in YAML when containing angle brackets or special characters. |
| `parameters` | map | Map of parameter key to parameter definition. |
| `parameters.<key>.parameter.identifier.name` | string | Variable name. Referenced in hook `content` as `{{variableName}}`. |
| `parameters.<key>.parameter.dataType.scalarType` | enum | Data type (`String`, `Integer`, `Double`, `Boolean`, etc.). |
| `parameters.<key>.value.inputValue.serializedValue` | string | The variable's value, substituted into hook content at build time. |

**API capabilities:**

| Operation | Status | Notes |
|---|---|---|
| Reading | Works | Full config with hooks and parameters is readable. |
| Adding hooks via API | Works | New hooks pushed successfully and appear in FF editor. |
| Adding parameters via API | Works | New variables pushed successfully and appear in FF editor. |
| Editing existing hooks | Works | Content and name changes are reflected. |
| Hook name validation gap | Caution | The API accepts hook names with hyphens, but the FF editor rejects them as "Name contains invalid character." Use camelCase or spaces for names. |
| XML content quoting | Caution | When hook content contains XML angle brackets (e.g., `<meta-data .../>`), wrap the content value in double quotes in the YAML to prevent parsing issues. |

---

## custom-file/id-INFO_PLIST

**Purpose:** Allows injecting custom properties into the generated `Info.plist` for iOS builds, and defining template variables for dynamic values. Like `ANDROID_MANIFEST`, this is an abstraction layer — you define "hooks" (plist property injection) and "parameters" (template variables).

> **This file only exists when it has content.** If all hooks and parameters are removed (via UI or API), the file disappears from the server (API returns 404). It reappears when a user adds a hook or parameter in the FF editor.

> **WARNING: Pushing any `custom-file` deletes siblings.** The API treats all `custom-file/id-*` keys as a single collection. Pushing this file alone will delete all other custom files (MAIN, ANDROID_MANIFEST, PROGUARD, BUILD_GRADLE, etc.). **Always include all existing `custom-file` entries in the same push payload.** See [API Limitation #10](../flutterflow-api-limitations.md#10-pushing-one-custom-file-deletes-all-other-custom-file-entries).

> **Important — this is NOT the Info.plist itself.**
> This is FlutterFlow's configuration that controls **property injection into the generated Info.plist** at build time. The file only appears after a user adds at least one property in the FF editor (Settings > Custom Code > Custom Files > Info.plist).

**Top-level keys:**
- `type`
- `identifier`
- `hooks`
- `parameters`

### Hook Types

Only one hook type:

| Hook Type | Where it injects in Info.plist |
|---|---|
| `INFO_PLIST_PROPERTY` | Inside the root `<dict>` — use for adding `<key>`/`<value>` pairs (strings, booleans, arrays, etc.) |

### Parameters (Template Variables)

Same pattern as ANDROID_MANIFEST — parameters are template variables that can be referenced in hook `content` using `{{variableName}}` syntax. Values can come from literal input or environment variables.

### Schema

```yaml
type: INFO_PLIST
identifier:
  name: Info.plist

hooks:                                       # List of plist property injection hooks
  - type: INFO_PLIST_PROPERTY                # Only hook type for Info.plist
    identifier:
      name: livetag                          # Human-readable hook name
      key: gh2m0b                            # Unique 6-char alphanumeric key
    content: "<key>live</key>\n<string>value</string>"  # Raw plist XML to inject

parameters:                                  # Template variables
  zini8l:                                    # Parameter key
    parameter:
      identifier:
        name: fsdafd                         # Variable name — use {{fsdafd}} in hook content
      dataType:
        scalarType: String                   # Data type (String, Integer, etc.)
    value:
      inputValue:
        serializedValue: safdsaf             # Literal value
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `type` | string | Always `INFO_PLIST` for this file. |
| `identifier.name` | string | Always `Info.plist`. |
| `hooks` | list | List of plist property injection hooks. Each hook injects a key-value pair into the root `<dict>`. |
| `hooks[].type` | enum | Always `INFO_PLIST_PROPERTY`. |
| `hooks[].identifier.name` | string | Human-readable hook name. |
| `hooks[].identifier.key` | string | Unique 6-char alphanumeric key. |
| `hooks[].content` | string | Raw plist XML to inject. Typically `<key>name</key>\n<string>value</string>` or similar plist entries. Must be properly escaped in YAML. |
| `parameters` | map | Map of parameter key to parameter definition. |
| `parameters.<key>.parameter.identifier.name` | string | Variable name. Referenced in hook `content` as `{{variableName}}`. |
| `parameters.<key>.parameter.dataType.scalarType` | enum | Data type (`String`, `Integer`, `Double`, `Boolean`, etc.). |
| `parameters.<key>.value` | object | Value source — either `inputValue.serializedValue` (literal) or `variable` (environment reference). |

### Parameter value sources

Parameters support two value sources:

**Literal value:**
```yaml
value:
  inputValue:
    serializedValue: my-value              # Hardcoded value
```

**Environment variable reference:**
```yaml
value:
  variable:
    source: DEV_ENVIRONMENT
    baseVariable:
      environmentValue:
        identifier:
          name: myEnvVar                   # References environment-settings.yaml
          key: eji5p6
```

### Hook content examples

**Simple string property:**
```yaml
content: "<key>MyCustomKey</key>\n<string>MyCustomValue</string>"
```

**Boolean property:**
```yaml
content: "<key>MyFeatureFlag</key>\n<true/>"
```

**Array property:**
```yaml
content: "<key>LSApplicationQueriesSchemes</key>\n<array>\n  <string>myapp</string>\n  <string>myapp-dev</string>\n</array>"
```

**API capabilities:**

| Operation | Status | Notes |
|---|---|---|
| Reading config | Works | Full hook and parameter data returned. |
| Adding hooks via API | Expected to work | Same structure as ANDROID_MANIFEST hooks. |
| Adding parameters via API | Expected to work | Same structure as other custom file parameters. |
| Hook name validation gap | Caution | Same as ANDROID_MANIFEST — avoid hyphens in names, use camelCase or spaces. |

### Code sub-file (`custom-file/id-INFO_PLIST/custom-file-code.dart`)

Contains the full generated `Info.plist` XML. This is the complete plist including all standard iOS keys (bundle identifiers, permissions, URL schemes, etc.) plus any injected hook content. It is **read-only** — modifications should be made through the hooks/parameters config, not by editing the XML directly.

---

## custom-file/id-ENTITLEMENTS

**Purpose:** Allows injecting custom entitlements into the generated `Runner.entitlements` file for iOS builds. Entitlements declare app capabilities such as push notifications, App Groups, iCloud, associated domains, and other iOS-specific permissions.

> **This file only exists when it has content.** If all hooks and parameters are removed (via UI or API), the file disappears from the server (API returns 404). It reappears when a user adds an entitlement or parameter in the FF editor.

> **WARNING: Pushing any `custom-file` deletes siblings.** The API treats all `custom-file/id-*` keys as a single collection. Pushing this file alone will delete all other custom files (MAIN, ANDROID_MANIFEST, INFO_PLIST, etc.). **Always include all existing `custom-file` entries in the same push payload.** See [API Limitation #10](../flutterflow-api-limitations.md#10-pushing-one-custom-file-deletes-all-other-custom-file-entries).

> **Important — this is an abstraction layer.**
> This config controls **entitlement injection into the generated `Runner.entitlements`** at build time. The file only appears after a user adds at least one entitlement in the FF editor (Settings > Custom Code > Custom Files > Runner.entitlements).

**Top-level keys:**
- `type`
- `identifier`
- `hooks`
- `parameters`

### Hook Types

Only one hook type:

| Hook Type | Where it injects in Runner.entitlements |
|---|---|
| `ENTITLEMENT` | Inside the root `<dict>` of the entitlements plist — use for adding capability key-value pairs |

### Schema

```yaml
type: ENTITLEMENTS
identifier:
  name: Runner.entitlements

hooks:
  - type: ENTITLEMENT                            # Only hook type for entitlements
    identifier:
      name: environemnt                          # Human-readable hook name
      key: 5x527x                               # Unique 6-char alphanumeric key
    content: "<key>aps-environment</key>\n<string>development</string>"  # Plist XML to inject

parameters:                                      # Template variables — same as all other custom files
  f4cahu:
    parameter:
      identifier:
        name: variable1                          # Variable name — use {{variable1}} in hook content
      dataType:
        scalarType: String
    value:
      inputValue:
        serializedValue: clear value             # Default value
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `type` | string | Always `ENTITLEMENTS` for this file. |
| `identifier.name` | string | Always `Runner.entitlements`. |
| `hooks` | list | List of entitlement injection hooks. Each hook injects a capability key-value pair into the entitlements plist. |
| `hooks[].type` | enum | Always `ENTITLEMENT`. |
| `hooks[].identifier.name` | string | Human-readable name for the entitlement. |
| `hooks[].identifier.key` | string | Unique 6-char alphanumeric key. |
| `hooks[].content` | string | Raw plist XML to inject. Typically `<key>capability-name</key>` followed by a value (`<string>`, `<true/>`, `<array>`, etc.). Must be properly escaped in YAML. |
| `parameters` | map | Template variables keyed by parameter ID. Use `{{variableName}}` in `content` to reference them. Same structure as all other custom files. |

### Common entitlement content examples

**Push notifications (development):**
```yaml
content: "<key>aps-environment</key>\n<string>development</string>"
```

**Push notifications (production):**
```yaml
content: "<key>aps-environment</key>\n<string>production</string>"
```

**Associated domains (for universal links):**
```yaml
content: "<key>com.apple.developer.associated-domains</key>\n<array>\n  <string>applinks:example.com</string>\n</array>"
```

**App Groups:**
```yaml
content: "<key>com.apple.security.application-groups</key>\n<array>\n  <string>group.com.example.myapp</string>\n</array>"
```

### API capabilities

| Operation | Status | Notes |
|---|---|---|
| Reading config | Works | Full hook and parameter data returned. |
| Adding hooks via API | Expected to work | Same structure as other custom file hooks. |
| Adding parameters via API | Expected to work | Same structure as other custom file parameters. |
| Hook name validation gap | Caution | Same as other custom files — avoid hyphens in names, use camelCase or spaces. |

---

## custom-file/id-APP_DELEGATE

**Purpose:** Allows injecting custom Swift code into the generated `AppDelegate.swift` for iOS builds. Supports import statements and initialization code that runs during the iOS app launch sequence.

> **This file only exists when it has content.** If all hooks and parameters are removed (via UI or API), the file disappears from the server (API returns 404). It reappears when a user adds a hook or parameter in the FF editor.

> **WARNING: Pushing any `custom-file` deletes siblings.** The API treats all `custom-file/id-*` keys as a single collection. Pushing this file alone will delete all other custom files (MAIN, ANDROID_MANIFEST, INFO_PLIST, etc.). **Always include all existing `custom-file` entries in the same push payload.** See [API Limitation #10](../flutterflow-api-limitations.md#10-pushing-one-custom-file-deletes-all-other-custom-file-entries).

> **Important — this is an abstraction layer.**
> This config controls **Swift code injection into the generated `AppDelegate.swift`** at build time. The file only appears after a user adds at least one hook in the FF editor (Settings > Custom Code > Custom Files > AppDelegate.swift).

**Top-level keys:**
- `type`
- `identifier`
- `hooks`
- `parameters`

### Hook Types

Two hook types control where Swift code is injected in the generated `AppDelegate.swift`:

| Hook Type | Where it injects in AppDelegate.swift |
|---|---|
| `APP_DELEGATE_IMPORT_HOOK` | At the top of the file — use for `import` statements |
| `APP_DELEGATE_INITIALIZATION_HOOK` | Inside `application(_:didFinishLaunchingWithOptions:)` — use for SDK init calls and setup code |

### Schema

```yaml
type: APP_DELEGATE
identifier:
  name: AppDelegate.swift

hooks:
  - type: APP_DELEGATE_IMPORT_HOOK               # Injects at the top of the file (imports)
    identifier:
      name: UIkitimprot                          # Human-readable hook name
      key: rtmoen                                # Unique 6-char alphanumeric key
    content: import UIKit                        # Swift import statement

  - type: APP_DELEGATE_INITIALIZATION_HOOK       # Injects inside didFinishLaunchingWithOptions
    identifier:
      name: logsinit                             # Human-readable hook name
      key: 2b582i                                # Unique 6-char alphanumeric key
    content: Logs.init()                         # Swift initialization code

parameters:                                      # Template variables — same as all other custom files
  74q7xg:
    parameter:
      identifier:
        name: vars1                              # Variable name — use {{vars1}} in hook content
      dataType:
        scalarType: String
    value:
      inputValue:
        serializedValue: var val                 # Default value
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `type` | string | Always `APP_DELEGATE` for this file. |
| `identifier.name` | string | Always `AppDelegate.swift`. |
| `hooks` | list | List of Swift code injection hooks. |
| `hooks[].type` | enum | `APP_DELEGATE_IMPORT_HOOK` (imports) or `APP_DELEGATE_INITIALIZATION_HOOK` (init code). |
| `hooks[].identifier.name` | string | Human-readable name for the hook. |
| `hooks[].identifier.key` | string | Unique 6-char alphanumeric key. |
| `hooks[].content` | string | Raw Swift code to inject. For imports: a single `import` statement. For initialization: Swift code that runs during app launch. |
| `parameters` | map | Template variables keyed by parameter ID. Use `{{variableName}}` in `content` to reference them. Same structure as all other custom files. |

### Generated AppDelegate execution order

The generated `AppDelegate.swift` follows this structure:

```
1.  import Flutter                              ← Standard Flutter import
2.  import UIKit                                ← APP_DELEGATE_IMPORT_HOOK entries
3.  import MySDK                                ← APP_DELEGATE_IMPORT_HOOK entries
4.
5.  @UIApplicationMain
6.  class AppDelegate: FlutterAppDelegate {
7.    override func application(...) -> Bool {
8.      GeneratedPluginRegistrant.register(with: self)
9.      Logs.init()                              ← APP_DELEGATE_INITIALIZATION_HOOK entries
10.     MySDK.configure()                        ← APP_DELEGATE_INITIALIZATION_HOOK entries
11.     return super.application(...)
12.   }
13. }
```

- **Import hooks** are placed at the top of the file alongside the standard Flutter/UIKit imports.
- **Initialization hooks** are placed inside `application(_:didFinishLaunchingWithOptions:)` after plugin registration but before the `return` statement.

### Common hook content examples

**Import a framework:**
```yaml
- type: APP_DELEGATE_IMPORT_HOOK
  identifier:
    name: firebaseImport
    key: abc123
  content: import Firebase
```

**Initialize an SDK:**
```yaml
- type: APP_DELEGATE_INITIALIZATION_HOOK
  identifier:
    name: firebaseInit
    key: def456
  content: FirebaseApp.configure()
```

**Multi-line initialization:**
```yaml
- type: APP_DELEGATE_INITIALIZATION_HOOK
  identifier:
    name: oneSignalSetup
    key: ghi789
  content: "OneSignal.initialize(\"{{appId}}\")\nOneSignal.Notifications.requestPermission({ accepted in })"
```

### API capabilities

| Operation | Status | Notes |
|---|---|---|
| Reading config | Works | Full hook and parameter data returned. |
| Adding hooks via API | Expected to work | Same structure as other custom file hooks. |
| Adding parameters via API | Expected to work | Same structure as other custom file parameters. |
| Hook name validation gap | Caution | Same as other custom files — avoid hyphens in names, use camelCase or spaces. |

---

## custom-file/id-PROGUARD

**Purpose:** Allows injecting custom ProGuard rules into the generated `proguard-rules.pro` file for Android builds. Controls code shrinking, obfuscation, and optimization rules.

> **This file only exists when it has content.** If all hooks and parameters are removed (via UI or API), the file disappears from the server (API returns 404). It reappears when a user adds a rule or parameter in the FF editor.

> **WARNING: Pushing any `custom-file` deletes siblings.** The API treats all `custom-file/id-*` keys as a single collection. Pushing this file alone will delete all other custom files (MAIN, ANDROID_MANIFEST, BUILD_GRADLE, etc.). **Always include all existing `custom-file` entries in the same push payload.** See [API Limitation #10](../flutterflow-api-limitations.md#10-pushing-one-custom-file-deletes-all-other-custom-file-entries).

> **Important — this is an abstraction layer.**
> This config controls **rule injection into the generated `proguard-rules.pro`** at build time. The file only appears after a user adds at least one rule in the FF editor (Settings > Custom Code > Custom Files > proguard-rules.pro). Unlike `custom-file/id-MAIN`, there is no Dart code sub-file — ProGuard rules are plain text.

**Top-level keys:**
- `type`
- `identifier`
- `hooks`
- `parameters`

### Hook Types

Only one hook type:

| Hook Type | What it injects |
|---|---|
| `PROGUARD_RULE` | A ProGuard rule line (e.g., `-keep class com.example.** { *; }`) |

### Schema

```yaml
type: PROGUARD
identifier:
  name: proguard-rules.pro

hooks:
  - type: PROGUARD_RULE                       # Only hook type for ProGuard
    identifier:
      name: roleComment                       # Human-readable name
      key: z735am                             # Unique hook key
    content: "-keep class com.example.myapp.** { *; }"   # The ProGuard rule text

parameters:                                    # Template variables — same as MAIN and ANDROID_MANIFEST
  hgnzpn:
    parameter:
      identifier:
        name: myVar                            # Variable name — use {{myVar}} in rule content
      dataType:
        scalarType: String
    value:
      inputValue:
        serializedValue: some value            # Default value
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `type` | string | Always `PROGUARD` for this file. |
| `identifier.name` | string | Always `proguard-rules.pro`. |
| `hooks` | list | ProGuard rules to inject into the generated file. |
| `hooks[].type` | enum | Always `PROGUARD_RULE`. |
| `hooks[].identifier.name` | string | Human-readable name for the rule. |
| `hooks[].identifier.key` | string | Unique key (6 alphanumeric chars). |
| `hooks[].content` | string | The ProGuard rule text. |
| `parameters` | map | Template variables keyed by parameter ID. Use `{{variableName}}` in `content` to reference them. Same structure as MAIN and ANDROID_MANIFEST parameters. |

### API capabilities

| Operation | Status | Notes |
|---|---|---|
| Reading config | Works | Full hook and parameter data returned. |
| Adding hooks via API | Expected to work | Same structure as ANDROID_MANIFEST hooks. |
| Adding parameters via API | Expected to work | Same structure as MAIN/ANDROID_MANIFEST parameters. |
| Hook name validation gap | Caution | Same as ANDROID_MANIFEST — avoid hyphens in names, use camelCase or spaces. |

---

## custom-file/id-BUILD_GRADLE

**Purpose:** Allows injecting custom entries into specific sections of the generated `build.gradle` file for Android builds — plugins, dependencies, and repositories.

> **This file only exists when it has content.** If all hooks and parameters are removed (via UI or API), the file disappears from the server (API returns 404). It reappears when a user adds an entry or parameter in the FF editor.

> **WARNING: Pushing any `custom-file` deletes siblings.** The API treats all `custom-file/id-*` keys as a single collection. Pushing this file alone will delete all other custom files (MAIN, ANDROID_MANIFEST, PROGUARD, etc.). **Always include all existing `custom-file` entries in the same push payload.** See [API Limitation #10](../flutterflow-api-limitations.md#10-pushing-one-custom-file-deletes-all-other-custom-file-entries).

> **Important — this is an abstraction layer.**
> This config controls **injection into the generated `build.gradle`** at build time. The file only appears after a user adds at least one entry in the FF editor (Settings > Custom Code > Custom Files > build.gradle). No code sub-file — just config.

**Top-level keys:**
- `type`
- `identifier`
- `hooks`
- `parameters`

### Hook Types

Three hook types control where content is injected in the generated `build.gradle`:

| Hook Type | Where it injects in build.gradle |
|---|---|
| `BUILD_GRADLE_PLUGIN_HOOK` | Inside the `plugins { }` block — use for Gradle plugin declarations |
| `BUILD_GRADLE_DEPENDENCY_HOOK` | Inside the `dependencies { }` block — use for library dependencies |
| `BUILD_GRADLE_REPOSITORY_HOOK` | Inside the `repositories { }` block — use for custom Maven/artifact repositories |

### Schema

```yaml
type: BUILD_GRADLE
identifier:
  name: build.gradle

hooks:
  - type: BUILD_GRADLE_PLUGIN_HOOK
    identifier:
      name: gms                                      # Human-readable name
      key: t36afz                                    # Unique hook key
    content: id 'com.google.gms' version '4.4.2' apply false

  - type: BUILD_GRADLE_DEPENDENCY_HOOK
    identifier:
      name: gmsImpl
      key: 4bdxxs
    content: implementation 'com.google.firebase:firebase-analytics:21.5.0'

  - type: BUILD_GRADLE_REPOSITORY_HOOK
    identifier:
      name: maven
      key: mnz0zx
    content: "maven { url 'https://maven.google.com' }"

parameters:                                           # Template variables — use {{variableName}} in content
  9r3k4a:
    parameter:
      identifier:
        name: firstvar
      dataType:
        scalarType: String
    value:
      inputValue:
        serializedValue: var val
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `type` | string | Always `BUILD_GRADLE` for this file. |
| `identifier.name` | string | Always `build.gradle`. |
| `hooks` | list | Entries to inject into the generated build.gradle. |
| `hooks[].type` | enum | `BUILD_GRADLE_PLUGIN_HOOK`, `BUILD_GRADLE_DEPENDENCY_HOOK`, or `BUILD_GRADLE_REPOSITORY_HOOK`. |
| `hooks[].identifier.name` | string | Human-readable name for the entry. |
| `hooks[].identifier.key` | string | Unique key (6 alphanumeric chars). |
| `hooks[].content` | string | The Gradle code to inject. Quote values containing braces or special chars. |
| `parameters` | map | Template variables keyed by parameter ID. Use `{{variableName}}` in `content` to reference them. Same structure as all other custom files. |

### API capabilities

| Operation | Status | Notes |
|---|---|---|
| Reading config | Works | Full hook and parameter data returned. |
| Adding hooks via API | Expected to work | Same structure as ANDROID_MANIFEST hooks. |
| Adding parameters via API | Expected to work | Same structure as other custom file parameters. |
| Hook name validation gap | Caution | Same as ANDROID_MANIFEST — avoid hyphens in names, use camelCase or spaces. |
| Content quoting | Caution | Gradle syntax with braces (e.g., `maven { url '...' }`) should be wrapped in double quotes in the YAML. |

---

## mobile-deployment.yaml

**Purpose:** Mobile deployment configuration for Codemagic CI/CD, including App Store Connect credentials, build versioning, and Play Store settings.

> **WARNING:** This file contains **sensitive credentials** including App Store Connect private keys and Play Store credentials paths. Exercise extreme caution when reading or editing this file. Never log or expose its contents.

**Top-level keys:**
- `codemagicSettingsMap`

**Schema:**
```yaml
codemagicSettingsMap:
  PROD:                                  # Environment key (PROD, DEV, etc.)
    appStoreSettings:
      ascKeyId: AKUAKF2ZCH              # App Store Connect API Key ID
      ascIssuerId: 57e34d27-22ff-47c3-a187-a2cf6b1807b7  # ASC Issuer ID (UUID)
      ascPrivateKey: "<redacted>"        # ASC private key (PEM format) — SENSITIVE
      ascAppId: "6466313325"             # App Store app ID
    buildVersion:
      buildVersion: 1.1.8               # Marketing version (CFBundleShortVersionString)
      buildNumber: 110                   # Build number (CFBundleVersion / versionCode)
      lastSubmitted: 1.0.99+96          # Last version+build submitted to store
    playStoreSettings:
      playTrack: INTERNAL                # Play Store track: INTERNAL, ALPHA, BETA, PRODUCTION
      playstoreCredentialsPath: codemagic/.../.../playstore_credentials.json  # GCS path to credentials
      alias: mykey                       # Signing key alias
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `codemagicSettingsMap` | map | Keyed by environment (`PROD`, `DEV`, etc.). One entry per deployment environment. |
| `appStoreSettings.ascKeyId` | string | App Store Connect API Key ID. |
| `appStoreSettings.ascIssuerId` | string | App Store Connect Issuer ID (UUID format). |
| `appStoreSettings.ascPrivateKey` | string | **SENSITIVE.** App Store Connect private key in PEM format. |
| `appStoreSettings.ascAppId` | string | Numeric App Store app identifier. |
| `buildVersion.buildVersion` | string | Marketing version string (e.g., `1.1.8`). |
| `buildVersion.buildNumber` | int | Incremental build number. |
| `buildVersion.lastSubmitted` | string | Last version+build submitted to stores (format: `version+buildNumber`). |
| `playStoreSettings.playTrack` | enum | Play Store release track: `INTERNAL`, `ALPHA`, `BETA`, `PRODUCTION`. |
| `playStoreSettings.playstoreCredentialsPath` | string | GCS path to the Play Store service account credentials JSON. |
| `playStoreSettings.alias` | string | Android signing key alias. |

---

## web-publishing.yaml

**Purpose:** Web-specific publishing settings including SEO metadata, page title, status bar color, and screen orientation.

**Top-level keys:**
- `webSettings`

**Schema:**
```yaml
webSettings:
  PROD:                                  # Environment key (PROD, DEV, etc.)
    seoDescription: "Idaho's #1 Discount Pass"  # Meta description for SEO
    pageTitle: GoldPass                  # HTML <title> tag content
    statusBarColor:
      value: "4294046968"               # Status bar color (raw ARGB int as string)
      darkModeColor:
        value: "4280099880"             # Status bar color in dark mode
    orientation: PORTRAIT_PRIMARY        # Preferred screen orientation
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `webSettings` | map | Keyed by environment (`PROD`, `DEV`, etc.). |
| `webSettings.<ENV>.seoDescription` | string | Meta description tag content for search engines. |
| `webSettings.<ENV>.pageTitle` | string | HTML `<title>` value shown in browser tabs. |
| `webSettings.<ENV>.statusBarColor.value` | string | Raw ARGB integer as string for the browser theme/status bar color. |
| `webSettings.<ENV>.statusBarColor.darkModeColor.value` | string | Dark mode variant of the status bar color. |
| `webSettings.<ENV>.orientation` | enum | Preferred screen orientation. Known values: `PORTRAIT_PRIMARY`, `LANDSCAPE_PRIMARY`. |

---

## firebase-app-check.yaml

**Purpose:** Firebase App Check configuration for app attestation and abuse prevention.

**Top-level keys:**
- `enabled`
- `runTestModeDebugToken`

**Schema:**
```yaml
enabled: true                            # Master toggle for App Check
runTestModeDebugToken: 9218DDCD-D417-4E71-AFFF-A8A8616AECC6  # Debug token for test mode
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `enabled` | bool | Master toggle for Firebase App Check. |
| `runTestModeDebugToken` | string | UUID debug token used during development/testing. Allows bypassing App Check attestation in debug builds. |

---

## firebase-remote-config.yaml

**Purpose:** Firebase Remote Config field definitions with default values. Defines the parameters that can be fetched from Firebase Remote Config at runtime.

**Top-level keys:**
- `enabled`
- `fields`

**Schema:**
```yaml
enabled: true                            # Master toggle for Remote Config

fields:
  - parameter:
      identifier:
        name: newiOSVersion              # Parameter name
      dataType:
        scalarType: String               # Data type (String, Integer, Double, Boolean, etc.)
    serializedDefaultValue: 1.1.1        # Default value used when remote fetch fails
  - parameter:
      identifier:
        name: newAndroidVersion
      dataType:
        scalarType: String
    serializedDefaultValue: 1.1.1
  - parameter:
      identifier:
        name: minIosVersion
      dataType:
        scalarType: String
    serializedDefaultValue: 1.1.1
  - parameter:
      identifier:
        name: minAndroidVersion
      dataType:
        scalarType: String
    serializedDefaultValue: 1.1.1
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `enabled` | bool | Master toggle for Firebase Remote Config integration. |
| `fields` | list | All Remote Config parameter definitions. |
| `fields[].parameter.identifier.name` | string | Parameter name as it appears in the Firebase Remote Config console. |
| `fields[].parameter.dataType.scalarType` | enum | Data type: `String`, `Integer`, `Double`, `Boolean`, etc. |
| `fields[].serializedDefaultValue` | string | Default value used when the remote fetch fails or the parameter is not set in the Firebase console. |

---

## firestore-settings.yaml

**Purpose:** Firestore security rules, collection-level permissions, read visibility settings, validation hashes, and Cloud Storage rules configuration.

**Top-level keys:**
- `rules`
- `validation`
- `storageRules`

**Schema:**
```yaml
rules:
  collectionRules:
    k2ktdun9:                            # Collection key (matches Firestore collection key)
      creat:                             # NOTE: spelled "creat" not "create" — this is how FF spells it
        authenticatedUsers: {}
      read:
        everyone: {}
      update:
        authenticatedUsers: {}
      delete:
        noOne: {}
      isPublic: true                     # Whether the collection is publicly readable
    vz94s0kh:
      creat:
        authenticatedUsers: {}
      read:
        authenticatedUsers: {}
      update:
        authenticatedUsers: {}
      delete:
        authenticatedUsers: {}
      deleteWhenUserIsDeleted: true      # Cascade delete when the owning user is deleted
  usersCollectionReadVisibility: READ_VISIBILITY_SELF  # Users can only read their own document

validation:
  lastValidatedCollectionHash:
    Establishments: "106055806"          # Hash of last validated schema per collection
    Users: "130657010"
  mode: DISABLED                         # Validation mode: DISABLED, ENABLED, etc.

storageRules:
  excludeFromStorageRules: true          # Exclude this project from generating storage rules
  rules:
    userUploadsArePrivate: false         # Whether user-uploaded files are private by default
```

> **Important:** The YAML uses `creat` (not `create`) for the create permission key. This is how FlutterFlow actually spells it in the YAML. Do NOT attempt to "fix" this spelling — it is intentional and expected by the FF system.

**Permission values:** Each permission field (`creat`, `read`, `update`, `delete`) accepts one of three values: `everyone: {}`, `authenticatedUsers: {}`, or `noOne: {}`.

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `rules.collectionRules` | map | Keyed by collection key. One entry per Firestore collection. |
| `rules.collectionRules.<key>.creat` | permission | Create permission. Note: spelled `creat`, not `create`. |
| `rules.collectionRules.<key>.read` | permission | Read permission. |
| `rules.collectionRules.<key>.update` | permission | Update permission. |
| `rules.collectionRules.<key>.delete` | permission | Delete permission. |
| `rules.collectionRules.<key>.isPublic` | bool | Whether the collection allows public (unauthenticated) reads. |
| `rules.collectionRules.<key>.deleteWhenUserIsDeleted` | bool | Cascade delete: remove documents when the owning user account is deleted. |
| `rules.usersCollectionReadVisibility` | enum | Read visibility for the Users collection. Known value: `READ_VISIBILITY_SELF` (users can only read their own document). |
| `validation.lastValidatedCollectionHash` | map | Hash per collection name, used to detect schema changes since last validation. |
| `validation.mode` | enum | Validation mode: `DISABLED`, `ENABLED`. |
| `storageRules.excludeFromStorageRules` | bool | If true, this project does not generate Cloud Storage security rules. |
| `storageRules.rules.userUploadsArePrivate` | bool | Whether user-uploaded files default to private access. |

---

## algolia.yaml

**Purpose:** Algolia search integration configuration, including API credentials and indexed Firestore collections.

**Top-level keys:**
- `applicationId`
- `searchApiKey`
- `indexedCollections`
- `enabled`

**Schema:**
```yaml
applicationId: SUEUI0E453              # Algolia Application ID
searchApiKey: 5c8d18d950352fcf5e66ec8d5df04a66  # Algolia Search API key (public/search-only)
indexedCollections:
  - name: Establishments                # Firestore collection name
    key: k2ktdun9                       # Firestore collection key
enabled: true                           # Master toggle
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `applicationId` | string | Algolia Application ID. Found in the Algolia dashboard. |
| `searchApiKey` | string | Algolia Search-Only API key. This is the public key safe for client-side use — not the Admin API key. |
| `indexedCollections` | list | Firestore collections that are synced to Algolia indices. |
| `indexedCollections[].name` | string | Firestore collection name (human-readable). |
| `indexedCollections[].key` | string | Firestore collection key (matches keys in `firestore-settings.yaml`). |
| `enabled` | bool | Master toggle for Algolia search integration. |

---

## app-query-cache.yaml

**Purpose:** Configuration for cached database queries (request managers) that persist query results to avoid redundant fetches.

**Top-level keys:**
- `databaseRequestManagers`

**Schema:**
```yaml
databaseRequestManagers:
  - identifier:
      name: savedDeals                   # Cache entry name
      key: sefdr                         # Unique key
    originalNodeKeyRef:
      key: Container_s5rjtbgg            # Widget key where the query originates
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `databaseRequestManagers` | list | All cached query definitions. |
| `databaseRequestManagers[].identifier.name` | string | Human-readable name for the cached query. |
| `databaseRequestManagers[].identifier.key` | string | Unique key for the cache entry. |
| `databaseRequestManagers[].originalNodeKeyRef.key` | string | Widget key (typically `Container_*`) where the original database query is defined. Links the cache to its source widget. |

---

## material-theme.yaml

**Purpose:** Material Design version toggle controlling whether the app uses Material 2 or Material 3 design system.

**Top-level keys:**
- `useMaterial2`

**Schema:**
```yaml
useMaterial2: true                       # true = Material 2, false = Material 3
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `useMaterial2` | bool | When `true`, the app uses Material 2 theming. When `false` (or absent), the app uses Material 3. Material 3 introduces updated color schemes, typography, and widget shapes. |

---

## storyboard.yaml

**Purpose:** Editor-only metadata storing page positions on the FlutterFlow storyboard canvas. Has no functional impact on the built app.

**Top-level keys:**
- `storyboardPositions`

**Schema:**
```yaml
storyboardPositions:
  Scaffold_q2hw5kk7:                    # Scaffold ID of the page
    x: 1172.0366954890674               # Horizontal position on canvas
    y: 583.8096385491203                # Vertical position on canvas
  Scaffold_ih504krn:
    x: 803.2030987008528
    y: 582.2951003122512
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `storyboardPositions` | map | Keyed by Scaffold ID. One entry per page placed on the storyboard. |
| `storyboardPositions.<Scaffold_ID>.x` | double | Horizontal position (pixels) of the page on the storyboard canvas. |
| `storyboardPositions.<Scaffold_ID>.y` | double | Vertical position (pixels) of the page on the storyboard canvas. |

> Note: This is purely editor-level metadata used by the FlutterFlow storyboard view. It has no effect on the built application. Modifying these values only changes where pages appear on the visual canvas in the FF editor.

---

## date-picker.yaml

**Purpose:** Controls which Material date picker style is used in the app (legacy vs modern).

**Top-level keys:**
- `useLegacyDatePicker`

**Schema:**
```yaml
useLegacyDatePicker: false              # false = modern Material date picker, true = legacy style
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `useLegacyDatePicker` | bool | When `true`, the app uses the legacy Material date picker. When `false` (or absent), the app uses the modern Material date picker style. |

---

## theme/color-scheme

**Purpose:** Full color palette definition for the app. This is a **sub-file** of the `theme` file key — access it with file key `theme/color-scheme`, not just `theme`.

**Top-level keys:**
- `primary`, `secondary`, `tertiary`, `alternate`
- `primaryBackground`, `secondaryBackground`
- `primaryText`, `secondaryText`
- `accent1`, `accent2`, `accent3`, `accent4`
- `success`, `warning`, `error`, `info`
- `customPaletteColors`
- `darkModeEnabled`
- `displayDarkMode`

**Schema:**
```yaml
primary:                                  # Core Material colors
  value: "4279461852"                     # Light mode ARGB integer as string
  darkModeColor:
    value: "4279461852"                   # Dark mode ARGB integer as string
secondary:
  value: "4278190080"
  darkModeColor:
    value: "4294967295"
tertiary:
  value: "4280582880"
  darkModeColor:
    value: "4280582880"
alternate:
  value: "4282532418"
  darkModeColor:
    value: "4287937484"

primaryBackground:                        # Background colors
  value: "4294967295"
  darkModeColor:
    value: "4278190080"
secondaryBackground:
  value: "4294111986"
  darkModeColor:
    value: "4282532418"

primaryText:                              # Text colors
  value: "4278190080"
  darkModeColor:
    value: "4294967295"
secondaryText:
  value: "4282402630"
  darkModeColor:
    value: "4287996332"

accent1:                                  # Accent colors (accent1 through accent4)
  value: "4284572001"
  darkModeColor:
    value: "4293848814"
accent2:
  value: "4285887861"
  darkModeColor:
    value: "4292927712"
accent3:
  value: "4292927712"
  darkModeColor:
    value: "4285887861"
accent4:
  value: "4293848814"
  darkModeColor:
    value: "4284572001"

success:                                  # Semantic colors
  value: "4278493772"
  darkModeColor:
    value: "4278493772"
warning:
  value: "4294761484"
  darkModeColor:
    value: "4294761484"
error:
  value: "4293008445"
  darkModeColor:
    value: "4293008445"
info:
  value: "4280042644"
  darkModeColor:
    value: "4280042644"

customPaletteColors:                      # Project-specific named colors
  - value: "4294967295"
    paletteColorName: primaryBtnText      # Custom color name (used in bindings)
    darkModeColor:
      value: "4294967295"
  - value: "4292467161"
    paletteColorName: lineColor
    darkModeColor:
      value: "4280428591"
  - value: "2550136832"
    paletteColorName: barrierColor
    darkModeColor:
      value: "2550136832"

darkModeEnabled: true                     # Whether dark mode is available in the app
displayDarkMode: true                     # Whether dark mode toggle is shown in FF editor
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `primary` | color entry | Primary brand color. Each color entry has `value` (light mode) and `darkModeColor.value` (dark mode). |
| `secondary` | color entry | Secondary brand color. |
| `tertiary` | color entry | Tertiary accent color. |
| `alternate` | color entry | Alternate/surface variant color. |
| `primaryBackground` | color entry | Main background color. |
| `secondaryBackground` | color entry | Secondary/card background color. |
| `primaryText` | color entry | Primary text color. |
| `secondaryText` | color entry | Secondary/subtitle text color. |
| `accent1` - `accent4` | color entry | Four accent colors for highlights and decorations. |
| `success` | color entry | Semantic color for success states. |
| `warning` | color entry | Semantic color for warning states. |
| `error` | color entry | Semantic color for error states. |
| `info` | color entry | Semantic color for informational states. |
| `customPaletteColors` | list | Project-specific named colors. Each entry has `value`, `paletteColorName`, and `darkModeColor`. |
| `customPaletteColors[].paletteColorName` | string | Custom color name used in widget bindings and theme references. |
| `darkModeEnabled` | bool | When `true`, dark mode is available as an option in the built app. |
| `displayDarkMode` | bool | When `true`, the dark mode toggle is visible in the FlutterFlow editor. |

> Color values are raw ARGB integers stored as strings (e.g., `"4294967295"` = white/0xFFFFFFFF, `"4278190080"` = black/0xFF000000). Every color has both a light mode `value` and a `darkModeColor` variant. This is a sub-file: access it with file key `theme/color-scheme`, not just `theme`.

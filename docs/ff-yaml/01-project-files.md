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

userDefinedPermissions:
  - names:
      iosName: NSCameraUsageDescription          # iOS Info.plist key
      androidName: android.permission.           # Android manifest permission
    message:
      translationIdentifier:
        key: 6c6yuxd5
      textValue:
        inputValue: "This app requires camera access..."
```

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `permissionMessages` | list | Built-in FF permission types: `CAMERA`, `PHOTO_LIBRARY`, `MICROPHONE`, `LOCATION`, `NOTIFICATIONS`, etc. |
| `permissionMessages[].permissionType` | enum string | Required. Must be a recognized FF permission type. |
| `userDefinedPermissions` | list | Custom platform-level permission entries. |
| `userDefinedPermissions[].names.iosName` | string | iOS `Info.plist` key (e.g., `NSPhotoLibraryUsageDescription`). |
| `userDefinedPermissions[].names.androidName` | string | Android manifest permission string. |
| `*.message.textValue.inputValue` | string | User-facing permission rationale string. |
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

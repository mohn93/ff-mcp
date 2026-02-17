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

**Purpose:** Bottom navigation bar color configuration.

**Top-level keys:**
- `backgroundColor`
- `selectedIconColor`
- `unselectedIconColor`

**Schema:**
```yaml
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
| `backgroundColor.themeColor` | theme token | One of: `PRIMARY`, `SECONDARY`, `PRIMARY_BACKGROUND`, `SECONDARY_BACKGROUND`, `PRIMARY_TEXT`, `SECONDARY_TEXT`, `ACCENT1`-`ACCENT4`, etc. |
| `selectedIconColor` | color ref | Color when tab is active. |
| `unselectedIconColor` | color ref | Color when tab is inactive. |

> Note: Nav bar page tabs are configured per-page in the page scaffold YAML, not here. This file only controls colors.

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

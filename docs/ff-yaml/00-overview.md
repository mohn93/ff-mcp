# FlutterFlow Project Structure

Every FlutterFlow project is a collection of YAML files accessed via file keys. This document maps every file type and explains how file keys work.

---

## File taxonomy

| File key pattern | Purpose |
|---|---|
| `app-details` | App metadata: name, routing config, initial page, auth pages, theme mode, platform settings |
| `authentication` | Firebase/Supabase auth configuration, providers, login/signup page refs |
| `theme` | Typography definitions, color palette, breakpoints, widget defaults |
| `theme/color-scheme` | Full color palette: core, background, text, accent, semantic colors with dark mode variants |
| `folders` | Page and component folder organization (scaffold-to-folder mapping) |
| `app-state` | App-wide persisted state variables (shared across all pages) |
| `app-constants` | Read-only constants available app-wide |
| `app-assets` | Uploaded asset references (images, fonts, files) |
| `nav-bar` | Bottom navigation bar configuration (pages, icons, labels) |
| `app-bar` | App bar configuration |
| `permissions` | Platform permission declarations (CAMERA, LOCATION, etc.) — abstraction layer that FF maps to AndroidManifest.xml and Info.plist at build time |
| `revenue-cat` | RevenueCat paywall and entitlement configuration |
| `languages` | Internationalization strings and locale mappings |
| `page/id-Scaffold_XXX` | Page metadata: name, params, classModel (state fields), route config |
| `page/id-Scaffold_XXX/page-widget-tree-outline` | Widget tree hierarchy for the page (key refs only, no props) |
| `page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Widget_YYY` | Individual widget node: type, props, parameterValues, valueKey |
| `page/.../node/id-Widget_YYY/trigger_actions/id-TRIGGER/action/id-ZZZ` | Action definition attached to a widget trigger |
| `component/id-Container_XXX` | Component metadata: name, params, classModel |
| `component/id-Container_XXX/component-widget-tree-outline` | Component widget tree hierarchy |
| `component/id-Container_XXX/component-widget-tree-outline/node/id-Widget_YYY` | Component widget node |
| `api-endpoint/id-XXX` | API endpoint: URL, method, headers, body, response schema |
| `custom-actions/id-XXX` | Custom Dart action: name, params, return type, code |
| `custom-functions/id-XXX` | Custom Dart function: name, params, return type, code |
| `custom-widgets/id-XXX` | Custom Flutter widget: name, params, code |
| `data-structs/id-XXX` | Data structure (struct/class) definition with typed fields |
| `enums/id-XXX` | Enum definition with named values |
| `collections/id-XXX` | Firestore collection schema: fields, types, subcollections |
| `agent/id-XXX` | AI agent configuration |
| `custom-file/id-<TYPE>` | Custom file configs for native platform files. Known types: `MAIN` (main.dart startup actions), `ANDROID_MANIFEST` (XML injection hooks for AndroidManifest.xml), `INFO_PLIST` (plist property injection for Info.plist), `ENTITLEMENTS` (iOS capability entitlements for Runner.entitlements), `APP_DELEGATE` (Swift code injection for AppDelegate.swift), `PROGUARD` (ProGuard rule injection for proguard-rules.pro), `BUILD_GRADLE` (Gradle plugin/dependency/repository injection for build.gradle). Only appear after enabled in FF editor. Sub-file `custom-file/id-<TYPE>/custom-file-code.dart` contains generated source. |
| `environment-settings` | Per-environment configuration values (API URLs, keys) |
| `dependencies` | FlutterFlow library package dependencies |
| `custom-code-dependencies` | Dart/Flutter pub dependencies for custom code |
| `supabase` | Supabase connection config and database schema |
| `firebase-analytics` | Firebase Analytics settings |
| `firebase-crashlytics` | Firebase Crashlytics settings |
| `firebase-performance-monitoring` | Firebase Performance Monitoring settings |
| `firebase-app-check` | Firebase App Check configuration and debug token |
| `firebase-remote-config` | Firebase Remote Config — field definitions with default values |
| `firestore-settings` | Firestore security rules (per-collection CRUD permissions), storage rules, validation hashes |
| `push-notifications` | Push notification configuration |
| `google-maps` | Google Maps API keys per platform |
| `ad-mob` | AdMob advertising configuration |
| `algolia` | Algolia search integration — app ID, API key, indexed collections |
| `app-assets` | App icon, splash screen, error image settings |
| `platforms` | Platform enablement flags (web, etc.) |
| `mobile-deployment` | Codemagic CI/CD settings — App Store Connect credentials, build version/number, Play Store track, signing config |
| `web-publishing` | Web platform settings — SEO description, page title, status bar color, orientation |
| `library-values` | Values passed to FlutterFlow library dependencies |
| `library-configurations/id-<projectId>` | Route overrides for library pages |
| `download-code-settings` | Code download/GitHub push settings |
| `tests` | FlutterFlow test runner configuration |
| `app-query-cache` | Named database request cache managers |
| `date-picker` | Date picker style toggle (legacy vs modern Material date picker) |
| `material-theme` | Material Design version toggle (Material 2 vs Material 3) |
| `storyboard` | Editor-only page positions on the FF storyboard canvas (no functional impact) |
| `miscellaneous` | Misc app-level settings and feature flags |

---

## File key patterns

File keys are hierarchical paths used with the `get_project_yaml` and `update_project_yaml` MCP tools.

### Anatomy of a file key

```
page/id-Scaffold_tjgkshke/page-widget-tree-outline/node/id-Button_7c3kwr61
|    |                     |                         |    |
|    |                     |                         |    └─ Widget ID
|    |                     |                         └─ node segment (fixed)
|    |                     └─ Sub-file type
|    └─ Page scaffold ID (prefixed with id-)
└─ Top-level category
```

### Depth levels

| Level | Example key | What it returns |
|---|---|---|
| 0 | `app-details` | Entire config file |
| 1 | `page/id-Scaffold_XXX` | Page metadata only (name, params, state, route) |
| 2 | `page/id-Scaffold_XXX/page-widget-tree-outline` | Widget tree structure (key refs, no props) |
| 3 | `page/.../page-widget-tree-outline/node/id-Widget_YYY` | Single widget with all props |
| 4 | `page/.../node/id-Widget_YYY/trigger_actions/id-ON_TAP/action/id-ZZZ` | Single action definition |

### Component keys follow the same pattern

```
component/id-Container_XXX
component/id-Container_XXX/component-widget-tree-outline
component/id-Container_XXX/component-widget-tree-outline/node/id-Widget_YYY
```

Note: Components use `component-widget-tree-outline` (not `page-widget-tree-outline`).

---

## Critical rule: Node-level files

Widget children **must** be pushed as individual node files. They cannot be embedded inline in the page-level YAML.

### Why

The FlutterFlow API strips inline children from `page/id-Scaffold_XXX`. The page file only stores metadata (name, params, classModel, route). Widget data lives exclusively in the widget tree outline and node sub-files.

### What this means in practice

To add or modify widgets, you always push **multiple files** in a single `update_project_yaml` call:

```
update_project_yaml(projectId, {
  "page/id-Scaffold_XXX/page-widget-tree-outline":                    <tree outline YAML>,
  "page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Column_YYY": <column node YAML>,
  "page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Text_ZZZ":   <text node YAML>,
  "page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Button_AAA": <button node YAML>
})
```

### Tree outline format

The widget tree outline defines hierarchy via key references:

```yaml
node:
  key: Scaffold_XXX
  body:
    key: Column_YYY
    children:
      - key: Text_ZZZ
      - key: Button_AAA
```

Each `key` referenced here must have a corresponding `node/id-<key>` file pushed alongside it.

### Validation shortcut

Call `validate_yaml` on the tree outline first. It returns `"File is referenced but is empty"` for any node that is referenced but has no corresponding file -- telling you exactly which node files you need to create.

---

## ID generation

When creating new widgets, pages, or other entities, generate IDs following this pattern:

```
<TypePrefix>_<8 lowercase alphanumeric characters>
```

Examples:
- `Scaffold_k7m2x9p1`
- `Column_ab3def45`
- `Button_zz9wq2r8`
- `Text_mn4kp7s6`
- `Container_xy1abc23`

The prefix must match the widget/entity type exactly. The suffix should be unique within the project.

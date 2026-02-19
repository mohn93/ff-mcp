# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

An MCP (Model Context Protocol) server that wraps the FlutterFlow Project API, enabling AI-assisted FlutterFlow development. Published to npm as `flutterflow-mcp`. It exposes tools, resources, and prompts over stdio transport.

## Build & Run

```bash
npm run build          # TypeScript compile + chmod executable
npm run dev            # Watch mode (tsc --watch)
npm start              # Run the server (node build/index.js)
```

Tests use **vitest**. Run `npm test` to execute all tests. No linter is configured. Verify changes by running `npm run build` and `npm test`.

## Environment

Requires `FLUTTERFLOW_API_TOKEN` env var (Bearer token from FlutterFlow > Account Settings > API Token).

## Architecture

**Entry point:** `src/index.ts` — creates one `FlutterFlowClient` instance, registers all tools/resources/prompts on an MCP `StdioServerTransport`.

**API client:** `src/api/flutterflow.ts` — thin wrapper around `https://api.flutterflow.io/v2/`. All endpoints return `Promise<unknown>` — the tools handle response parsing.

**Critical encoding detail:** The `projectYamls` endpoint returns YAML as **base64-encoded ZIP**, not plain text. `src/utils/decode-yaml.ts` handles decoding. The `listPartitionedFileNames` endpoint returns file keys under `value.file_names` (snake_case, not camelCase).

### Registration Pattern

Every tool/resource/prompt follows the same pattern: a `register*` function that takes `(server, client?)` and calls `server.tool()`, `server.resource()`, or `server.prompt()`. New tools go in `src/tools/`, new prompts in `src/prompts/`, new resources in `src/resources/`. Register them in `src/index.ts`.

### Tools (20)

| Tool | File | Purpose |
|------|------|---------|
| `list_projects` | `tools/list-projects.ts` | List all FF projects |
| `list_project_files` | `tools/list-files.ts` | List all YAML file keys (large response) |
| `get_project_yaml` | `tools/get-yaml.ts` | Fetch + decode YAML by file key |
| `validate_yaml` | `tools/validate-yaml.ts` | Validate before pushing |
| `update_project_yaml` | `tools/update-yaml.ts` | Push YAML changes |
| `list_pages` | `tools/list-pages.ts` | Page index with names/folders (batched, 5 at a time) |
| `get_page_by_name` | `tools/get-page-by-name.ts` | Fetch page by human-readable name |
| `sync_project` | `tools/sync-project.ts` | Bulk download all YAML to local cache |
| `get_page_summary` | `tools/get-page-summary.ts` | Cache-based page summary (widget tree, actions, params) |
| `get_component_summary` | `tools/get-component-summary.ts` | Cache-based component summary |
| `find_component_usages` | `tools/find-component-usages.ts` | Find all pages/components using a component |
| `find_page_navigations` | `tools/find-page-navigations.ts` | Find all navigation actions targeting a page |
| `get_yaml_docs` | `tools/get-yaml-docs.ts` | Search/retrieve FF YAML reference docs by topic or file |
| `get_app_state` | `tools/get-app-state.ts` | Cache-based app state, constants, and environment settings |
| `get_api_endpoints` | `tools/get-api-endpoints.ts` | Cache-based API endpoint definitions (method, URL, variables, headers, response) |
| `get_data_models` | `tools/get-data-models.ts` | Cache-based data structs, enums, Firestore collections, Supabase tables |
| `get_custom_code` | `tools/get-custom-code.ts` | Cache-based custom actions, functions, widgets, AI agents (with optional Dart source) |
| `get_project_config` | `tools/get-project-config.ts` | Cache-based project config (app details, auth, nav bar, permissions, services, lifecycle actions, file map) |
| `get_theme` | `tools/get-theme.ts` | Cache-based theme colors, typography, breakpoints, widget defaults |
| `get_editing_guide` | `tools/get-editing-guide.ts` | Workflow + doc guide for editing tasks (call before modifying YAML) |

### Utilities

- `utils/decode-yaml.ts` — `decodeProjectYamlResponse()`: base64 → adm-zip → `Record<string, string>`
- `utils/parse-folders.ts` — `parseFolderMapping()`: regex-based extraction of scaffold→folder mapping from the `folders` YAML file
- `utils/cache.ts` — Local cache functions: `cacheRead`, `cacheWrite`, `cacheWriteBulk`, `cacheMeta`, `listCachedKeys`
- `utils/resolve-data-type.ts` — `resolveDataType()`: resolves FF data type objects to readable strings (e.g. `List<String>`, `DataStruct:MyStruct`)
- `utils/batch-process.ts` — `batchProcess()`: process items in parallel batches to avoid overwhelming the file system
- `utils/topic-map.ts` — Shared `TOPIC_MAP`, `DOCS_DIR`, `listDocFiles()`, `readDoc()` for doc resolution across tools

## FlutterFlow YAML Conventions

When modifying FF YAML through this MCP:

- **Always update both `inputValue` AND `mostRecentInputValue`** to the same value — they must stay in sync. **Exceptions:** `fontWeightValue` and `fontSizeValue` only accept `inputValue` (no `mostRecentInputValue`).
- **Use node-level file keys for targeted edits** (`page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Widget_YYY`) instead of editing the full page YAML.
- **Always validate before pushing** — call `validate_yaml` before `update_project_yaml`.
- **Pass YAML as normal multi-line strings** — the MCP SDK handles JSON serialization. Do not escape newlines.
- **Adding new widgets requires node-level files** — the full page YAML (`page/id-Scaffold_XXX`) only stores page metadata. Widget children embedded inline will be stripped by the server. Push the widget tree outline + individual node files together.
- **Column has no `mainAxisSize` field** — use `minSizeValue: { inputValue: true }` for shrink-to-content behavior.
- **AppBar `templateType`** — only `LARGE_HEADER` is confirmed valid. Control height via `toolbarHeight`. Do not use `STANDARD`.

See `docs/ff-yaml/` for the complete YAML reference catalog including widget schemas, actions, variables, theming, and editing workflows.

## CI/CD

**CI** (`.github/workflows/ci.yml`): Runs on every push/PR to `main`. Builds on Node 18, 20, 22.

**Publish** (`.github/workflows/publish.yml`): Runs when a GitHub Release is created. Builds and publishes to npm with provenance.

### Releasing a new version

1. Bump `version` in `package.json`
2. Commit and push to `main`
3. Create a GitHub Release with tag `v<version>` (e.g. `v0.2.0`)
4. The publish workflow auto-publishes to npm

Requires `NPM_TOKEN` secret in GitHub repo settings.

## Known Limitations

- Some large pages fail with buffer errors during ZIP decode — use node-level sub-files instead.
- Fetching all YAML without a `fileName` parameter can exceed buffer/transport limits on large projects.
- `list_pages` batches requests 5 at a time to avoid FF API rate limits. Pages that fail to fetch appear as `(error - could not fetch)` with scaffold ID and folder still populated.

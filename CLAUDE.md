# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

An MCP (Model Context Protocol) server that wraps the FlutterFlow Project API, enabling AI-assisted FlutterFlow development. It exposes tools, resources, and prompts over stdio transport.

## Build & Run

```bash
npm run build          # TypeScript compile + chmod executable
npm run dev            # Watch mode (tsc --watch)
npm start              # Run the server (node build/index.js)
```

No test framework is configured. No linter is configured. Verify changes by running `npm run build` — a clean compile is the primary validation.

## Environment

Requires `FLUTTERFLOW_API_TOKEN` env var (Bearer token from FlutterFlow > Account Settings > API Token).

## Architecture

**Entry point:** `src/index.ts` — creates one `FlutterFlowClient` instance, registers all tools/resources/prompts on an MCP `StdioServerTransport`.

**API client:** `src/api/flutterflow.ts` — thin wrapper around `https://api.flutterflow.io/v2/`. All endpoints return `Promise<unknown>` — the tools handle response parsing.

**Critical encoding detail:** The `projectYamls` endpoint returns YAML as **base64-encoded ZIP**, not plain text. `src/utils/decode-yaml.ts` handles decoding. The `listPartitionedFileNames` endpoint returns file keys under `value.file_names` (snake_case, not camelCase).

### Registration Pattern

Every tool/resource/prompt follows the same pattern: a `register*` function that takes `(server, client?)` and calls `server.tool()`, `server.resource()`, or `server.prompt()`. New tools go in `src/tools/`, new prompts in `src/prompts/`, new resources in `src/resources/`. Register them in `src/index.ts`.

### Tools (7)

| Tool | File | Purpose |
|------|------|---------|
| `list_projects` | `tools/list-projects.ts` | List all FF projects |
| `list_project_files` | `tools/list-files.ts` | List all YAML file keys (large response) |
| `get_project_yaml` | `tools/get-yaml.ts` | Fetch + decode YAML by file key |
| `validate_yaml` | `tools/validate-yaml.ts` | Validate before pushing |
| `update_project_yaml` | `tools/update-yaml.ts` | Push YAML changes |
| `list_pages` | `tools/list-pages.ts` | Page index with names/folders (batched, 5 at a time) |
| `get_page_by_name` | `tools/get-page-by-name.ts` | Fetch page by human-readable name |

### Utilities

- `utils/decode-yaml.ts` — `decodeProjectYamlResponse()`: base64 → adm-zip → `Record<string, string>`
- `utils/parse-folders.ts` — `parseFolderMapping()`: regex-based extraction of scaffold→folder mapping from the `folders` YAML file

## FlutterFlow YAML Conventions

When modifying FF YAML through this MCP:

- **Always update both `inputValue` AND `mostRecentInputValue`** to the same value — they must stay in sync.
- **Use node-level file keys for targeted edits** (`page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Widget_YYY`) instead of editing the full page YAML.
- **Always validate before pushing** — call `validate_yaml` before `update_project_yaml`.
- **Pass YAML as normal multi-line strings** — the MCP SDK handles JSON serialization. Do not escape newlines.

See `ff-mcp-guide.md` for the complete development guide including value patterns, widget tree structure, and the recommended workflow.

## Known Limitations

- Some large pages fail with buffer errors during ZIP decode — use node-level sub-files instead.
- Fetching all YAML without a `fileName` parameter can exceed buffer/transport limits on large projects.
- `list_pages` batches requests 5 at a time to avoid FF API rate limits. Pages that fail to fetch appear as `(error - could not fetch)` with scaffold ID and folder still populated.

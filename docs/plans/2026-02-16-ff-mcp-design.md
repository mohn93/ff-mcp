# FlutterFlow MCP Server — Design Document

## Overview

A TypeScript MCP server that wraps the FlutterFlow Project API, enabling AI-assisted FlutterFlow development. Claude can list projects, read/write YAML configurations, validate changes, and generate pages/components from natural language descriptions.

**Target:** Personal tool first, open-source community release later.

## Architecture

```
Claude/AI Client <--stdio--> FF MCP Server <--HTTPS--> FlutterFlow API
```

- **Transport:** stdio
- **Language:** TypeScript using `@modelcontextprotocol/sdk`
- **Auth:** `FLUTTERFLOW_API_TOKEN` environment variable (Bearer token)
- **FF API Base URL:** `https://api.flutterflow.io/v2/`
- **Requirement:** Paid FlutterFlow subscription

## MCP Tools

| Tool | Description | Parameters |
|---|---|---|
| `list_projects` | List all FF projects for the authenticated user | `project_type?` (optional filter) |
| `list_project_files` | List all YAML file names in a project | `projectId` |
| `get_project_yaml` | Download one or all YAML files from a project | `projectId`, `fileName?` |
| `validate_yaml` | Validate YAML content before pushing changes | `projectId`, `fileKey`, `fileContent` |
| `update_project_yaml` | Push validated YAML changes to a project | `projectId`, `fileKeyToContent` (map of file key to YAML content) |

Tools map 1:1 to the FF API endpoints. Intended workflow: list files -> read YAML -> modify -> validate -> update.

## MCP Resources

| Resource | URI Pattern | Description |
|---|---|---|
| Project list | `ff://projects` | All projects with IDs and names |
| Project files | `ff://projects/{projectId}/files` | File listing for a specific project |
| Project YAML | `ff://projects/{projectId}/yaml/{fileName}` | Specific YAML file contents |

## MCP Prompts

| Prompt | Description | Arguments |
|---|---|---|
| `generate-page` | Guide Claude to create a new FF page from a natural language description | `projectId`, `description` |
| `modify-component` | Guide Claude to read an existing component and modify it | `projectId`, `fileName`, `changes` |
| `inspect-project` | Guide Claude to read and summarize a project's structure | `projectId` |

Prompt templates instruct Claude to: read existing project structure first, understand FF YAML schema conventions, generate valid YAML, and always validate before pushing.

## Project Structure

```
ff_mcp/
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── index.ts
│   ├── api/
│   │   └── flutterflow.ts
│   ├── tools/
│   │   ├── list-projects.ts
│   │   ├── list-files.ts
│   │   ├── get-yaml.ts
│   │   ├── validate-yaml.ts
│   │   └── update-yaml.ts
│   ├── resources/
│   │   └── projects.ts
│   └── prompts/
│       ├── generate-page.ts
│       ├── modify-component.ts
│       └── inspect-project.ts
├── README.md
└── docs/
    └── plans/
```

## Error Handling

- **Missing/invalid token:** Fail fast on startup with clear error message
- **API errors (401, 403, 404, 500):** Propagate FF API error messages back as tool error results
- **Validation failures:** Return FF validation errors so Claude can fix YAML before pushing
- **Rate limiting (429):** Return error to Claude, no automatic retry
- **Large YAML files:** No special handling; FF API handles partitioning

Stateless — no retries, no caching, no local state.

## Approach

Thin API Wrapper (Approach A). Claude does the heavy lifting of YAML generation using schema knowledge from resources and prompts. Simple, maintainable, follows the API closely, easy to extend.

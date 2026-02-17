# ff-mcp

MCP server for the FlutterFlow Project API. Enables AI-assisted FlutterFlow development through Claude and other MCP-compatible clients.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build:
   ```bash
   npm run build
   ```

3. Set your FlutterFlow API token:
   ```bash
   export FLUTTERFLOW_API_TOKEN=your_token_here
   ```
   Get your token from FlutterFlow > Account Settings > API Token.

## Usage with Claude Code

Add to your Claude Code MCP config:

```json
{
  "mcpServers": {
    "flutterflow": {
      "command": "node",
      "args": ["/path/to/ff_mcp/build/index.js"],
      "env": {
        "FLUTTERFLOW_API_TOKEN": "your_token"
      }
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `list_projects` | List all FlutterFlow projects |
| `list_project_files` | List YAML files in a project |
| `list_pages` | List all pages with names, scaffold IDs, and folders |
| `get_page_by_name` | Fetch a page by human-readable name |
| `get_project_yaml` | Download project YAML files |
| `validate_yaml` | Validate YAML before pushing |
| `update_project_yaml` | Push YAML changes to a project |
| `sync_project` | Bulk download all YAML to local cache |
| `get_page_summary` | Quick page overview from cache (widget tree, actions, params) |
| `get_component_summary` | Quick component overview from cache |
| `find_component_usages` | Find all pages/components using a given component |
| `find_page_navigations` | Find all actions that navigate to a given page |
| `get_yaml_docs` | Search/retrieve FlutterFlow YAML reference docs by topic or file |

## Resources

| Resource | URI | Description |
|----------|-----|-------------|
| Docs Index | `ff://docs` | List all available YAML reference documentation files |
| Doc File | `ff://docs/{path}` | Read a specific YAML reference doc (e.g. `ff://docs/04-widgets/button`) |

## Prompts

| Prompt | Description |
|--------|-------------|
| `generate-page` | Generate a new page from a description |
| `modify-component` | Modify an existing component |
| `inspect-project` | Summarize project structure |
| `flutterflow-dev-workflow` | Efficient workflow guide for AI-assisted FlutterFlow development |

## Documentation

- **[docs/ff-yaml/](docs/ff-yaml/)** — Complete FlutterFlow YAML reference catalog for AI agents (widget schemas, actions, variables, theming, editing workflows)

## Claude Code Skills

Copy skills from `skills/` into your project's `.claude/skills/` directory for Claude Code integration:

- **`ff-yaml-dev.md`** — Core workflow: reading, editing, and creating FlutterFlow pages/components
- **`ff-widget-patterns.md`** — Quick reference for common widget YAML patterns and snippets

## Requirements

- Node.js 18+
- Paid FlutterFlow subscription
- FlutterFlow API token

# flutterflow-mcp

MCP server for the FlutterFlow Project API. Enables AI-assisted FlutterFlow development through Claude and other MCP-compatible clients.

## Quick Start

### 1. Get your FlutterFlow API token

Go to **FlutterFlow > Account Settings > API Token** and copy your token.

### 2. Add to your MCP client

**Claude Code:**

```bash
claude mcp add flutterflow -- npx -y flutterflow-mcp
```

Then set your token in the MCP config (`~/.claude/settings.json` or project `.claude/settings.json`):

```json
{
  "mcpServers": {
    "flutterflow": {
      "command": "npx",
      "args": ["-y", "flutterflow-mcp"],
      "env": {
        "FLUTTERFLOW_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

**Other MCP clients (Cursor, Windsurf, etc.):**

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "flutterflow": {
      "command": "npx",
      "args": ["-y", "flutterflow-mcp"],
      "env": {
        "FLUTTERFLOW_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

### 3. Start building

Ask your AI assistant to list your FlutterFlow projects, inspect pages, or modify widgets — it handles the rest.

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

## Built-in YAML Reference

This MCP ships with a comprehensive FlutterFlow YAML reference catalog that AI models can access at runtime:

- **`get_yaml_docs` tool** — Search by topic (e.g. `get_yaml_docs(topic: "Button")`) or browse the full index
- **`ff://docs` resources** — Direct access to all 21 reference docs covering widgets, actions, variables, theming, and editing workflows

See [docs/ff-yaml/](docs/ff-yaml/) for the full catalog.

## Claude Code Skills

Copy skills from [`skills/`](skills/) into your project's `.claude/skills/` directory:

- **`ff-yaml-dev.md`** — Core workflow: reading, editing, and creating FlutterFlow pages/components
- **`ff-widget-patterns.md`** — Quick reference for common widget YAML patterns and snippets

## Development

```bash
git clone https://github.com/mohn93/ff-mcp.git
cd ff-mcp
npm install
npm run build
npm run dev          # watch mode
```

## Requirements

- Node.js 18+
- FlutterFlow API token (paid FlutterFlow subscription required)

## License

MIT

# flutterflow-mcp

MCP server for the FlutterFlow Project API. Enables AI-assisted FlutterFlow development through Claude and other MCP-compatible clients.

## What This MCP Does Best

This MCP excels at **reading, exploring, and understanding** your FlutterFlow projects. Here's what it's great at:

- **Project exploration** — Browse your projects, pages, components, and file structure
- **Understanding functionality** — Get clear summaries of what a page or component does, including its widget tree, actions, parameters, and state
- **Tracing usage** — Find everywhere a component is used, or every navigation action that leads to a page
- **Inspecting configuration** — View theme settings, API endpoints, data models, custom code, app state, integrations, and more
- **Searching** — Search project files by keyword, prefix, or regex to find exactly what you need
- **YAML reference** — Built-in documentation for FlutterFlow's YAML schema, so your AI assistant can understand and generate valid YAML
- **Guided editing** — A workflow guide (`get_editing_guide`) that walks through the correct steps before making any YAML changes

> **In short:** Think of it as giving your AI assistant full read access to your FlutterFlow project, plus careful write access when needed.

## Quick Start

### 1. Get Your FlutterFlow API Token

You need a FlutterFlow API token to authenticate. Here's how to get one:

1. Open [FlutterFlow](https://app.flutterflow.io/) and log in
2. Click your **profile picture** (bottom-left corner)
3. Go to **Account Settings**
4. Scroll to the **API Token** section
5. Click **Copy** to copy your token

> **Note:** The API token requires a **paid FlutterFlow subscription** (Standard plan or above). Free-tier accounts do not have API access.

### 2. Add to Your MCP Client

Choose your AI client below and follow the setup instructions.

<details>
<summary><strong>Claude Code (CLI)</strong></summary>

Run this command to add the MCP server:

```bash
claude mcp add flutterflow -e FLUTTERFLOW_API_TOKEN=your_token_here -- npx -y flutterflow-mcp
```

Replace `your_token_here` with the token you copied in step 1.

This adds the server to your project's `.claude/settings.json`. You can also manually edit the config:

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

</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

Open **Settings > Developer > Edit Config** and add:

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

Replace `your_token_here` with your token. Restart Claude Desktop after saving.

</details>

<details>
<summary><strong>Cursor</strong></summary>

Open **Settings > MCP** and add a new server with this configuration:

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

</details>

<details>
<summary><strong>Windsurf / Other MCP Clients</strong></summary>

Add the following to your MCP configuration file (check your client's docs for the exact location):

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

</details>

### 3. Start Building

Ask your AI assistant to list your FlutterFlow projects, inspect pages, or explore your app — it handles the rest.

**Example prompts to get started:**
- *"List my FlutterFlow projects"*
- *"Show me all the pages in project X"*
- *"What does the HomePage do? Walk me through its widget tree"*
- *"Where is the PaywallCard component used?"*
- *"What API endpoints are configured?"*
- *"Show me the theme colors"*

## Important: Limitations and Cautions

### Editing Requires Care

While this MCP can push YAML changes to your FlutterFlow project, **edits should be treated with caution**:

- **Always validate first** — Use `validate_yaml` before every `update_project_yaml` call. Validation catches syntax errors but cannot catch all semantic mistakes.
- **Review before pushing** — Ask your AI assistant to show you the exact YAML changes before they are pushed. Understand what will change.
- **FlutterFlow has no undo for API changes** — Changes pushed through the API are applied immediately. There is no built-in undo button for API-pushed edits. You can revert using FlutterFlow's version history, but it's better to prevent bad edits than to fix them.
- **Start with read-only exploration** — Get comfortable using the read tools (`get_page_summary`, `find_component_usages`, etc.) before attempting edits.
- **Node-level edits are safer** — Edit individual widgets via node-level file keys instead of replacing entire page YAML. This reduces the blast radius of mistakes.

### Known Technical Limitations

- **Large pages may fail** — Some large pages can exceed buffer limits during ZIP decode. Use node-level sub-files for these pages instead.
- **Full project YAML fetch can be slow** — Fetching all YAML without a `fileName` parameter may exceed buffer/transport limits on large projects. Use `sync_project` to cache everything locally first.
- **Rate limiting** — `list_pages` batches requests 5 at a time to avoid FlutterFlow API rate limits. Pages that fail to fetch still appear with scaffold ID and folder info.
- **Cache staleness** — Cache-based tools (`get_page_summary`, `get_component_summary`, etc.) depend on a local cache created by `sync_project`. If your project has been edited in FlutterFlow since the last sync, re-run `sync_project` with `force: true` to refresh.
- **No real-time sync** — This is a snapshot-based tool. It reads and writes YAML at a point in time. It does not watch for live changes in the FlutterFlow editor.

## Tools

### Discovery and Exploration

| Tool | Description |
|------|-------------|
| `list_projects` | List all FlutterFlow projects for your account |
| `list_project_files` | List YAML file keys in a project (supports prefix filter) |
| `list_pages` | List all pages with human-readable names, scaffold IDs, and folders |
| `search_project_files` | Search file keys by keyword, prefix, or regex |
| `sync_project` | Bulk download all project YAML to local cache for fast offline reads |

### Reading and Understanding

| Tool | Description |
|------|-------------|
| `get_page_by_name` | Fetch a page by its human-readable name |
| `get_project_yaml` | Download specific YAML files by file key |
| `get_page_summary` | Quick page overview from cache — widget tree, actions, params, state |
| `get_component_summary` | Quick component overview from cache — widget tree, actions, params |
| `find_component_usages` | Find all pages and components where a given component is used |
| `find_page_navigations` | Find all actions that navigate to a given page |

### Project Configuration

| Tool | Description |
|------|-------------|
| `get_theme` | Theme colors, typography, breakpoints, and widget defaults |
| `get_app_state` | App state variables, constants, and environment settings |
| `get_api_endpoints` | API endpoint definitions — method, URL, variables, headers, response |
| `get_data_models` | Data structs, enums, Firestore collections, and Supabase tables |
| `get_custom_code` | Custom actions, functions, widgets, AI agents, and app-action components |
| `get_general_settings` | App Details, App Assets, Nav Bar & App Bar settings |
| `get_project_setup` | Firebase, Languages, Platforms, Permissions, Dependencies |
| `get_app_settings` | Authentication, Push Notifications, Mobile/Web Deployment |
| `get_in_app_purchases` | Stripe, Braintree, RevenueCat, Razorpay configuration |
| `get_integrations` | Supabase, SQLite, GitHub, Algolia, Google Maps, AdMob, and more |

### Editing

| Tool | Description |
|------|-------------|
| `get_editing_guide` | Get the recommended workflow and docs for an editing task — **call this before modifying any YAML** |
| `get_yaml_docs` | Search/retrieve FlutterFlow YAML reference docs by topic or file |
| `validate_yaml` | Validate YAML content before pushing — **always call before `update_project_yaml`** |
| `update_project_yaml` | Push YAML changes to a project |

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

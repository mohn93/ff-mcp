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

## How It Works Under the Hood

This MCP is designed to make AI agents as effective as possible when working with FlutterFlow. Here's what makes it work well:

### Smart Local Caching

Instead of hitting the FlutterFlow API for every question, the MCP downloads your entire project once (`sync_project`) and caches it locally. After that, most tools read from the cache — making them **instant and free of API rate limits**. If you've made changes in FlutterFlow, just re-sync to refresh the cache.

### Built-in Documentation

AI models don't natively understand FlutterFlow's internal structure. This MCP ships with **21 reference documents** covering every widget type, action, variable, theme setting, and editing pattern. The AI can look up exactly how a Button, Column, or Navigation action is structured — so it doesn't have to guess.

### Guided Editing Workflow

Before making any change, the AI can call `get_editing_guide` with a plain-English description of what it wants to do (e.g., *"change the button color on the login page"*). The MCP returns the exact steps, relevant documentation, and rules to follow — reducing the chance of mistakes.

### 25 Purpose-Built Tools

Rather than one generic "read project" tool, the MCP provides **25 specialized tools** — each designed for a specific task. Want to know where a component is used? There's a dedicated tool for that. Want to see all navigation actions pointing to a page? There's one for that too. This means the AI always picks the right tool for the job instead of downloading everything and searching through it.

## Limitations and Cautions

### Be Careful with Edits

This MCP can make changes to your FlutterFlow project, but **edits should be treated with care**:

- **Always review before pushing** — Ask your AI assistant to show you exactly what it plans to change before it pushes anything. Make sure you understand the change.
- **There's no undo button for API changes** — Changes are applied immediately to your project. You can roll back using FlutterFlow's version history, but it's better to prevent a bad edit than to fix one.
- **Start with read-only tasks** — Get comfortable asking questions about your project (page summaries, component usage, theme inspection) before asking the AI to modify anything.
- **Smaller edits are safer** — Editing a single widget is safer than replacing an entire page. The AI knows to make targeted changes, but it's good to be aware.

### What the FlutterFlow API Can't Do

These are limitations in FlutterFlow's own API. They affect any tool that connects to FlutterFlow, not just this MCP.

- **Custom code can be read but not edited** — The AI can read your custom actions, custom functions, and custom widgets, but it **cannot push code changes** back to FlutterFlow. The API doesn't support it properly — attempting to push code corrupts the FlutterFlow editor. Instead, the AI will show you the modified code and you copy-paste it into the FlutterFlow code editor.
- **Unlocked `main.dart` can't be updated** — If you've unlocked `main.dart` for raw Dart editing, the AI can read it but can't push code changes. Startup/shutdown action lists can still be modified.
- **Platform config files are indirect** — You can't directly edit `AndroidManifest.xml`, `Info.plist`, or `build.gradle`. Instead, you configure hooks and settings in FlutterFlow, which generates those files for you. The AI can read and modify those hooks.
- **Editing platform config files requires extra care** — FlutterFlow groups all platform config files together internally. If the AI pushes a change to just one (e.g., Android Manifest), FlutterFlow may delete the others (e.g., ProGuard rules, Gradle config). The MCP handles this by always including all existing files in the same push, but it's something to be aware of.
- **Disabling conditional actions works differently** — In the FlutterFlow editor, you can toggle a conditional action on/off with a switch. The API handles this slightly differently, so the AI uses a workaround that achieves the same result.
- **Validation isn't perfect** — The validation step catches most errors, but occasionally something that passes validation can still fail when pushed. This is rare, but it's why reviewing changes before pushing is important.

### General Limitations

- **No live sync** — The MCP works with a snapshot of your project. It doesn't watch for changes you make in the FlutterFlow editor in real time. If you've been editing in FlutterFlow, re-sync before asking the AI to make changes.
- **Very large pages** — Some extremely large pages may fail to load. The AI can work around this by loading individual widgets instead of the whole page.
- **Cache can go stale** — If you edit your project in FlutterFlow after syncing, the AI's local copy is outdated. Re-run the sync (the AI will tell you when it detects stale data).

> For the full technical details on each API limitation, see [`docs/flutterflow-api-limitations.md`](docs/flutterflow-api-limitations.md).

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

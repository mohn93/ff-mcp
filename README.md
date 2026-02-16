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
| `get_project_yaml` | Download project YAML files |
| `validate_yaml` | Validate YAML before pushing |
| `update_project_yaml` | Push YAML changes to a project |

## Prompts

| Prompt | Description |
|--------|-------------|
| `generate-page` | Generate a new page from a description |
| `modify-component` | Modify an existing component |
| `inspect-project` | Summarize project structure |

## Requirements

- Node.js 18+
- Paid FlutterFlow subscription
- FlutterFlow API token

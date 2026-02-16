# FlutterFlow MCP Server Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a TypeScript MCP server that wraps the FlutterFlow Project API, enabling AI-assisted FlutterFlow development through tools, resources, and prompts.

**Architecture:** Thin API wrapper using stdio transport. A shared HTTP client handles all FlutterFlow API calls with Bearer token auth. Tools map 1:1 to FF API endpoints. Resources expose project data for browsing. Prompts guide Claude through page generation and component modification workflows.

**Tech Stack:** TypeScript, `@modelcontextprotocol/sdk`, `zod`, Node.js fetch API

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `.gitignore`

**Step 1: Initialize the project**

Run:
```bash
cd "/Users/mohn93/Desktop/Dev Archive/Flywheel/ff_mcp"
npm init -y
```

**Step 2: Install dependencies**

Run:
```bash
cd "/Users/mohn93/Desktop/Dev Archive/Flywheel/ff_mcp"
npm install @modelcontextprotocol/sdk zod
npm install --save-dev typescript @types/node
```

**Step 3: Configure package.json**

Update `package.json` to set:
```json
{
  "name": "ff-mcp",
  "version": "0.1.0",
  "description": "MCP server for FlutterFlow Project API",
  "type": "module",
  "main": "build/index.js",
  "bin": {
    "ff-mcp": "build/index.js"
  },
  "scripts": {
    "build": "tsc && chmod 755 build/index.js",
    "dev": "tsc --watch",
    "start": "node build/index.js"
  }
}
```

**Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build"]
}
```

**Step 5: Create .env.example**

```
FLUTTERFLOW_API_TOKEN=your_api_token_here
```

**Step 6: Create .gitignore**

```
node_modules/
build/
.env
```

**Step 7: Create source directory structure**

Run:
```bash
mkdir -p src/api src/tools src/resources src/prompts
```

**Step 8: Verify build works**

Create a minimal `src/index.ts`:
```typescript
#!/usr/bin/env node
console.error("ff-mcp server starting...");
```

Run:
```bash
npm run build
```
Expected: Compiles without errors, `build/index.js` exists.

**Step 9: Commit**

```bash
git init
git add package.json package-lock.json tsconfig.json .env.example .gitignore src/index.ts
git commit -m "chore: scaffold ff-mcp project"
```

---

### Task 2: FlutterFlow API Client

**Files:**
- Create: `src/api/flutterflow.ts`

**Step 1: Implement the FF API client**

```typescript
const FF_API_BASE = "https://api.flutterflow.io/v2";

export class FlutterFlowClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<unknown> {
    const url = `${FF_API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `FlutterFlow API error ${res.status}: ${errorText}`
      );
    }

    return res.json();
  }

  async listProjects(
    projectType?: string,
    deserializeResponse?: boolean
  ): Promise<unknown> {
    return this.request("POST", "/l/listProjects", {
      project_type: projectType,
      deserialize_response: deserializeResponse ?? false,
    });
  }

  async listPartitionedFileNames(projectId: string): Promise<unknown> {
    return this.request(
      "GET",
      `/listPartitionedFileNames?projectId=${encodeURIComponent(projectId)}`
    );
  }

  async getProjectYamls(
    projectId: string,
    fileName?: string
  ): Promise<unknown> {
    let endpoint = `/projectYamls?projectId=${encodeURIComponent(projectId)}`;
    if (fileName) {
      endpoint += `&fileName=${encodeURIComponent(fileName)}`;
    }
    return this.request("GET", endpoint);
  }

  async validateProjectYaml(
    projectId: string,
    fileKey: string,
    fileContent: string
  ): Promise<unknown> {
    return this.request("POST", "/validateProjectYaml", {
      projectId,
      fileKey,
      fileContent,
    });
  }

  async updateProjectByYaml(
    projectId: string,
    fileKeyToContent: Record<string, string>
  ): Promise<unknown> {
    return this.request("POST", "/updateProjectByYaml", {
      projectId,
      fileKeyToContent,
    });
  }
}

export function createClient(): FlutterFlowClient {
  const token = process.env.FLUTTERFLOW_API_TOKEN;
  if (!token) {
    throw new Error(
      "FLUTTERFLOW_API_TOKEN environment variable is required. " +
        "Get your token from FlutterFlow > Account Settings > API Token."
    );
  }
  return new FlutterFlowClient(token);
}
```

**Step 2: Verify it compiles**

Run:
```bash
npm run build
```
Expected: No errors.

**Step 3: Commit**

```bash
git add src/api/flutterflow.ts
git commit -m "feat: add FlutterFlow API client"
```

---

### Task 3: MCP Tools — list_projects and list_project_files

**Files:**
- Create: `src/tools/list-projects.ts`
- Create: `src/tools/list-files.ts`

**Step 1: Implement list_projects tool**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FlutterFlowClient } from "../api/flutterflow.js";

export function registerListProjectsTool(
  server: McpServer,
  client: FlutterFlowClient
) {
  server.tool(
    "list_projects",
    "List all FlutterFlow projects for the authenticated user",
    {
      project_type: z
        .string()
        .optional()
        .describe("Optional filter for project type"),
    },
    async ({ project_type }) => {
      const result = await client.listProjects(project_type);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}
```

**Step 2: Implement list_project_files tool**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FlutterFlowClient } from "../api/flutterflow.js";

export function registerListFilesTool(
  server: McpServer,
  client: FlutterFlowClient
) {
  server.tool(
    "list_project_files",
    "List all YAML file names in a FlutterFlow project",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
    },
    async ({ projectId }) => {
      const result = await client.listPartitionedFileNames(projectId);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}
```

**Step 3: Verify build**

Run:
```bash
npm run build
```
Expected: No errors.

**Step 4: Commit**

```bash
git add src/tools/list-projects.ts src/tools/list-files.ts
git commit -m "feat: add list_projects and list_project_files tools"
```

---

### Task 4: MCP Tools — get_yaml, validate_yaml, update_yaml

**Files:**
- Create: `src/tools/get-yaml.ts`
- Create: `src/tools/validate-yaml.ts`
- Create: `src/tools/update-yaml.ts`

**Step 1: Implement get_project_yaml tool**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FlutterFlowClient } from "../api/flutterflow.js";

export function registerGetYamlTool(
  server: McpServer,
  client: FlutterFlowClient
) {
  server.tool(
    "get_project_yaml",
    "Download YAML files from a FlutterFlow project. Returns one file if fileName is specified, otherwise returns all files.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      fileName: z
        .string()
        .optional()
        .describe(
          "Specific YAML file name to download (e.g. 'app-details', 'page/id-xxx'). Omit to get all files."
        ),
    },
    async ({ projectId, fileName }) => {
      const result = await client.getProjectYamls(projectId, fileName);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}
```

**Step 2: Implement validate_yaml tool**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FlutterFlowClient } from "../api/flutterflow.js";

export function registerValidateYamlTool(
  server: McpServer,
  client: FlutterFlowClient
) {
  server.tool(
    "validate_yaml",
    "Validate YAML content before pushing changes to a FlutterFlow project. Always call this before update_project_yaml.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      fileKey: z
        .string()
        .describe("The YAML file key (e.g. 'app-details', 'page/id-xxx')"),
      fileContent: z
        .string()
        .describe(
          "The YAML content to validate. Must be a single-line string with escaped newlines (\\n)."
        ),
    },
    async ({ projectId, fileKey, fileContent }) => {
      const result = await client.validateProjectYaml(
        projectId,
        fileKey,
        fileContent
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}
```

**Step 3: Implement update_project_yaml tool**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FlutterFlowClient } from "../api/flutterflow.js";

export function registerUpdateYamlTool(
  server: McpServer,
  client: FlutterFlowClient
) {
  server.tool(
    "update_project_yaml",
    "Push YAML changes to a FlutterFlow project. IMPORTANT: Always call validate_yaml first to check for errors before updating.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      fileKeyToContent: z
        .record(z.string(), z.string())
        .describe(
          "Map of file keys to YAML content. Each value must be a single-line string with escaped newlines (\\n)."
        ),
    },
    async ({ projectId, fileKeyToContent }) => {
      const result = await client.updateProjectByYaml(
        projectId,
        fileKeyToContent
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}
```

**Step 4: Verify build**

Run:
```bash
npm run build
```
Expected: No errors.

**Step 5: Commit**

```bash
git add src/tools/get-yaml.ts src/tools/validate-yaml.ts src/tools/update-yaml.ts
git commit -m "feat: add get_yaml, validate_yaml, and update_yaml tools"
```

---

### Task 5: MCP Resources

**Files:**
- Create: `src/resources/projects.ts`

**Step 1: Implement resource handlers**

```typescript
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { FlutterFlowClient } from "../api/flutterflow.js";

export function registerResources(
  server: McpServer,
  client: FlutterFlowClient
) {
  // Static resource: list all projects
  server.resource(
    "projects",
    "ff://projects",
    {
      description: "List all FlutterFlow projects",
      mimeType: "application/json",
    },
    async (uri) => {
      const projects = await client.listProjects();
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(projects, null, 2),
            mimeType: "application/json",
          },
        ],
      };
    }
  );

  // Dynamic resource: list files in a project
  server.resource(
    "project-files",
    new ResourceTemplate("ff://projects/{projectId}/files", {
      list: undefined,
    }),
    {
      description: "List YAML file names in a FlutterFlow project",
      mimeType: "application/json",
    },
    async (uri, { projectId }) => {
      const files = await client.listPartitionedFileNames(
        projectId as string
      );
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(files, null, 2),
            mimeType: "application/json",
          },
        ],
      };
    }
  );

  // Dynamic resource: get specific YAML file
  server.resource(
    "project-yaml",
    new ResourceTemplate("ff://projects/{projectId}/yaml/{+fileName}", {
      list: undefined,
    }),
    {
      description: "Get a specific YAML file from a FlutterFlow project",
      mimeType: "text/yaml",
    },
    async (uri, { projectId, fileName }) => {
      const yaml = await client.getProjectYamls(
        projectId as string,
        fileName as string
      );
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(yaml, null, 2),
            mimeType: "text/yaml",
          },
        ],
      };
    }
  );
}
```

**Step 2: Verify build**

Run:
```bash
npm run build
```
Expected: No errors.

**Step 3: Commit**

```bash
git add src/resources/projects.ts
git commit -m "feat: add MCP resources for project browsing"
```

---

### Task 6: MCP Prompts

**Files:**
- Create: `src/prompts/generate-page.ts`
- Create: `src/prompts/modify-component.ts`
- Create: `src/prompts/inspect-project.ts`

**Step 1: Implement generate-page prompt**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerGeneratePagePrompt(server: McpServer) {
  server.prompt(
    "generate-page",
    "Generate a new FlutterFlow page from a natural language description",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      description: z
        .string()
        .describe("Natural language description of the page to create"),
    },
    ({ projectId, description }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are an expert FlutterFlow developer. Generate a new page for the FlutterFlow project.

## Instructions

1. First, use the list_project_files tool with projectId "${projectId}" to understand the existing project structure.
2. Then, use get_project_yaml to read a few existing pages to understand the YAML schema and conventions used in this project.
3. Based on the following description, generate valid FlutterFlow YAML for a new page:

**Page Description:** ${description}

4. Use validate_yaml to check your generated YAML is valid.
5. If validation passes, use update_project_yaml to push the new page to the project.
6. If validation fails, fix the errors and try again.

## Important
- Follow the exact YAML structure you observed in existing pages.
- Use consistent naming conventions matching the project.
- YAML content must be single-line strings with escaped newlines (\\n).`,
          },
        },
      ],
    })
  );
}
```

**Step 2: Implement modify-component prompt**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerModifyComponentPrompt(server: McpServer) {
  server.prompt(
    "modify-component",
    "Read an existing FlutterFlow component and modify it based on instructions",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      fileName: z
        .string()
        .describe("The YAML file name of the component to modify"),
      changes: z
        .string()
        .describe("Description of changes to make to the component"),
    },
    ({ projectId, fileName, changes }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are an expert FlutterFlow developer. Modify an existing component in the FlutterFlow project.

## Instructions

1. Use get_project_yaml with projectId "${projectId}" and fileName "${fileName}" to read the current component YAML.
2. Understand the current structure and widget tree.
3. Apply the following changes:

**Requested Changes:** ${changes}

4. Use validate_yaml to verify your modified YAML is valid.
5. If validation passes, use update_project_yaml to push the changes.
6. If validation fails, fix the errors and try again.

## Important
- Preserve all existing structure you are not modifying.
- YAML content must be single-line strings with escaped newlines (\\n).
- Only change what was requested — do not refactor or reorganize.`,
          },
        },
      ],
    })
  );
}
```

**Step 3: Implement inspect-project prompt**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerInspectProjectPrompt(server: McpServer) {
  server.prompt(
    "inspect-project",
    "Read and summarize a FlutterFlow project's structure, pages, and components",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
    },
    ({ projectId }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are an expert FlutterFlow developer. Inspect and summarize the FlutterFlow project.

## Instructions

1. Use list_project_files with projectId "${projectId}" to get all files.
2. Use get_project_yaml to read key files like "app-details", "folders", and "authentication".
3. Read a sample of page and component files to understand the app structure.
4. Provide a clear summary including:
   - App name and details
   - Number of pages and their names
   - Number of components and their names
   - Data models / collections
   - Authentication setup
   - Any custom code files
   - Overall architecture observations`,
          },
        },
      ],
    })
  );
}
```

**Step 4: Verify build**

Run:
```bash
npm run build
```
Expected: No errors.

**Step 5: Commit**

```bash
git add src/prompts/generate-page.ts src/prompts/modify-component.ts src/prompts/inspect-project.ts
git commit -m "feat: add MCP prompts for page generation, component modification, and project inspection"
```

---

### Task 7: Server Entry Point — Wire Everything Together

**Files:**
- Modify: `src/index.ts`

**Step 1: Implement the server entry point**

Replace `src/index.ts` with:

```typescript
#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "./api/flutterflow.js";
import { registerListProjectsTool } from "./tools/list-projects.js";
import { registerListFilesTool } from "./tools/list-files.js";
import { registerGetYamlTool } from "./tools/get-yaml.js";
import { registerValidateYamlTool } from "./tools/validate-yaml.js";
import { registerUpdateYamlTool } from "./tools/update-yaml.js";
import { registerResources } from "./resources/projects.js";
import { registerGeneratePagePrompt } from "./prompts/generate-page.js";
import { registerModifyComponentPrompt } from "./prompts/modify-component.js";
import { registerInspectProjectPrompt } from "./prompts/inspect-project.js";

const server = new McpServer({
  name: "ff-mcp",
  version: "0.1.0",
});

const client = createClient();

// Register tools
registerListProjectsTool(server, client);
registerListFilesTool(server, client);
registerGetYamlTool(server, client);
registerValidateYamlTool(server, client);
registerUpdateYamlTool(server, client);

// Register resources
registerResources(server, client);

// Register prompts
registerGeneratePagePrompt(server);
registerModifyComponentPrompt(server);
registerInspectProjectPrompt(server);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("FlutterFlow MCP server running on stdio");
```

**Step 2: Build and verify**

Run:
```bash
npm run build
```
Expected: Compiles without errors.

**Step 3: Quick smoke test**

Run (should fail with missing token, confirming the server tries to start):
```bash
node build/index.js 2>&1 || true
```
Expected: Error message about `FLUTTERFLOW_API_TOKEN` being required.

**Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: wire up MCP server entry point with all tools, resources, and prompts"
```

---

### Task 8: Integration Test with Real Token

**Prerequisite:** User must have `FLUTTERFLOW_API_TOKEN` set.

**Step 1: Test with MCP Inspector (optional)**

Run:
```bash
npx @modelcontextprotocol/inspector build/index.js
```
Expected: Opens MCP Inspector in browser. You can test each tool interactively.

**Step 2: Configure for Claude Code**

Add to Claude Code MCP settings (e.g. `~/.claude/claude_desktop_config.json` or project `.claude/settings.json`):

```json
{
  "mcpServers": {
    "flutterflow": {
      "command": "node",
      "args": ["/Users/mohn93/Desktop/Dev Archive/Flywheel/ff_mcp/build/index.js"],
      "env": {
        "FLUTTERFLOW_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

**Step 3: Test list_projects from Claude**

Start a new Claude Code session and ask Claude to list your FlutterFlow projects.
Expected: Claude calls `list_projects` and returns your projects.

**Step 4: Commit final state**

```bash
git add -A
git commit -m "chore: ready for integration testing"
```

---

### Task 9: README

**Files:**
- Create: `README.md`

**Step 1: Write README**

```markdown
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
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup and usage instructions"
```

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

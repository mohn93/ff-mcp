#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "./api/flutterflow.js";
import { registerListProjectsTool } from "./tools/list-projects.js";
import { registerListFilesTool } from "./tools/list-files.js";
import { registerGetYamlTool } from "./tools/get-yaml.js";
import { registerValidateYamlTool } from "./tools/validate-yaml.js";
import { registerUpdateYamlTool } from "./tools/update-yaml.js";
import { registerListPagesTool } from "./tools/list-pages.js";
import { registerGetPageByNameTool } from "./tools/get-page-by-name.js";
import { registerSyncProjectTool } from "./tools/sync-project.js";
import { registerGetPageSummaryTool } from "./tools/get-page-summary.js";
import { registerGetComponentSummaryTool } from "./tools/get-component-summary.js";
import { registerFindComponentUsagesTool } from "./tools/find-component-usages.js";
import { registerFindPageNavigationsTool } from "./tools/find-page-navigations.js";
import { registerResources } from "./resources/projects.js";
import { registerDocsResources } from "./resources/docs.js";
import { registerGeneratePagePrompt } from "./prompts/generate-page.js";
import { registerModifyComponentPrompt } from "./prompts/modify-component.js";
import { registerInspectProjectPrompt } from "./prompts/inspect-project.js";
import { registerDevWorkflowPrompt } from "./prompts/dev-workflow.js";
import { registerGetYamlDocsTool } from "./tools/get-yaml-docs.js";

const server = new McpServer({
  name: "ff-mcp",
  version: "0.1.0",
});

const client = createClient();

// Register tools
registerListProjectsTool(server, client);
registerListFilesTool(server, client);
registerGetYamlTool(server);
registerValidateYamlTool(server, client);
registerUpdateYamlTool(server, client);
registerListPagesTool(server, client);
registerGetPageByNameTool(server, client);
registerSyncProjectTool(server, client);
registerGetPageSummaryTool(server);
registerGetComponentSummaryTool(server);
registerFindComponentUsagesTool(server);
registerFindPageNavigationsTool(server);
registerGetYamlDocsTool(server);

// Register resources
registerResources(server, client);
registerDocsResources(server);

// Register prompts
registerGeneratePagePrompt(server);
registerModifyComponentPrompt(server);
registerInspectProjectPrompt(server);
registerDevWorkflowPrompt(server);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("FlutterFlow MCP server running on stdio");

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

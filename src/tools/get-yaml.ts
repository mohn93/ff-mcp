import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FlutterFlowClient } from "../api/flutterflow.js";
import { decodeProjectYamlResponse } from "../utils/decode-yaml.js";
import { cacheRead, cacheWrite } from "../utils/cache.js";

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
      // Cache-first for single-file requests
      if (fileName) {
        const cached = await cacheRead(projectId, fileName);
        if (cached) {
          return {
            content: [
              {
                type: "text" as const,
                text: `# ${fileName} (cached)\n${cached}`,
              },
            ],
          };
        }
      }

      const raw = await client.getProjectYamls(projectId, fileName);
      const decoded = decodeProjectYamlResponse(raw);

      // Write fetched results to cache (strip .yaml from ZIP entry names to avoid double extension)
      for (const [name, yaml] of Object.entries(decoded)) {
        const cleanName = name.endsWith(".yaml") ? name.slice(0, -".yaml".length) : name;
        await cacheWrite(projectId, cleanName, yaml);
      }

      const entries = Object.entries(decoded);
      if (entries.length === 1) {
        const [name, yaml] = entries[0];
        return {
          content: [{ type: "text" as const, text: `# ${name}\n${yaml}` }],
        };
      }

      return {
        content: entries.map(([name, yaml]) => ({
          type: "text" as const,
          text: `# ${name}\n${yaml}`,
        })),
      };
    }
  );
}

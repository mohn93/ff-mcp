import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FlutterFlowClient } from "../api/flutterflow.js";
import { decodeProjectYamlResponse } from "../utils/decode-yaml.js";

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
      const raw = await client.getProjectYamls(projectId, fileName);
      const decoded = decodeProjectYamlResponse(raw);

      const entries = Object.entries(decoded);
      if (entries.length === 1) {
        const [name, yaml] = entries[0];
        return {
          content: [
            {
              type: "text" as const,
              text: `# ${name}\n${yaml}`,
            },
          ],
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

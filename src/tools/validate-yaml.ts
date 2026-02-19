import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FlutterFlowClient } from "../api/flutterflow.js";

/** Extract widget type from a node-level fileKey, e.g. "Button" from "node/id-Button_xyz" */
function extractWidgetTypeFromFileKey(fileKey: string): string | null {
  const match = fileKey.match(/node\/id-([A-Z][a-zA-Z]+)_/);
  return match ? match[1] : null;
}

export function registerValidateYamlTool(
  server: McpServer,
  client: FlutterFlowClient
) {
  server.tool(
    "validate_yaml",
    "Validate YAML content before pushing changes to a FlutterFlow project. Always call this before update_project_yaml. Tip: Call get_editing_guide or get_yaml_docs BEFORE writing YAML to understand the correct schema and field names. Validation catches syntax errors but not semantic mistakes.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      fileKey: z
        .string()
        .describe("The YAML file key (e.g. 'app-details', 'page/id-xxx')"),
      fileContent: z
        .string()
        .describe(
          "Pass YAML content as a normal multi-line string."
        ),
    },
    async ({ projectId, fileKey, fileContent }) => {
      const result = await client.validateProjectYaml(
        projectId,
        fileKey,
        fileContent
      );

      let text = JSON.stringify(result, null, 2);

      // Add doc hint on validation failure
      const isFailure = result && typeof result === "object" && (result as any).valid === false;
      if (isFailure) {
        const widgetType = extractWidgetTypeFromFileKey(fileKey);
        if (widgetType) {
          text += `\n\nHint: Use get_yaml_docs(topic: "${widgetType}") to look up the correct field schema for ${widgetType} widgets.`;
        } else {
          text += `\n\nHint: Use get_yaml_docs to look up the correct YAML schema for the file you're editing.`;
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text,
          },
        ],
      };
    }
  );
}

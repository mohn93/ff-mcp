import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import YAML from "yaml";
import { cacheRead, cacheMeta } from "../utils/cache.js";
import { resolveDataType } from "../utils/resolve-data-type.js";

interface StateField {
  parameter?: {
    identifier?: { name?: string };
    dataType?: Record<string, unknown>;
  };
  persisted?: boolean;
  serializedDefaultValue?: string[];
}

interface ConstantField {
  parameter?: {
    identifier?: { name?: string };
    dataType?: Record<string, unknown>;
  };
  serializedValue?: string[];
}

interface EnvValue {
  parameter?: {
    identifier?: { name?: string };
    dataType?: Record<string, unknown>;
  };
  valuesMap?: Record<string, { serializedValue?: string }>;
  isPrivate?: boolean;
}

export function registerGetAppStateTool(server: McpServer) {
  server.tool(
    "get_app_state",
    "Get app state variables, constants, and environment settings from local cache. No API calls. Run sync_project first if not cached.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
    },
    async ({ projectId }) => {
      const meta = await cacheMeta(projectId);
      if (!meta) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No cache found for project "${projectId}". Run sync_project first.`,
            },
          ],
        };
      }

      const sections: string[] = ["# App State"];

      // --- State Variables ---
      const appStateYaml = await cacheRead(projectId, "app-state");
      if (appStateYaml) {
        const doc = YAML.parse(appStateYaml) as Record<string, unknown>;
        const fields = (doc.fields as StateField[]) || [];
        const lines: string[] = [];

        for (const field of fields) {
          const name = field.parameter?.identifier?.name || "unknown";
          const dt = resolveDataType(field.parameter?.dataType || {});
          const parts = [`- ${name}: ${dt}`];
          if (field.persisted) parts.push("(persisted)");
          if (field.serializedDefaultValue && field.serializedDefaultValue.length > 0) {
            const joined = field.serializedDefaultValue
              .map((v) => `"${v}"`)
              .join(", ");
            parts.push(`[default: ${joined}]`);
          }
          lines.push(parts.join(" "));
        }

        sections.push("\n## State Variables");
        if (lines.length > 0) {
          sections.push(lines.join("\n"));
        }

        const secure = (doc.securePersistedValues as boolean) ?? false;
        sections.push(`\nSecure persisted values: ${secure ? "Yes" : "No"}`);
      }

      // --- Constants ---
      const constantsYaml = await cacheRead(projectId, "app-constants");
      if (constantsYaml) {
        const doc = YAML.parse(constantsYaml) as Record<string, unknown>;
        const fields = (doc.fields as ConstantField[]) || [];
        const lines: string[] = [];

        for (const field of fields) {
          const name = field.parameter?.identifier?.name || "unknown";
          const dt = resolveDataType(field.parameter?.dataType || {});
          const vals = field.serializedValue || [];
          const formatted = vals.map((v) => `"${v}"`).join(", ");
          lines.push(`- ${name}: ${dt} = [${formatted}]`);
        }

        sections.push("\n## Constants");
        if (lines.length > 0) {
          sections.push(lines.join("\n"));
        }
      }

      // --- Environment Settings ---
      const envYaml = await cacheRead(projectId, "environment-settings");
      if (envYaml) {
        const doc = YAML.parse(envYaml) as Record<string, unknown>;
        const currentEnv = doc.currentEnvironment as
          | { name?: string; key?: string }
          | undefined;
        const envValues = (doc.environmentValues as EnvValue[]) || [];

        sections.push("\n## Environment Settings");
        if (currentEnv) {
          sections.push(`Current: ${currentEnv.name || "unknown"} (${currentEnv.key || "?"})`);
        }

        const lines: string[] = [];
        for (const ev of envValues) {
          const name = ev.parameter?.identifier?.name || "unknown";
          const dt = resolveDataType(ev.parameter?.dataType || {});
          const privateTag = ev.isPrivate ? " (private)" : "";
          lines.push(`- ${name}: ${dt}${privateTag}`);

          const valuesMap = ev.valuesMap || {};
          for (const [envKey, envVal] of Object.entries(valuesMap)) {
            const display = ev.isPrivate ? "****" : (envVal.serializedValue ?? "");
            lines.push(`  ${envKey}: ${display}`);
          }
        }

        if (lines.length > 0) {
          sections.push(lines.join("\n"));
        }
      }

      return {
        content: [{ type: "text" as const, text: sections.join("\n") }],
      };
    }
  );
}

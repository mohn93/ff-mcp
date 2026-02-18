import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import YAML from "yaml";
import { cacheRead, cacheMeta, listCachedKeys } from "../utils/cache.js";
import { batchProcess } from "../utils/batch-process.js";
import { resolveDataType } from "../utils/resolve-data-type.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CustomAction {
  name: string;
  key: string;
  fileKey: string;
  args: { name: string; type: string; required: boolean }[];
  returnType: string | null;
  includeContext: boolean;
  code?: string;
}

interface CustomFunction {
  name: string;
  key: string;
  fileKey: string;
  args: { name: string; type: string; required: boolean }[];
  returnType: string | null;
  code?: string;
}

interface CustomWidget {
  name: string;
  key: string;
  fileKey: string;
  params: { name: string; type: string; required: boolean }[];
  description: string;
  code?: string;
}

interface AIAgent {
  name: string;
  key: string;
  fileKey: string;
  displayName: string;
  status: string;
  provider: string;
  model: string;
  requestTypes: string[];
  responseType: string;
  description: string;
}

type Category = "actions" | "functions" | "widgets" | "agents";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatArg(arg: { name: string; type: string; required: boolean }): string {
  return arg.required ? `${arg.name}: ${arg.type} (required)` : `${arg.name}: ${arg.type}?`;
}

function formatAction(action: CustomAction): string {
  const lines: string[] = [];
  lines.push(`### ${action.name}`);
  lines.push(`Key: ${action.key} | File: \`${action.fileKey}\``);
  if (action.args.length === 0) {
    lines.push("Args: (none)");
  } else {
    lines.push(`Args: ${action.args.map(formatArg).join(", ")}`);
  }
  lines.push(`Returns: ${action.returnType ?? "void"}`);
  lines.push(`Context: ${action.includeContext ? "Yes" : "No"}`);
  if (action.code !== undefined) {
    lines.push("");
    lines.push("```dart");
    lines.push(action.code);
    lines.push("```");
  }
  return lines.join("\n");
}

function formatFunction(fn: CustomFunction): string {
  const lines: string[] = [];
  lines.push(`### ${fn.name}`);
  lines.push(`Key: ${fn.key} | File: \`${fn.fileKey}\``);
  if (fn.args.length === 0) {
    lines.push("Args: (none)");
  } else {
    lines.push(`Args: ${fn.args.map(formatArg).join(", ")}`);
  }
  lines.push(`Returns: ${fn.returnType ?? "void"}`);
  if (fn.code !== undefined) {
    lines.push("");
    lines.push("```dart");
    lines.push(fn.code);
    lines.push("```");
  }
  return lines.join("\n");
}

function formatWidget(widget: CustomWidget): string {
  const lines: string[] = [];
  lines.push(`### ${widget.name}`);
  lines.push(`Key: ${widget.key} | File: \`${widget.fileKey}\``);
  if (widget.params.length === 0) {
    lines.push("Params: (none)");
  } else {
    lines.push("Params:");
    for (const p of widget.params) {
      const suffix = p.required ? " (required)" : "";
      lines.push(`  - ${p.name}: ${p.type}${suffix}`);
    }
  }
  if (widget.code !== undefined) {
    lines.push("");
    lines.push("```dart");
    lines.push(widget.code);
    lines.push("```");
  }
  return lines.join("\n");
}

function formatAgent(agent: AIAgent): string {
  const lines: string[] = [];
  lines.push(`### ${agent.displayName} [${agent.status}]`);
  lines.push(`Key: ${agent.key} | File: \`${agent.fileKey}\``);
  lines.push(`Provider: ${agent.provider} (${agent.model})`);
  lines.push(`Input: ${agent.requestTypes.join(", ")}`);
  lines.push(`Output: ${agent.responseType}`);
  if (agent.description) {
    lines.push(`Description: ${agent.description}`);
  }
  return lines.join("\n");
}

function resolveReturnType(
  returnParam: Record<string, unknown> | undefined
): string | null {
  if (!returnParam) return null;
  const dt = returnParam.dataType as Record<string, unknown> | undefined;
  if (!dt) return null;
  const resolved = resolveDataType(dt);
  const nonNullable = (dt.nonNullable as boolean) ?? false;
  return nonNullable ? `${resolved} (required)` : `${resolved}?`;
}

function parseArgs(
  rawArgs: Record<string, unknown>[] | undefined
): { name: string; type: string; required: boolean }[] {
  if (!Array.isArray(rawArgs)) return [];
  return rawArgs.map((arg) => {
    const id = arg.identifier as Record<string, unknown> | undefined;
    const name = (id?.name as string) || "unknown";
    const dt = (arg.dataType as Record<string, unknown>) || {};
    const type = resolveDataType(dt);
    const required = (dt.nonNullable as boolean) ?? false;
    return { name, type, required };
  });
}

// ---------------------------------------------------------------------------
// Category processors
// ---------------------------------------------------------------------------

async function processActions(
  projectId: string,
  nameFilter: string | undefined,
  includeCode: boolean
): Promise<CustomAction[]> {
  const allKeys = await listCachedKeys(projectId, "custom-actions/id-");
  const topKeys = allKeys.filter((k) => /^custom-actions\/id-[a-z0-9]+$/i.test(k));

  return batchProcess(topKeys, 10, async (fileKey): Promise<CustomAction | null> => {
    const content = await cacheRead(projectId, fileKey);
    if (!content) return null;
    const doc = YAML.parse(content) as Record<string, unknown>;
    const id = doc.identifier as Record<string, unknown> | undefined;
    const name = (id?.name as string) || "unknown";
    if (nameFilter && name.toLowerCase() !== nameFilter.toLowerCase()) return null;

    const idKey = (id?.key as string) || fileKey.match(/id-([a-z0-9]+)$/i)?.[1] || "unknown";
    const args = parseArgs(doc.arguments as Record<string, unknown>[] | undefined);
    const returnType = resolveReturnType(doc.returnParameter as Record<string, unknown> | undefined);
    const includeContext = (doc.includeContext as boolean) ?? false;

    let code: string | undefined;
    if (includeCode) {
      const codeContent = await cacheRead(projectId, `custom-actions/id-${idKey}/action-code.dart`);
      if (codeContent) code = codeContent;
    }

    return { name, key: idKey, fileKey, args, returnType, includeContext, code };
  }).then((results) => results.filter((r): r is CustomAction => r !== null));
}

async function processFunctions(
  projectId: string,
  nameFilter: string | undefined,
  includeCode: boolean
): Promise<CustomFunction[]> {
  const allKeys = await listCachedKeys(projectId, "custom-functions/id-");
  const topKeys = allKeys.filter((k) => /^custom-functions\/id-[a-z0-9]+$/i.test(k));

  return batchProcess(topKeys, 10, async (fileKey): Promise<CustomFunction | null> => {
    const content = await cacheRead(projectId, fileKey);
    if (!content) return null;
    const doc = YAML.parse(content) as Record<string, unknown>;
    const id = doc.identifier as Record<string, unknown> | undefined;
    const name = (id?.name as string) || "unknown";
    if (nameFilter && name.toLowerCase() !== nameFilter.toLowerCase()) return null;

    const idKey = (id?.key as string) || fileKey.match(/id-([a-z0-9]+)$/i)?.[1] || "unknown";
    const args = parseArgs(doc.arguments as Record<string, unknown>[] | undefined);
    const returnType = resolveReturnType(doc.returnParameter as Record<string, unknown> | undefined);

    let code: string | undefined;
    if (includeCode) {
      const codeContent = await cacheRead(projectId, `custom-functions/id-${idKey}/function-code.dart`);
      if (codeContent) code = codeContent;
    }

    return { name, key: idKey, fileKey, args, returnType, code };
  }).then((results) => results.filter((r): r is CustomFunction => r !== null));
}

async function processWidgets(
  projectId: string,
  nameFilter: string | undefined,
  includeCode: boolean
): Promise<CustomWidget[]> {
  const allKeys = await listCachedKeys(projectId, "custom-widgets/id-");
  const topKeys = allKeys.filter((k) => /^custom-widgets\/id-[a-z0-9]+$/i.test(k));

  return batchProcess(topKeys, 10, async (fileKey): Promise<CustomWidget | null> => {
    const content = await cacheRead(projectId, fileKey);
    if (!content) return null;
    const doc = YAML.parse(content) as Record<string, unknown>;
    const id = doc.identifier as Record<string, unknown> | undefined;
    const name = (id?.name as string) || "unknown";
    if (nameFilter && name.toLowerCase() !== nameFilter.toLowerCase()) return null;

    const idKey = (id?.key as string) || fileKey.match(/id-([a-z0-9]+)$/i)?.[1] || "unknown";
    const rawParams = doc.parameters as Record<string, unknown>[] | undefined;
    const params = parseArgs(rawParams);
    const description = (doc.description as string) || "";

    let code: string | undefined;
    if (includeCode) {
      const codeContent = await cacheRead(projectId, `custom-widgets/id-${idKey}/widget-code.dart`);
      if (codeContent) code = codeContent;
    }

    return { name, key: idKey, fileKey, params, description, code };
  }).then((results) => results.filter((r): r is CustomWidget => r !== null));
}

async function processAgents(
  projectId: string,
  nameFilter: string | undefined
): Promise<AIAgent[]> {
  const allKeys = await listCachedKeys(projectId, "agent/id-");
  const topKeys = allKeys.filter((k) => /^agent\/id-[a-z0-9]+$/i.test(k));

  return batchProcess(topKeys, 10, async (fileKey): Promise<AIAgent | null> => {
    const content = await cacheRead(projectId, fileKey);
    if (!content) return null;
    const doc = YAML.parse(content) as Record<string, unknown>;
    const id = doc.identifier as Record<string, unknown> | undefined;
    const identifierName = (id?.name as string) || "unknown";
    if (nameFilter && identifierName.toLowerCase() !== nameFilter.toLowerCase()) return null;

    const idKey = (id?.key as string) || fileKey.match(/id-([a-z0-9]+)$/i)?.[1] || "unknown";
    const displayName = (doc.name as string) || identifierName;
    const status = (doc.status as string) || "UNKNOWN";
    const aiModel = doc.aiModel as Record<string, unknown> | undefined;
    const provider = (aiModel?.provider as string) || "UNKNOWN";
    const model = (aiModel?.model as string) || "unknown";
    const reqOpts = doc.requestOptions as Record<string, unknown> | undefined;
    const requestTypes = (reqOpts?.requestTypes as string[]) || [];
    const resOpts = doc.responseOptions as Record<string, unknown> | undefined;
    const responseType = (resOpts?.responseType as string) || "UNKNOWN";
    const description = (doc.description as string) || "";

    return { name: identifierName, key: idKey, fileKey, displayName, status, provider, model, requestTypes, responseType, description };
  }).then((results) => results.filter((r): r is AIAgent => r !== null));
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerGetCustomCodeTool(server: McpServer) {
  server.tool(
    "get_custom_code",
    "Get custom actions, functions, widgets, and AI agents from local cache — signatures, arguments, return types, and optionally Dart source code. No API calls. Run sync_project first if not cached.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      type: z
        .enum(["actions", "functions", "widgets", "agents", "all"])
        .optional()
        .default("all")
        .describe("Type of custom code to retrieve"),
      name: z
        .string()
        .optional()
        .describe("Case-insensitive filter on identifier name"),
      includeCode: z
        .boolean()
        .optional()
        .default(false)
        .describe("Include Dart source code in output"),
    },
    async ({ projectId, type, name, includeCode }) => {
      const meta = await cacheMeta(projectId);
      if (!meta) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No cache found for project "${projectId}". Run sync_project first to download the project YAML files.`,
            },
          ],
        };
      }

      const categories: Category[] =
        type === "all"
          ? ["actions", "functions", "widgets", "agents"]
          : [type];

      const sections: string[] = [];

      for (const cat of categories) {
        if (cat === "actions") {
          const items = await processActions(projectId, name, includeCode);
          if (items.length > 0) {
            sections.push(`## Custom Actions (${items.length})\n\n${items.map(formatAction).join("\n\n")}`);
          }
        } else if (cat === "functions") {
          const items = await processFunctions(projectId, name, includeCode);
          if (items.length > 0) {
            sections.push(`## Custom Functions (${items.length})\n\n${items.map(formatFunction).join("\n\n")}`);
          }
        } else if (cat === "widgets") {
          const items = await processWidgets(projectId, name, includeCode);
          if (items.length > 0) {
            sections.push(`## Custom Widgets (${items.length})\n\n${items.map(formatWidget).join("\n\n")}`);
          }
        } else if (cat === "agents") {
          const items = await processAgents(projectId, name);
          if (items.length > 0) {
            sections.push(`## AI Agents (${items.length})\n\n${items.map(formatAgent).join("\n\n")}`);
          }
        }
      }

      if (sections.length === 0) {
        return {
          content: [
            { type: "text" as const, text: "No custom code found in cache." },
          ],
        };
      }

      const output = `# Custom Code\n\n${sections.join("\n\n")}`;

      return {
        content: [{ type: "text" as const, text: output }],
      };
    }
  );
}

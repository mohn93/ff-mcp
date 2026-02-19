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

interface AppActionComponent {
  name: string;
  key: string;
  fileKey: string;
  rootActionType: string;
  rootActionName: string;
  description: string;
}

interface CustomFile {
  name: string;
  key: string;
  fileKey: string;
  fileType: string;
  initialCount: number;
  finalCount: number;
}

type Category = "actions" | "functions" | "widgets" | "agents" | "app-actions" | "custom-files";

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

function formatAppAction(action: AppActionComponent): string {
  const lines: string[] = [];
  lines.push(`### ${action.name}`);
  lines.push(`Key: ${action.key} | File: \`${action.fileKey}\``);
  lines.push(`Root action: ${action.rootActionType}(${action.rootActionName})`);
  if (action.description) {
    lines.push(`Description: "${action.description}"`);
  }
  return lines.join("\n");
}

function formatCustomFile(file: CustomFile): string {
  const lines: string[] = [];
  lines.push(`### ${file.name}`);
  lines.push(`Key: ${file.key} | File: \`${file.fileKey}\``);
  lines.push(`Type: ${file.fileType}`);
  lines.push(`Actions: ${file.initialCount} initial, ${file.finalCount} final`);
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

async function processAppActions(
  projectId: string,
  nameFilter: string | undefined
): Promise<AppActionComponent[]> {
  const allKeys = await listCachedKeys(projectId, "app-action-components/id-");
  const topKeys = allKeys.filter((k) => /^app-action-components\/id-[a-z0-9]+$/i.test(k));

  return batchProcess(topKeys, 10, async (fileKey): Promise<AppActionComponent | null> => {
    const content = await cacheRead(projectId, fileKey);
    if (!content) return null;
    const doc = YAML.parse(content) as Record<string, unknown>;
    const id = doc.identifier as Record<string, unknown> | undefined;
    const name = (id?.name as string) || "unknown";
    if (nameFilter && name.toLowerCase() !== nameFilter.toLowerCase()) return null;

    const idKey = (id?.key as string) || fileKey.match(/id-([a-z0-9]+)$/i)?.[1] || "unknown";
    const description = (doc.description as string) || "";

    // Extract root action type and name
    let rootActionType = "unknown";
    let rootActionName = "unknown";
    const actions = doc.actions as Record<string, unknown> | undefined;
    const rootAction = actions?.rootAction as Record<string, unknown> | undefined;
    const actionObj = rootAction?.action as Record<string, unknown> | undefined;
    if (actionObj) {
      const actionKeys = Object.keys(actionObj);
      if (actionKeys.length > 0) {
        rootActionType = actionKeys[0];
        const actionBody = actionObj[rootActionType] as Record<string, unknown> | undefined;
        if (actionBody) {
          // Look for a sub-key ending in "Identifier" to get the name
          for (const subKey of Object.keys(actionBody)) {
            if (subKey.endsWith("Identifier")) {
              const identifierObj = actionBody[subKey] as Record<string, unknown> | undefined;
              rootActionName = (identifierObj?.name as string) || rootActionName;
              break;
            }
          }
        }
      }
    }

    return { name, key: idKey, fileKey, rootActionType, rootActionName, description };
  }).then((results) => results.filter((r): r is AppActionComponent => r !== null));
}

async function processCustomFiles(
  projectId: string,
  nameFilter: string | undefined
): Promise<CustomFile[]> {
  const allKeys = await listCachedKeys(projectId, "custom-file/id-");
  const topKeys = allKeys.filter(
    (k) => /^custom-file\/id-[^/]+$/i.test(k) && k !== "custom-file/id-MAIN"
  );

  return batchProcess(topKeys, 10, async (fileKey): Promise<CustomFile | null> => {
    const content = await cacheRead(projectId, fileKey);
    if (!content) return null;
    const doc = YAML.parse(content) as Record<string, unknown>;

    const keyMatch = fileKey.match(/^custom-file\/id-(.+)$/i);
    const key = keyMatch?.[1] || "unknown";
    const name = key;
    if (nameFilter && name.toLowerCase() !== nameFilter.toLowerCase()) return null;

    const fileType = (doc.type as string) || "UNKNOWN";
    const actions = (doc.actions as Record<string, unknown>[]) || [];
    let initialCount = 0;
    let finalCount = 0;
    for (const action of actions) {
      if (action.type === "INITIAL_ACTION") initialCount++;
      else if (action.type === "FINAL_ACTION") finalCount++;
    }

    return { name, key, fileKey, fileType, initialCount, finalCount };
  }).then((results) => results.filter((r): r is CustomFile => r !== null));
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerGetCustomCodeTool(server: McpServer) {
  server.tool(
    "get_custom_code",
    "Get custom actions, functions, widgets, AI agents, app action components, and custom files from local cache — signatures, arguments, return types, and optionally Dart source code. No API calls. Run sync_project first if not cached.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      type: z
        .enum(["actions", "functions", "widgets", "agents", "app-actions", "custom-files", "all"])
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
          ? ["actions", "functions", "widgets", "agents", "app-actions", "custom-files"]
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
        } else if (cat === "app-actions") {
          const items = await processAppActions(projectId, name);
          if (items.length > 0) {
            sections.push(`## App Action Components (${items.length})\n\n${items.map(formatAppAction).join("\n\n")}`);
          }
        } else if (cat === "custom-files") {
          const items = await processCustomFiles(projectId, name);
          if (items.length > 0) {
            sections.push(`## Custom Files (${items.length})\n\n${items.map(formatCustomFile).join("\n\n")}`);
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

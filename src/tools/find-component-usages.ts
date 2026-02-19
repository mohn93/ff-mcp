/**
 * find_component_usages tool — scans cached node files to find all pages and
 * components where a given component is instantiated.
 * Zero API calls: everything comes from the local .ff-cache.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import YAML from "yaml";
import {
  cacheRead,
  cacheMeta,
  cacheAgeFooter,
  listCachedKeys,
} from "../utils/cache.js";
import { resolveComponent } from "./get-component-summary.js";
import { batchProcess } from "../utils/batch-process.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParamPass {
  paramName: string;
  value: string;
}

interface Usage {
  parentType: "page" | "component";
  parentName: string;
  parentId: string;
  widgetKey: string;
  params: ParamPass[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the value of a parameter pass to a readable string.
 */
export function resolveParamValue(paramObj: Record<string, unknown>): string {
  // Check for variable source (e.g. INTERNATIONALIZATION)
  const variable = paramObj.variable as Record<string, unknown> | undefined;
  if (variable) {
    const source = variable.source as string | undefined;
    if (source === "INTERNATIONALIZATION") {
      const fc = variable.functionCall as Record<string, unknown> | undefined;
      const values = fc?.values as Record<string, unknown>[] | undefined;
      if (values && values.length > 0) {
        const first = values[0];
        const iv = first.inputValue as Record<string, unknown> | undefined;
        const sv = iv?.serializedValue as string | undefined;
        return sv ? `"${sv}" (i18n)` : "[i18n]";
      }
      return "[i18n]";
    }
    if (source) return `[${source}]`;
    return "[dynamic]";
  }

  // Check for inputValue
  const inputValue = paramObj.inputValue as unknown;
  if (inputValue != null) {
    if (typeof inputValue === "string" || typeof inputValue === "number") {
      return `"${inputValue}"`;
    }
    if (typeof inputValue === "object") {
      const ivo = inputValue as Record<string, unknown>;
      if ("serializedValue" in ivo) return `"${ivo.serializedValue}"`;
      if ("themeColor" in ivo) return `[theme:${ivo.themeColor}]`;
    }
  }

  return "[dynamic]";
}

/**
 * Extract parent context (page or component name + ID) from a file key path.
 * Examples:
 *   "page/id-Scaffold_xxx/page-widget-tree-outline/node/id-Widget_yyy"
 *   "component/id-Container_xxx/component-widget-tree-outline/node/id-Widget_yyy"
 */
export function parseParentFromKey(fileKey: string): { type: "page" | "component"; id: string } | null {
  const pageMatch = fileKey.match(/^page\/id-(Scaffold_\w+)\//);
  if (pageMatch) return { type: "page", id: pageMatch[1] };

  const compMatch = fileKey.match(/^component\/id-(Container_\w+)\//);
  if (compMatch) return { type: "component", id: compMatch[1] };

  return null;
}

/**
 * Resolve the name of a page or component from its top-level YAML cache.
 */
async function resolveParentName(
  projectId: string,
  parentType: "page" | "component",
  parentId: string
): Promise<string> {
  const prefix = parentType === "page" ? "page" : "component";
  const fileKey = `${prefix}/id-${parentId}`;
  const content = await cacheRead(projectId, fileKey);
  if (!content) return parentId;

  const nameMatch = content.match(/^name:\s*(.+)$/m);
  return nameMatch ? nameMatch[1].trim() : parentId;
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerFindComponentUsagesTool(server: McpServer) {
  server.tool(
    "find_component_usages",
    "Find all pages and components where a given component is used, with parameter pass details. Cache-only, no API calls. Run sync_project first.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      componentName: z
        .string()
        .optional()
        .describe(
          "Human-readable component name (e.g. 'PremuimContentWall'). Case-insensitive."
        ),
      componentId: z
        .string()
        .optional()
        .describe(
          "Container ID (e.g. 'Container_ffzg5wc5')."
        ),
    },
    async ({ projectId, componentName, componentId }) => {
      // Check cache exists
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

      if (!componentName && !componentId) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Provide either componentName or componentId.",
            },
          ],
        };
      }

      // Resolve component to its key
      const resolved = await resolveComponent(projectId, componentName, componentId);
      if (!resolved.ok) {
        const list = resolved.available.map((n) => `  - ${n}`).join("\n");
        const searchTerm = componentName || componentId || "";
        return {
          content: [
            {
              type: "text" as const,
              text: `Component "${searchTerm}" not found in cache. Available components:\n${list}`,
            },
          ],
        };
      }

      const targetId = resolved.component.containerId;

      // Get component name for display
      const componentContent = await cacheRead(projectId, resolved.component.componentFileKey);
      const displayName = componentContent
        ? (componentContent.match(/^name:\s*(.+)$/m)?.[1]?.trim() || targetId)
        : targetId;

      // Scan all node files for componentClassKeyRef matching this component
      const allKeys = await listCachedKeys(projectId);
      const nodeKeys = allKeys.filter((k) => /\/node\/id-[A-Z]/.test(k));

      // Read node files in batches to check for component references
      const usages: Usage[] = [];

      await batchProcess(nodeKeys, 20, async (nodeKey) => {
        const content = await cacheRead(projectId, nodeKey);
        if (!content) return;

        // Quick string check before parsing YAML
        if (!content.includes(targetId)) return;

        let doc: Record<string, unknown>;
        try {
          doc = YAML.parse(content) as Record<string, unknown>;
        } catch {
          return;
        }

        // Check componentClassKeyRef
        const classKeyRef = doc.componentClassKeyRef as Record<string, unknown> | undefined;
        if (!classKeyRef) return;

        const refKey = classKeyRef.key as string | undefined;
        if (refKey !== targetId) return;

        // Found a usage! Extract parent context
        const parent = parseParentFromKey(nodeKey);
        if (!parent) return;

        // Extract the widget key from the file key
        const widgetKeyMatch = nodeKey.match(/\/node\/id-(\w+)$/);
        const widgetKey = widgetKeyMatch ? widgetKeyMatch[1] : "unknown";

        // Extract parameter passes
        const params: ParamPass[] = [];
        const parameterValues = doc.parameterValues as Record<string, Record<string, unknown>> | undefined;
        if (parameterValues) {
          for (const [, paramVal] of Object.entries(parameterValues)) {
            const paramId = paramVal.paramIdentifier as string | undefined;
            const value = resolveParamValue(paramVal);
            params.push({
              paramName: paramId || "unknown",
              value,
            });
          }
        }

        // Resolve parent name
        const parentName = await resolveParentName(projectId, parent.type, parent.id);

        usages.push({
          parentType: parent.type,
          parentName,
          parentId: parent.id,
          widgetKey,
          params,
        });
      });

      // Format output
      if (usages.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Component: ${displayName} (${targetId})\nNo usages found in cached files.`,
            },
          ],
        };
      }

      const lines: string[] = [];
      lines.push(`Component: ${displayName} (${targetId})`);
      lines.push(`Found ${usages.length} usage${usages.length === 1 ? "" : "s"}:`);
      lines.push("");

      for (let i = 0; i < usages.length; i++) {
        const u = usages[i];
        const parentLabel = u.parentType === "page" ? u.parentName : `[component] ${u.parentName}`;
        lines.push(`${i + 1}. ${parentLabel} (${u.parentId}) \u2192 ${u.widgetKey}`);
        if (u.params.length > 0) {
          const paramStrs = u.params.map((p) => `${p.paramName} = ${p.value}`);
          lines.push(`   Params: ${paramStrs.join(", ")}`);
        }
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") + cacheAgeFooter(meta) }],
      };
    }
  );
}

/**
 * get_component_summary tool — assembles cached sub-files into a readable
 * component summary. Zero API calls: everything comes from the local .ff-cache.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import YAML from "yaml";
import {
  cacheRead,
  cacheMeta,
  listCachedKeys,
} from "../utils/cache.js";
import { parseTreeOutline } from "../utils/page-summary/tree-walker.js";
import { extractNodeInfo } from "../utils/page-summary/node-extractor.js";
import { summarizeTriggers } from "../utils/page-summary/action-summarizer.js";
import { formatComponentSummary } from "../utils/page-summary/formatter.js";
import {
  OutlineNode,
  ComponentMeta,
  ParamInfo,
  SummaryNode,
} from "../utils/page-summary/types.js";

// ---------------------------------------------------------------------------
// Component resolution from cache
// ---------------------------------------------------------------------------

interface ResolvedComponent {
  containerId: string;
  componentFileKey: string; // e.g. "component/id-Container_xxx"
}

/**
 * Resolve a component name or container ID to its cache file key.
 * Returns all available component names if no match found.
 */
export async function resolveComponent(
  projectId: string,
  componentName?: string,
  componentId?: string
): Promise<
  | { ok: true; component: ResolvedComponent }
  | { ok: false; available: string[] }
> {
  if (componentId) {
    const componentFileKey = `component/id-${componentId}`;
    const content = await cacheRead(projectId, componentFileKey);
    if (content) {
      return { ok: true, component: { containerId: componentId, componentFileKey } };
    }
  }

  // List all cached component top-level files
  const allKeys = await listCachedKeys(projectId, "component/id-");
  // Filter to top-level component files only (not sub-files)
  const componentKeys = allKeys.filter((k) => /^component\/id-Container_\w+$/.test(k));

  const available: string[] = [];

  for (const key of componentKeys) {
    const content = await cacheRead(projectId, key);
    if (!content) continue;

    const nameMatch = content.match(/^name:\s*(.+)$/m);
    const name = nameMatch ? nameMatch[1].trim() : "";

    if (componentName && name.toLowerCase() === componentName.toLowerCase()) {
      const cid = key.match(/^component\/id-(Container_\w+)$/)?.[1] || "";
      return { ok: true, component: { containerId: cid, componentFileKey: key } };
    }

    if (name) available.push(name);
  }

  return { ok: false, available };
}

// ---------------------------------------------------------------------------
// Metadata extraction
// ---------------------------------------------------------------------------

/** Resolve a scalar/list data type to a readable string. */
function resolveDataType(dt: Record<string, unknown>): string {
  if (dt.listType) {
    const inner = dt.listType as Record<string, unknown>;
    return `List<${(inner.scalarType as string) || "unknown"}>`;
  }
  if (dt.scalarType === "DataStruct") {
    const sub = dt.subType as Record<string, unknown> | undefined;
    const dsi = sub?.dataStructIdentifier as Record<string, unknown> | undefined;
    return dsi?.name ? `DataStruct:${dsi.name}` : "DataStruct";
  }
  if (dt.enumType) {
    const en = dt.enumType as Record<string, unknown>;
    const eid = en.enumIdentifier as Record<string, unknown> | undefined;
    return eid?.name ? `Enum:${eid.name}` : "Enum";
  }
  return (dt.scalarType as string) || "unknown";
}

/** Extract component metadata (name, description, params) from the top-level YAML. */
async function extractComponentMeta(
  projectId: string,
  component: ResolvedComponent
): Promise<ComponentMeta> {
  const content = await cacheRead(projectId, component.componentFileKey);
  if (!content) {
    return {
      componentName: component.containerId,
      containerId: component.containerId,
      description: "",
      params: [],
    };
  }

  const doc = YAML.parse(content) as Record<string, unknown>;
  const componentName = (doc.name as string) || component.containerId;
  const description = (doc.description as string) || "";

  // Params
  const params: ParamInfo[] = [];
  const rawParams = doc.params as Record<string, Record<string, unknown>> | undefined;
  if (rawParams) {
    for (const val of Object.values(rawParams)) {
      const id = val.identifier as Record<string, unknown> | undefined;
      const name = (id?.name as string) || "unknown";
      const dt = (val.dataType as Record<string, unknown>) || {};
      const defaultVal = val.defaultValue as Record<string, unknown> | undefined;
      params.push({
        name,
        dataType: resolveDataType(dt),
        defaultValue: defaultVal?.serializedValue as string | undefined,
      });
    }
  }

  return { componentName, containerId: component.containerId, description, params };
}

// ---------------------------------------------------------------------------
// Tree enrichment (reused from page summary)
// ---------------------------------------------------------------------------

/**
 * Recursively enrich an OutlineNode tree with node info and trigger summaries.
 */
async function enrichNode(
  projectId: string,
  treePrefix: string, // e.g. "component/id-Container_xxx/component-widget-tree-outline"
  outline: OutlineNode
): Promise<SummaryNode> {
  const nodeInfo = await extractNodeInfo(projectId, treePrefix, outline.key);

  // Check for triggers
  const nodeFilePrefix = `${treePrefix}/node/id-${outline.key}`;
  const triggers = await summarizeTriggers(projectId, nodeFilePrefix);

  // Enrich children
  const children = await Promise.all(
    outline.children.map((child) => enrichNode(projectId, treePrefix, child))
  );

  return {
    key: outline.key,
    type: nodeInfo.type,
    name: nodeInfo.name,
    slot: outline.slot,
    detail: nodeInfo.detail,
    triggers,
    children,
  };
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerGetComponentSummaryTool(server: McpServer) {
  server.tool(
    "get_component_summary",
    "Get a readable summary of a FlutterFlow component from local cache — widget tree, actions, params. No API calls. Run sync_project first if not cached.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      componentName: z
        .string()
        .optional()
        .describe(
          "Human-readable component name (e.g. 'PremuimContentWall'). Case-insensitive. Provide either componentName or componentId."
        ),
      componentId: z
        .string()
        .optional()
        .describe(
          "Container ID (e.g. 'Container_ffzg5wc5'). Provide either componentName or componentId."
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

      // Resolve component
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

      const component = resolved.component;

      // Extract metadata
      const componentMeta = await extractComponentMeta(projectId, component);

      // Parse widget tree outline
      const outlineKey = `${component.componentFileKey}/component-widget-tree-outline`;
      const outlineContent = await cacheRead(projectId, outlineKey);
      if (!outlineContent) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Component "${componentMeta.componentName}" found but widget tree outline is not cached. Re-run sync_project to fetch all sub-files.`,
            },
          ],
        };
      }

      const outlineTree = parseTreeOutline(outlineContent);

      // Enrich the tree with node info and triggers
      const enrichedTree = await enrichNode(
        projectId,
        outlineKey,
        outlineTree
      );

      // Format output
      const summary = formatComponentSummary(componentMeta, enrichedTree);

      return {
        content: [{ type: "text" as const, text: summary }],
      };
    }
  );
}

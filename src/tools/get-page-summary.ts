/**
 * get_page_summary tool — assembles cached sub-files into a readable page summary.
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
import { parseFolderMapping } from "../utils/parse-folders.js";
import { parseTreeOutline } from "../utils/page-summary/tree-walker.js";
import { extractNodeInfo } from "../utils/page-summary/node-extractor.js";
import { summarizeTriggers } from "../utils/page-summary/action-summarizer.js";
import { formatPageSummary } from "../utils/page-summary/formatter.js";
import {
  OutlineNode,
  PageMeta,
  ParamInfo,
  StateFieldInfo,
  SummaryNode,
} from "../utils/page-summary/types.js";
import { resolveDataType } from "../utils/resolve-data-type.js";

// ---------------------------------------------------------------------------
// Page resolution from cache
// ---------------------------------------------------------------------------

interface ResolvedPage {
  scaffoldId: string;
  pageFileKey: string; // e.g. "page/id-Scaffold_xxx"
}

/**
 * Resolve a page name or scaffold ID to its cache file key.
 * Returns all available page names if no match found.
 */
export async function resolvePage(
  projectId: string,
  pageName?: string,
  scaffoldId?: string
): Promise<
  | { ok: true; page: ResolvedPage }
  | { ok: false; available: string[] }
> {
  if (scaffoldId) {
    const pageFileKey = `page/id-${scaffoldId}`;
    const content = await cacheRead(projectId, pageFileKey);
    if (content) {
      return { ok: true, page: { scaffoldId, pageFileKey } };
    }
  }

  // List all cached page top-level files
  const allKeys = await listCachedKeys(projectId, "page/id-Scaffold_");
  // Filter to top-level page files only (not sub-files)
  const pageKeys = allKeys.filter((k) => /^page\/id-Scaffold_\w+$/.test(k));

  const available: string[] = [];

  for (const key of pageKeys) {
    const content = await cacheRead(projectId, key);
    if (!content) continue;

    const nameMatch = content.match(/^name:\s*(.+)$/m);
    const name = nameMatch ? nameMatch[1].trim() : "";

    if (pageName && name.toLowerCase() === pageName.toLowerCase()) {
      const sid = key.match(/^page\/id-(Scaffold_\w+)$/)?.[1] || "";
      return { ok: true, page: { scaffoldId: sid, pageFileKey: key } };
    }

    if (name) available.push(name);
  }

  return { ok: false, available };
}

// ---------------------------------------------------------------------------
// Metadata extraction
// ---------------------------------------------------------------------------

/** Extract page metadata (name, params, state) from the top-level page YAML. */
async function extractPageMeta(
  projectId: string,
  page: ResolvedPage,
  folder: string
): Promise<PageMeta> {
  const content = await cacheRead(projectId, page.pageFileKey);
  if (!content) {
    return {
      pageName: page.scaffoldId,
      scaffoldId: page.scaffoldId,
      folder,
      params: [],
      stateFields: [],
    };
  }

  const doc = YAML.parse(content) as Record<string, unknown>;
  const pageName = (doc.name as string) || page.scaffoldId;

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

  // State fields
  const stateFields: StateFieldInfo[] = [];
  const classModel = doc.classModel as Record<string, unknown> | undefined;
  const rawFields = classModel?.stateFields as Record<string, unknown>[] | undefined;
  if (Array.isArray(rawFields)) {
    for (const field of rawFields) {
      const param = field.parameter as Record<string, unknown> | undefined;
      if (!param) continue;
      const id = param.identifier as Record<string, unknown> | undefined;
      const name = (id?.name as string) || "unknown";
      const dt = (param.dataType as Record<string, unknown>) || {};
      const defaultVals = field.serializedDefaultValue as string[] | undefined;
      stateFields.push({
        name,
        dataType: resolveDataType(dt),
        defaultValue: defaultVals?.[0],
      });
    }
  }

  return { pageName, scaffoldId: page.scaffoldId, folder, params, stateFields };
}

// ---------------------------------------------------------------------------
// Tree enrichment
// ---------------------------------------------------------------------------

/**
 * Recursively enrich an OutlineNode tree with node info and trigger summaries.
 */
async function enrichNode(
  projectId: string,
  pagePrefix: string, // e.g. "page/id-Scaffold_xxx/page-widget-tree-outline"
  outline: OutlineNode
): Promise<SummaryNode> {
  const nodeInfo = await extractNodeInfo(projectId, pagePrefix, outline.key);

  // Check for triggers
  const nodeFilePrefix = `${pagePrefix}/node/id-${outline.key}`;
  const triggers = await summarizeTriggers(projectId, nodeFilePrefix);

  // Enrich children
  const children = await Promise.all(
    outline.children.map((child) => enrichNode(projectId, pagePrefix, child))
  );

  return {
    key: outline.key,
    type: nodeInfo.type,
    name: nodeInfo.name,
    slot: outline.slot,
    detail: nodeInfo.detail,
    componentRef: nodeInfo.componentRef,
    componentId: nodeInfo.componentId,
    triggers,
    children,
  };
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerGetPageSummaryTool(server: McpServer) {
  server.tool(
    "get_page_summary",
    "Get a readable summary of a FlutterFlow page from local cache — widget tree, actions, params, state. Component references are resolved to show [ComponentName] (ComponentId) instead of plain Container. Use the ComponentId with get_component_summary to drill into a component. No API calls. Run sync_project first if not cached.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      pageName: z
        .string()
        .optional()
        .describe(
          "Human-readable page name (e.g. 'PaywallPage'). Case-insensitive. Provide either pageName or scaffoldId."
        ),
      scaffoldId: z
        .string()
        .optional()
        .describe(
          "Scaffold ID (e.g. 'Scaffold_tydsj8ql'). Provide either pageName or scaffoldId."
        ),
    },
    async ({ projectId, pageName, scaffoldId }) => {
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

      if (!pageName && !scaffoldId) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Provide either pageName or scaffoldId.",
            },
          ],
        };
      }

      // Resolve page
      const resolved = await resolvePage(projectId, pageName, scaffoldId);
      if (!resolved.ok) {
        const list = resolved.available.map((n) => `  - ${n}`).join("\n");
        const searchTerm = pageName || scaffoldId || "";
        return {
          content: [
            {
              type: "text" as const,
              text: `Page "${searchTerm}" not found in cache. Available pages:\n${list}`,
            },
          ],
        };
      }

      const page = resolved.page;

      // Get folder mapping
      const foldersContent = await cacheRead(projectId, "folders");
      const folderMap = foldersContent
        ? parseFolderMapping(foldersContent)
        : {};
      const folder = folderMap[page.scaffoldId] || "(unmapped)";

      // Extract metadata
      const pageMeta = await extractPageMeta(projectId, page, folder);

      // Parse widget tree outline
      const outlineKey = `${page.pageFileKey}/page-widget-tree-outline`;
      const outlineContent = await cacheRead(projectId, outlineKey);
      if (!outlineContent) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Page "${pageMeta.pageName}" found but widget tree outline is not cached. Re-run sync_project to fetch all sub-files.`,
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
      const summary = formatPageSummary(pageMeta, enrichedTree);

      return {
        content: [{ type: "text" as const, text: summary + cacheAgeFooter(meta) }],
      };
    }
  );
}

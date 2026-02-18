/**
 * find_page_navigations tool — scans cached action files to find all places
 * that navigate to a given page.
 * Zero API calls: everything comes from the local .ff-cache.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import YAML from "yaml";
import {
  cacheRead,
  cacheMeta,
  listCachedKeys,
} from "../utils/cache.js";
import { resolvePage } from "./get-page-summary.js";
import { batchProcess } from "../utils/batch-process.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavigationRef {
  parentType: "page" | "component";
  parentName: string;
  parentId: string;
  widgetKey: string;
  trigger: string;
  disabled: boolean;
  allowBack: boolean;
  passedParams: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse parent context from an action file key.
 * Example: "page/id-Scaffold_XXX/page-widget-tree-outline/node/id-Widget_YYY/trigger_actions/id-ON_TAP/action/id-zzz"
 */
export function parseActionContext(fileKey: string): {
  parentType: "page" | "component";
  parentId: string;
  widgetKey: string;
  trigger: string;
} | null {
  // Page action
  const pageMatch = fileKey.match(
    /^page\/id-(Scaffold_\w+)\/.*\/node\/id-(\w+)\/trigger_actions\/id-([^/]+)\/action\//
  );
  if (pageMatch) {
    return {
      parentType: "page",
      parentId: pageMatch[1],
      widgetKey: pageMatch[2],
      trigger: pageMatch[3],
    };
  }

  // Component action
  const compMatch = fileKey.match(
    /^component\/id-(Container_\w+)\/.*\/node\/id-(\w+)\/trigger_actions\/id-([^/]+)\/action\//
  );
  if (compMatch) {
    return {
      parentType: "component",
      parentId: compMatch[1],
      widgetKey: compMatch[2],
      trigger: compMatch[3],
    };
  }

  return null;
}

/**
 * Recursively search an object for a navigate action targeting the given scaffold ID.
 * Returns navigate details if found, including whether it's inside a disableAction.
 */
export function findNavigateAction(
  obj: unknown,
  targetScaffoldId: string,
  isDisabled: boolean,
  depth: number
): { disabled: boolean; allowBack: boolean; passedParams: string[] } | null {
  if (!obj || typeof obj !== "object" || depth > 12) return null;
  const o = obj as Record<string, unknown>;

  // Check for disableAction wrapper
  if ("disableAction" in o) {
    const da = o.disableAction as Record<string, unknown>;
    return findNavigateAction(da, targetScaffoldId, true, depth + 1);
  }

  // Check for navigate action with matching pageNodeKeyRef
  if ("navigate" in o) {
    const nav = o.navigate as Record<string, unknown>;
    const pageRef = nav.pageNodeKeyRef as Record<string, unknown> | undefined;
    if (pageRef?.key === targetScaffoldId) {
      const allowBack = (nav.allowBack as boolean) ?? true;
      const passedParams: string[] = [];
      const params = nav.passedParameters as Record<string, unknown> | undefined;
      if (params) {
        for (const [key, val] of Object.entries(params)) {
          if (key === "widgetClassNodeKeyRef") continue;
          passedParams.push(key);
        }
      }
      return { disabled: isDisabled, allowBack, passedParams };
    }
  }

  // Recurse into values
  for (const val of Object.values(o)) {
    if (val && typeof val === "object") {
      const found = findNavigateAction(val, targetScaffoldId, isDisabled, depth + 1);
      if (found) return found;
    }
  }

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

export function registerFindPageNavigationsTool(server: McpServer) {
  server.tool(
    "find_page_navigations",
    "Find all actions that navigate to a given page, showing source page, trigger, disabled status, and passed parameters. Cache-only, no API calls. Run sync_project first.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      pageName: z
        .string()
        .optional()
        .describe(
          "Human-readable page name (e.g. 'PaywallPage'). Case-insensitive."
        ),
      scaffoldId: z
        .string()
        .optional()
        .describe(
          "Scaffold ID (e.g. 'Scaffold_tydsj8ql')."
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

      const targetScaffoldId = resolved.page.scaffoldId;

      // Get target page name for display
      const targetContent = await cacheRead(projectId, resolved.page.pageFileKey);
      const displayName = targetContent
        ? (targetContent.match(/^name:\s*(.+)$/m)?.[1]?.trim() || targetScaffoldId)
        : targetScaffoldId;

      // Scan all action files for navigate references
      const allKeys = await listCachedKeys(projectId);
      const actionKeys = allKeys.filter((k) => /\/action\/id-/.test(k));

      const refs: NavigationRef[] = [];

      await batchProcess(actionKeys, 20, async (actionKey) => {
        const content = await cacheRead(projectId, actionKey);
        if (!content) return;

        // Quick string check before YAML parsing
        if (!content.includes(targetScaffoldId)) return;

        let doc: Record<string, unknown>;
        try {
          doc = YAML.parse(content) as Record<string, unknown>;
        } catch {
          return;
        }

        const navInfo = findNavigateAction(doc, targetScaffoldId, false, 0);
        if (!navInfo) return;

        const ctx = parseActionContext(actionKey);
        if (!ctx) return;

        const parentName = await resolveParentName(projectId, ctx.parentType, ctx.parentId);

        refs.push({
          parentType: ctx.parentType,
          parentName,
          parentId: ctx.parentId,
          widgetKey: ctx.widgetKey,
          trigger: ctx.trigger,
          disabled: navInfo.disabled,
          allowBack: navInfo.allowBack,
          passedParams: navInfo.passedParams,
        });
      });

      // Deduplicate (same parent + widget + trigger)
      const seen = new Set<string>();
      const uniqueRefs = refs.filter((r) => {
        const key = `${r.parentId}:${r.widgetKey}:${r.trigger}:${r.disabled}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Format output
      if (uniqueRefs.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Page: ${displayName} (${targetScaffoldId})\nNo navigations found in cached action files.`,
            },
          ],
        };
      }

      const lines: string[] = [];
      lines.push(`Page: ${displayName} (${targetScaffoldId})`);
      lines.push(`Found ${uniqueRefs.length} navigation${uniqueRefs.length === 1 ? "" : "s"}:`);
      lines.push("");

      for (let i = 0; i < uniqueRefs.length; i++) {
        const r = uniqueRefs[i];
        const status = r.disabled ? "[DISABLED] " : "";
        const parentLabel = r.parentType === "page" ? r.parentName : `[component] ${r.parentName}`;
        const back = r.allowBack ? "" : " (no back)";
        lines.push(`${i + 1}. ${status}${parentLabel} (${r.parentId}) → ${r.trigger} on ${r.widgetKey}${back}`);
        if (r.passedParams.length > 0) {
          lines.push(`   Params: ${r.passedParams.join(", ")}`);
        }
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FlutterFlowClient } from "../api/flutterflow.js";
import { decodeProjectYamlResponse } from "../utils/decode-yaml.js";
import { parseFolderMapping } from "../utils/parse-folders.js";

export interface PageInfo {
  scaffoldId: string;
  name: string;
  folder: string;
  fileKey: string;
}

/**
 * Extract page scaffold IDs from the partitioned file names list.
 * Filters for top-level page files only (not sub-files like widget-tree-outline).
 */
export function extractPageFileKeys(fileNames: unknown): string[] {
  const raw = fileNames as {
    value?: { file_names?: string[]; fileNames?: string[] };
  };
  const names =
    raw?.value?.file_names ?? raw?.value?.fileNames ?? [];
  return names.filter((n) => /^page\/id-Scaffold_\w+$/.test(n));
}

/**
 * Fetch a single YAML file and decode it. Returns null on failure.
 */
export async function fetchOneFile(
  client: FlutterFlowClient,
  projectId: string,
  fileName: string
): Promise<{ fileKey: string; content: string } | null> {
  try {
    const raw = await client.getProjectYamls(projectId, fileName);
    const decoded = decodeProjectYamlResponse(raw);
    const entries = Object.entries(decoded);
    if (entries.length > 0) {
      return { fileKey: fileName, content: entries[0][1] };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Process items in batches to avoid API rate limits.
 */
async function batchProcess<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

/**
 * Extract a compact page index by fetching pages in batches.
 */
export async function listPages(
  client: FlutterFlowClient,
  projectId: string
): Promise<PageInfo[]> {
  // Step 1: Get file list and folders in parallel
  const [fileNamesRaw, foldersResult] = await Promise.all([
    client.listPartitionedFileNames(projectId),
    fetchOneFile(client, projectId, "folders"),
  ]);

  const pageFileKeys = extractPageFileKeys(fileNamesRaw);
  const folderMap = foldersResult
    ? parseFolderMapping(foldersResult.content)
    : {};

  // Step 2: Fetch pages in batches of 5 to avoid rate limits
  const results = await batchProcess(pageFileKeys, 5, (fileKey) =>
    fetchOneFile(client, projectId, fileKey)
  );

  const pages: PageInfo[] = [];
  for (let i = 0; i < pageFileKeys.length; i++) {
    const fileKey = pageFileKeys[i];
    const scaffoldMatch = fileKey.match(/^page\/id-(Scaffold_\w+)$/);
    if (!scaffoldMatch) continue;

    const scaffoldId = scaffoldMatch[1];
    const result = results[i];

    let name = "(error - could not fetch)";
    if (result.status === "fulfilled" && result.value) {
      const nameMatch = result.value.content.match(/^name:\s*(.+)$/m);
      name = nameMatch ? nameMatch[1].trim() : "(unknown)";
    }

    const folder = folderMap[scaffoldId] || "(unmapped)";
    pages.push({ scaffoldId, name, folder, fileKey });
  }

  // Sort by folder then name
  pages.sort((a, b) =>
    a.folder === b.folder
      ? a.name.localeCompare(b.name)
      : a.folder.localeCompare(b.folder)
  );

  return pages;
}

export function registerListPagesTool(
  server: McpServer,
  client: FlutterFlowClient
) {
  server.tool(
    "list_pages",
    "List all pages in a FlutterFlow project with human-readable names, scaffold IDs, and folder assignments. Use this FIRST to discover pages before fetching their YAML.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
    },
    async ({ projectId }) => {
      const pages = await listPages(client, projectId);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(pages, null, 2),
          },
        ],
      };
    }
  );
}

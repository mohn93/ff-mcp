import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cacheMeta, listCachedKeys } from "../utils/cache.js";

const MAX_RESULTS = 100;

export function registerSearchProjectFilesTool(server: McpServer) {
  server.tool(
    "search_project_files",
    "Search cached project file keys by keyword, prefix, or regex. Returns matching file keys for use with get_project_yaml. Cache-only, no API calls. Run sync_project first.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      query: z.string().describe("Search query string"),
      mode: z
        .enum(["prefix", "contains", "regex"])
        .default("contains")
        .describe("Search mode: prefix (startsWith), contains (case-insensitive includes), or regex (case-insensitive RegExp)"),
    },
    async ({ projectId, query, mode }) => {
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

      const allKeys = await listCachedKeys(projectId);

      let matched: string[];
      switch (mode) {
        case "prefix":
          matched = allKeys.filter((k) => k.startsWith(query));
          break;
        case "regex": {
          const re = new RegExp(query, "i");
          matched = allKeys.filter((k) => re.test(k));
          break;
        }
        case "contains":
        default: {
          const lowerQuery = query.toLowerCase();
          matched = allKeys.filter((k) => k.toLowerCase().includes(lowerQuery));
          break;
        }
      }

      if (matched.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No files found matching "${query}" (mode: ${mode}).`,
            },
          ],
        };
      }

      const total = matched.length;
      const truncated = total > MAX_RESULTS;
      const displayed = truncated ? matched.slice(0, MAX_RESULTS) : matched;

      const lines: string[] = [];

      if (truncated) {
        lines.push(`Found ${MAX_RESULTS} of ${total} files matching "${query}" (showing first ${MAX_RESULTS}):`);
      } else {
        lines.push(`Found ${total} files matching "${query}":`);
      }

      for (const key of displayed) {
        lines.push(`- ${key}`);
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}

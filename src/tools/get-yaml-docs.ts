/**
 * get_yaml_docs tool — search and retrieve FlutterFlow YAML reference documentation.
 * No API calls: reads from bundled docs/ff-yaml/ directory.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TOPIC_MAP, DOCS_DIR, listDocFiles, readDoc } from "../utils/topic-map.js";

export function registerGetYamlDocsTool(server: McpServer) {
  server.tool(
    "get_yaml_docs",
    "Search and retrieve FlutterFlow YAML reference documentation. Use `topic` to search by keyword (e.g. 'Button', 'actions', 'theming') or `file` to fetch a specific doc file. Returns the full doc content.",
    {
      topic: z
        .string()
        .optional()
        .describe(
          "Search topic/keyword (e.g. 'Button', 'actions', 'theme', 'Column', 'variables'). Case-insensitive."
        ),
      file: z
        .string()
        .optional()
        .describe(
          "Specific doc file path (e.g. '04-widgets/button', '05-actions', 'README'). Omit .md extension."
        ),
    },
    async ({ topic, file }) => {
      // Direct file access
      if (file) {
        const content = readDoc(`${file}.md`);
        if (content) {
          return {
            content: [{ type: "text" as const, text: content }],
          };
        }
        const available = listDocFiles(DOCS_DIR)
          .map((f) => `  - ${f.replace(/\.md$/, "")}`)
          .join("\n");
        return {
          content: [
            {
              type: "text" as const,
              text: `Doc file not found: "${file}"\n\nAvailable files:\n${available}`,
            },
          ],
        };
      }

      // Topic search
      if (topic) {
        const key = topic.toLowerCase().replace(/[\s_-]+/g, "");
        const matchedFile = TOPIC_MAP[key];

        if (matchedFile) {
          const content = readDoc(matchedFile);
          if (content) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `# Matched: ${matchedFile}\n\n${content}`,
                },
              ],
            };
          }
        }

        // Fallback: scan filenames and file contents for the topic
        const allFiles = listDocFiles(DOCS_DIR);
        const matches: string[] = [];

        for (const f of allFiles) {
          // Check filename match
          if (f.toLowerCase().includes(topic.toLowerCase())) {
            matches.push(f);
            continue;
          }
          // Check content match (first-level scan)
          const content = readDoc(f);
          if (
            content &&
            content.toLowerCase().includes(topic.toLowerCase())
          ) {
            matches.push(f);
          }
        }

        if (matches.length === 0) {
          const available = allFiles
            .map((f) => `  - ${f.replace(/\.md$/, "")}`)
            .join("\n");
          return {
            content: [
              {
                type: "text" as const,
                text: `No docs found for topic "${topic}".\n\nAvailable docs:\n${available}`,
              },
            ],
          };
        }

        // Return the first match content, list others
        const primary = readDoc(matches[0]) || "";
        const others =
          matches.length > 1
            ? `\n\n---\n\nOther matching docs:\n${matches
                .slice(1)
                .map((f) => `  - ${f.replace(/\.md$/, "")}`)
                .join("\n")}`
            : "";

        return {
          content: [
            {
              type: "text" as const,
              text: `# Matched: ${matches[0]}\n\n${primary}${others}`,
            },
          ],
        };
      }

      // No params: return index
      const readme = readDoc("README.md");
      if (readme) {
        return {
          content: [{ type: "text" as const, text: readme }],
        };
      }

      const available = listDocFiles(DOCS_DIR)
        .map((f) => `  - ${f.replace(/\.md$/, "")}`)
        .join("\n");
      return {
        content: [
          {
            type: "text" as const,
            text: `FlutterFlow YAML Reference Docs:\n${available}\n\nUse the 'topic' or 'file' parameter to fetch specific docs.`,
          },
        ],
      };
    }
  );
}

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCS_DIR = path.resolve(__dirname, "../../docs/ff-yaml");

/** Recursively list all .md files under a directory, returning relative paths. */
function listDocFiles(dir: string, prefix = ""): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...listDocFiles(path.join(dir, entry.name), relPath));
    } else if (entry.name.endsWith(".md")) {
      results.push(relPath);
    }
  }
  return results;
}

export function registerDocsResources(server: McpServer) {
  // Static resource: list all available docs
  server.resource(
    "docs-index",
    "ff://docs",
    {
      description:
        "FlutterFlow YAML reference catalog — list all available documentation files",
      mimeType: "application/json",
    },
    async (uri) => {
      const files = listDocFiles(DOCS_DIR);
      const index = files.map((f) => ({
        file: f.replace(/\.md$/, ""),
        uri: `ff://docs/${f.replace(/\.md$/, "")}`,
      }));
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(index, null, 2),
            mimeType: "application/json",
          },
        ],
      };
    }
  );

  // Dynamic resource: get a specific doc file
  server.resource(
    "docs-file",
    new ResourceTemplate("ff://docs/{+path}", { list: undefined }),
    {
      description:
        "Read a specific FlutterFlow YAML reference doc (e.g. ff://docs/04-widgets/button)",
      mimeType: "text/markdown",
    },
    async (uri, { path: docPath }) => {
      const filePath = path.join(DOCS_DIR, `${docPath as string}.md`);
      if (!fs.existsSync(filePath)) {
        const available = listDocFiles(DOCS_DIR)
          .map((f) => f.replace(/\.md$/, ""))
          .join("\n  ");
        return {
          contents: [
            {
              uri: uri.href,
              text: `Doc not found: ${docPath}\n\nAvailable docs:\n  ${available}`,
              mimeType: "text/plain",
            },
          ],
        };
      }
      const content = fs.readFileSync(filePath, "utf-8");
      return {
        contents: [
          {
            uri: uri.href,
            text: content,
            mimeType: "text/markdown",
          },
        ],
      };
    }
  );
}

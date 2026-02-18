/**
 * get_yaml_docs tool — search and retrieve FlutterFlow YAML reference documentation.
 * No API calls: reads from bundled docs/ff-yaml/ directory.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCS_DIR = path.resolve(__dirname, "../../docs/ff-yaml");

/** Topic-to-file mapping for fuzzy search. */
const TOPIC_MAP: Record<string, string> = {
  // Widgets
  button: "04-widgets/button.md",
  iconbutton: "04-widgets/button.md",
  text: "04-widgets/text.md",
  richtext: "04-widgets/text.md",
  richtextspan: "04-widgets/text.md",
  textfield: "04-widgets/text-field.md",
  "text-field": "04-widgets/text-field.md",
  input: "04-widgets/text-field.md",
  container: "04-widgets/container.md",
  boxdecoration: "04-widgets/container.md",
  column: "04-widgets/layout.md",
  row: "04-widgets/layout.md",
  stack: "04-widgets/layout.md",
  wrap: "04-widgets/layout.md",
  layout: "04-widgets/layout.md",
  image: "04-widgets/image.md",
  form: "04-widgets/form.md",
  validation: "04-widgets/form.md",
  dropdown: "04-widgets/dropdown.md",
  choicechips: "04-widgets/dropdown.md",
  icon: "04-widgets/misc.md",
  progressbar: "04-widgets/misc.md",
  appbar: "04-widgets/misc.md",
  conditionalbuilder: "04-widgets/misc.md",
  widget: "04-widgets/README.md",
  widgets: "04-widgets/README.md",
  // Non-widget topics
  actions: "05-actions.md",
  action: "05-actions.md",
  trigger: "05-actions.md",
  navigate: "05-actions.md",
  navigation: "05-actions.md",
  ontap: "05-actions.md",
  variables: "06-variables.md",
  variable: "06-variables.md",
  binding: "06-variables.md",
  "data-binding": "06-variables.md",
  data: "07-data.md",
  collections: "07-data.md",
  firestore: "07-data.md",
  api: "07-data.md",
  custom: "08-custom-code.md",
  dart: "08-custom-code.md",
  "custom-code": "08-custom-code.md",
  theme: "09-theming.md",
  theming: "09-theming.md",
  color: "09-theming.md",
  colors: "09-theming.md",
  font: "09-theming.md",
  typography: "09-theming.md",
  editing: "10-editing-guide.md",
  workflow: "10-editing-guide.md",
  "editing-guide": "10-editing-guide.md",
  push: "10-editing-guide.md",
  overview: "00-overview.md",
  structure: "00-overview.md",
  "project-files": "01-project-files.md",
  config: "01-project-files.md",
  settings: "01-project-files.md",
  pages: "02-pages.md",
  page: "02-pages.md",
  scaffold: "02-pages.md",
  components: "03-components.md",
  component: "03-components.md",
  createcomponent: "03-components.md",
  refactor: "03-components.md",
  refactoring: "03-components.md",
  isdummyroot: "03-components.md",
  dummyroot: "03-components.md",
  componentclasskeyref: "03-components.md",
  parametervalues: "03-components.md",
  callback: "03-components.md",
  executecallbackaction: "03-components.md",
  // Universal patterns
  inputvalue: "README.md",
  mostrecentinputvalue: "README.md",
  padding: "README.md",
  "border-radius": "README.md",
};

/** List all doc files recursively. */
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

/** Read a doc file. Returns null if not found. */
function readDoc(relPath: string): string | null {
  const filePath = path.join(DOCS_DIR, relPath);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

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

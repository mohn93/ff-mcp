/**
 * Shared TOPIC_MAP, DOCS_DIR, and doc-reading helpers.
 * Used by get_yaml_docs and get_editing_guide tools.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DOCS_DIR = path.resolve(__dirname, "../../docs/ff-yaml");

/** Topic-to-file mapping for fuzzy search. */
export const TOPIC_MAP: Record<string, string> = {
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
  // Internationalization
  translation: "01-project-files.md",
  translations: "01-project-files.md",
  i18n: "01-project-files.md",
  localization: "01-project-files.md",
  translatabletext: "01-project-files.md",
  languages: "01-project-files.md",
  // Universal patterns
  inputvalue: "README.md",
  mostrecentinputvalue: "README.md",
  padding: "README.md",
  "border-radius": "README.md",
};

/** List all doc files recursively. */
export function listDocFiles(dir: string, prefix = ""): string[] {
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
export function readDoc(relPath: string): string | null {
  const filePath = path.join(DOCS_DIR, relPath);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

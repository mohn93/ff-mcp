/**
 * Parse the FlutterFlow `folders` YAML file to build a
 * scaffoldId → folderName mapping.
 *
 * The file has two sections:
 *   rootFolders:        (nested tree of { key, name, children })
 *   widgetClassKeyToFolderKey:   (flat Scaffold_XXX: folderKey)
 */
export function parseFolderMapping(
  foldersYaml: string
): Record<string, string> {
  // 1. Build folderKey → name from the rootFolders tree
  const keyToName: Record<string, string> = {};
  const keyNameRegex = /key:\s*(\w+)\s*\n\s*name:\s*(.+)/g;
  let match: RegExpExecArray | null;
  while ((match = keyNameRegex.exec(foldersYaml)) !== null) {
    keyToName[match[1]] = match[2].trim();
  }

  // 2. Build scaffoldId → folderName from widgetClassKeyToFolderKey
  const scaffoldToFolder: Record<string, string> = {};
  const widgetSection = foldersYaml.split(
    "widgetClassKeyToFolderKey:"
  )[1];
  if (widgetSection) {
    const mappingRegex = /\s+(Scaffold_\w+):\s*(\w+)/g;
    while ((match = mappingRegex.exec(widgetSection)) !== null) {
      const scaffoldId = match[1];
      const folderKey = match[2];
      scaffoldToFolder[scaffoldId] = keyToName[folderKey] || folderKey;
    }
  }

  return scaffoldToFolder;
}

import { describe, it, expect } from "vitest";
import { parseFolderMapping } from "./parse-folders.js";

describe("parseFolderMapping", () => {
  it("returns empty object for empty input", () => {
    expect(parseFolderMapping("")).toEqual({});
  });

  it("returns empty object when there is no widgetClassKeyToFolderKey section", () => {
    const yaml = `
rootFolders:
  - key: folderA
    name: Authentication
`;
    expect(parseFolderMapping(yaml)).toEqual({});
  });

  it("returns empty object when widgetClassKeyToFolderKey section is empty", () => {
    const yaml = `
rootFolders:
  - key: folderA
    name: Authentication
widgetClassKeyToFolderKey:
`;
    expect(parseFolderMapping(yaml)).toEqual({});
  });

  it("maps a single scaffold to its folder name", () => {
    const yaml = `
rootFolders:
  - key: folderA
    name: Authentication
widgetClassKeyToFolderKey:
  Scaffold_abc123: folderA
`;
    expect(parseFolderMapping(yaml)).toEqual({
      Scaffold_abc123: "Authentication",
    });
  });

  it("maps multiple scaffolds to their folder names", () => {
    const yaml = `
rootFolders:
  - key: folderA
    name: Authentication
  - key: folderB
    name: Dashboard
  - key: folderC
    name: Settings
widgetClassKeyToFolderKey:
  Scaffold_login: folderA
  Scaffold_signup: folderA
  Scaffold_home: folderB
  Scaffold_prefs: folderC
`;
    const result = parseFolderMapping(yaml);
    expect(result).toEqual({
      Scaffold_login: "Authentication",
      Scaffold_signup: "Authentication",
      Scaffold_home: "Dashboard",
      Scaffold_prefs: "Settings",
    });
  });

  it("handles nested children folders", () => {
    // The regex matches key/name pairs wherever they appear,
    // including inside nested children arrays
    const yaml = `
rootFolders:
  - key: folderParent
    name: Main
    children:
      - key: folderChild
        name: SubSection
widgetClassKeyToFolderKey:
  Scaffold_page1: folderParent
  Scaffold_page2: folderChild
`;
    const result = parseFolderMapping(yaml);
    expect(result).toEqual({
      Scaffold_page1: "Main",
      Scaffold_page2: "SubSection",
    });
  });

  it("falls back to folderKey when key is not found in rootFolders", () => {
    const yaml = `
rootFolders:
  - key: folderA
    name: Known
widgetClassKeyToFolderKey:
  Scaffold_known: folderA
  Scaffold_unknown: folderMissing
`;
    const result = parseFolderMapping(yaml);
    expect(result).toEqual({
      Scaffold_known: "Known",
      Scaffold_unknown: "folderMissing",
    });
  });

  it("trims whitespace from folder names", () => {
    const yaml = `
rootFolders:
  - key: folderA
    name:   Spaces Around
widgetClassKeyToFolderKey:
  Scaffold_x: folderA
`;
    const result = parseFolderMapping(yaml);
    expect(result).toEqual({
      Scaffold_x: "Spaces Around",
    });
  });

  it("only picks up Scaffold_ prefixed keys in widgetClassKeyToFolderKey", () => {
    const yaml = `
rootFolders:
  - key: folderA
    name: Auth
widgetClassKeyToFolderKey:
  Scaffold_login: folderA
  Container_xyz: folderA
`;
    const result = parseFolderMapping(yaml);
    // Container_xyz should not be matched because regex requires Scaffold_ prefix
    expect(result).toEqual({
      Scaffold_login: "Auth",
    });
  });

  it("handles deeply nested children (3 levels)", () => {
    const yaml = `
rootFolders:
  - key: level1
    name: Level1
    children:
      - key: level2
        name: Level2
        children:
          - key: level3
            name: Level3
widgetClassKeyToFolderKey:
  Scaffold_deep: level3
`;
    const result = parseFolderMapping(yaml);
    expect(result).toEqual({
      Scaffold_deep: "Level3",
    });
  });
});

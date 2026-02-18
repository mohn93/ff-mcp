import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock all dependencies BEFORE imports
vi.mock("../utils/cache.js", () => ({
  cacheRead: vi.fn(),
  cacheWrite: vi.fn(),
  cacheWriteBulk: vi.fn(),
  cacheMeta: vi.fn(),
  cacheWriteMeta: vi.fn(),
  cacheInvalidate: vi.fn(),
  listCachedKeys: vi.fn(),
  cacheDir: vi.fn(),
}));

vi.mock("../utils/parse-folders.js", () => ({
  parseFolderMapping: vi.fn(),
}));

vi.mock("../utils/page-summary/tree-walker.js", () => ({
  parseTreeOutline: vi.fn(),
}));

vi.mock("../utils/page-summary/node-extractor.js", () => ({
  extractNodeInfo: vi.fn(),
}));

vi.mock("../utils/page-summary/action-summarizer.js", () => ({
  summarizeTriggers: vi.fn(),
}));

vi.mock("../utils/page-summary/formatter.js", () => ({
  formatPageSummary: vi.fn(),
  formatComponentSummary: vi.fn(),
}));

import { createMockServer } from "../__helpers__/mock-server.js";
import { registerGetPageSummaryTool, resolvePage } from "./get-page-summary.js";
import { cacheRead, cacheMeta, listCachedKeys } from "../utils/cache.js";
import { parseFolderMapping } from "../utils/parse-folders.js";
import { parseTreeOutline } from "../utils/page-summary/tree-walker.js";
import { extractNodeInfo } from "../utils/page-summary/node-extractor.js";
import { summarizeTriggers } from "../utils/page-summary/action-summarizer.js";
import { formatPageSummary } from "../utils/page-summary/formatter.js";

const mockedCacheRead = vi.mocked(cacheRead);
const mockedCacheMeta = vi.mocked(cacheMeta);
const mockedListCachedKeys = vi.mocked(listCachedKeys);
const mockedParseFolders = vi.mocked(parseFolderMapping);
const mockedParseTreeOutline = vi.mocked(parseTreeOutline);
const mockedExtractNodeInfo = vi.mocked(extractNodeInfo);
const mockedSummarizeTriggers = vi.mocked(summarizeTriggers);
const mockedFormatPageSummary = vi.mocked(formatPageSummary);

// ---------------------------------------------------------------------------
// resolvePage
// ---------------------------------------------------------------------------
describe("resolvePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves by scaffoldId when cache has the file", async () => {
    mockedCacheRead.mockResolvedValue("name: TestPage");

    const result = await resolvePage("proj-1", undefined, "Scaffold_abc");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.page.scaffoldId).toBe("Scaffold_abc");
      expect(result.page.pageFileKey).toBe("page/id-Scaffold_abc");
    }
  });

  it("resolves by pageName (case-insensitive)", async () => {
    // scaffoldId lookup fails
    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "page/id-Scaffold_abc") return "name: Welcome";
      if (key === "page/id-Scaffold_xyz") return "name: Settings";
      return null;
    });

    mockedListCachedKeys.mockResolvedValue([
      "page/id-Scaffold_abc",
      "page/id-Scaffold_xyz",
    ]);

    const result = await resolvePage("proj-1", "settings");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.page.scaffoldId).toBe("Scaffold_xyz");
    }
  });

  it("returns available names when no match found", async () => {
    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "page/id-Scaffold_abc") return "name: Welcome";
      return null;
    });
    mockedListCachedKeys.mockResolvedValue(["page/id-Scaffold_abc"]);

    const result = await resolvePage("proj-1", "NonExistent");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.available).toContain("Welcome");
    }
  });

  it("filters out sub-files from page key list", async () => {
    mockedCacheRead.mockImplementation(async () => null);
    mockedListCachedKeys.mockResolvedValue([
      "page/id-Scaffold_abc",
      "page/id-Scaffold_abc/page-widget-tree-outline",
      "page/id-Scaffold_abc/page-widget-tree-outline/node/id-Widget_123",
    ]);

    const result = await resolvePage("proj-1", "Missing");

    expect(result.ok).toBe(false);
    // Only top-level page keys should be checked
  });
});

// ---------------------------------------------------------------------------
// get_page_summary handler
// ---------------------------------------------------------------------------
describe("get_page_summary handler", () => {
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockServer();
    registerGetPageSummaryTool(mock.server as any);
    getHandler = mock.getHandler;
  });

  it("registers with the correct tool name", () => {
    expect(() => getHandler("get_page_summary")).not.toThrow();
  });

  it("returns error when cache is not synced", async () => {
    mockedCacheMeta.mockResolvedValue(null);

    const handler = getHandler("get_page_summary");
    const result = await handler({ projectId: "proj-no-cache", pageName: "Home" });

    expect(result.content[0].text).toContain("No cache found");
    expect(result.content[0].text).toContain("sync_project");
  });

  it("returns error when neither pageName nor scaffoldId provided", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    const handler = getHandler("get_page_summary");
    const result = await handler({ projectId: "proj-1" });

    expect(result.content[0].text).toContain("Provide either pageName or scaffoldId");
  });

  it("returns error when page is not found in cache", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });
    mockedCacheRead.mockResolvedValue(null);
    mockedListCachedKeys.mockResolvedValue([]);

    const handler = getHandler("get_page_summary");
    const result = await handler({ projectId: "proj-1", pageName: "Missing" });

    expect(result.content[0].text).toContain("not found in cache");
  });

  it("returns formatted summary on success", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    // resolvePage will find the page via scaffoldId
    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "page/id-Scaffold_abc") return "name: HomePage\nroute: /home";
      if (key === "folders") return "folder-yaml";
      if (key === "page/id-Scaffold_abc/page-widget-tree-outline") return "outline-content";
      return null;
    });

    mockedListCachedKeys.mockResolvedValue(["page/id-Scaffold_abc"]);
    mockedParseFolders.mockReturnValue({ Scaffold_abc: "Main" });

    // Tree parsing: return a simple outline with no children
    mockedParseTreeOutline.mockReturnValue({
      key: "Scaffold_abc",
      children: [],
      slot: undefined,
    });

    mockedExtractNodeInfo.mockResolvedValue({
      type: "Scaffold",
      name: "HomePage",
      detail: "",
    });

    mockedSummarizeTriggers.mockResolvedValue([]);

    mockedFormatPageSummary.mockReturnValue("## HomePage\nWidget tree summary here");

    const handler = getHandler("get_page_summary");
    const result = await handler({ projectId: "proj-1", scaffoldId: "Scaffold_abc" });

    expect(result.content[0].text).toBe("## HomePage\nWidget tree summary here");
    expect(mockedFormatPageSummary).toHaveBeenCalled();
  });

  it("passes componentRef and componentId from extractNodeInfo to the SummaryNode", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "page/id-Scaffold_abc") return "name: TestPage";
      if (key === "folders") return "";
      if (key === "page/id-Scaffold_abc/page-widget-tree-outline") return "outline";
      return null;
    });

    mockedListCachedKeys.mockResolvedValue(["page/id-Scaffold_abc"]);
    mockedParseFolders.mockReturnValue({});

    // Tree has root scaffold with one child container (component ref)
    mockedParseTreeOutline.mockReturnValue({
      key: "Scaffold_abc",
      children: [
        { key: "Container_host", children: [], slot: "body" },
      ],
      slot: undefined,
    });

    // Root scaffold node - no component ref
    mockedExtractNodeInfo.mockImplementation(async (_pid, _prefix, nodeKey) => {
      if (nodeKey === "Scaffold_abc") {
        return { type: "Scaffold", name: "", detail: "" };
      }
      // Child container is a component reference
      return {
        type: "Container",
        name: "",
        detail: "",
        componentRef: "Header",
        componentId: "Container_ur4ml9qw",
      };
    });

    mockedSummarizeTriggers.mockResolvedValue([]);
    mockedFormatPageSummary.mockReturnValue("formatted");

    const handler = getHandler("get_page_summary");
    await handler({ projectId: "proj-1", scaffoldId: "Scaffold_abc" });

    // Verify the SummaryNode passed to formatter has componentRef/componentId
    const summaryTree = mockedFormatPageSummary.mock.calls[0][1];
    const childNode = summaryTree.children[0];
    expect(childNode.componentRef).toBe("Header");
    expect(childNode.componentId).toBe("Container_ur4ml9qw");
  });

  it("returns error when widget tree outline is not cached", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "page/id-Scaffold_abc") return "name: TestPage";
      if (key === "folders") return "";
      // tree outline not cached
      return null;
    });

    mockedParseFolders.mockReturnValue({});

    const handler = getHandler("get_page_summary");
    const result = await handler({ projectId: "proj-1", scaffoldId: "Scaffold_abc" });

    expect(result.content[0].text).toContain("widget tree outline is not cached");
  });
});

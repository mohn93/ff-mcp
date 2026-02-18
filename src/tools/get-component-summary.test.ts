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
import { registerGetComponentSummaryTool, resolveComponent } from "./get-component-summary.js";
import { cacheRead, cacheMeta, listCachedKeys } from "../utils/cache.js";
import { parseTreeOutline } from "../utils/page-summary/tree-walker.js";
import { extractNodeInfo } from "../utils/page-summary/node-extractor.js";
import { summarizeTriggers } from "../utils/page-summary/action-summarizer.js";
import { formatComponentSummary } from "../utils/page-summary/formatter.js";

const mockedCacheRead = vi.mocked(cacheRead);
const mockedCacheMeta = vi.mocked(cacheMeta);
const mockedListCachedKeys = vi.mocked(listCachedKeys);
const mockedParseTreeOutline = vi.mocked(parseTreeOutline);
const mockedExtractNodeInfo = vi.mocked(extractNodeInfo);
const mockedSummarizeTriggers = vi.mocked(summarizeTriggers);
const mockedFormatComponentSummary = vi.mocked(formatComponentSummary);

// ---------------------------------------------------------------------------
// resolveComponent
// ---------------------------------------------------------------------------
describe("resolveComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves by componentId when cache has the file", async () => {
    mockedCacheRead.mockResolvedValue("name: MyWidget");

    const result = await resolveComponent("proj-1", undefined, "Container_abc");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.component.containerId).toBe("Container_abc");
      expect(result.component.componentFileKey).toBe("component/id-Container_abc");
    }
  });

  it("resolves by componentName (case-insensitive)", async () => {
    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "component/id-Container_abc") return "name: PremiumWall";
      if (key === "component/id-Container_xyz") return "name: NavBar";
      return null;
    });

    mockedListCachedKeys.mockResolvedValue([
      "component/id-Container_abc",
      "component/id-Container_xyz",
    ]);

    const result = await resolveComponent("proj-1", "navbar");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.component.containerId).toBe("Container_xyz");
    }
  });

  it("returns available names when no match found", async () => {
    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "component/id-Container_abc") return "name: PremiumWall";
      return null;
    });
    mockedListCachedKeys.mockResolvedValue(["component/id-Container_abc"]);

    const result = await resolveComponent("proj-1", "NonExistent");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.available).toContain("PremiumWall");
    }
  });
});

// ---------------------------------------------------------------------------
// get_component_summary handler
// ---------------------------------------------------------------------------
describe("get_component_summary handler", () => {
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockServer();
    registerGetComponentSummaryTool(mock.server as any);
    getHandler = mock.getHandler;
  });

  it("registers with the correct tool name", () => {
    expect(() => getHandler("get_component_summary")).not.toThrow();
  });

  it("returns error when cache is not synced", async () => {
    mockedCacheMeta.mockResolvedValue(null);

    const handler = getHandler("get_component_summary");
    const result = await handler({ projectId: "proj-1", componentName: "MyWidget" });

    expect(result.content[0].text).toContain("No cache found");
    expect(result.content[0].text).toContain("sync_project");
  });

  it("returns error when neither componentName nor componentId provided", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    const handler = getHandler("get_component_summary");
    const result = await handler({ projectId: "proj-1" });

    expect(result.content[0].text).toContain("Provide either componentName or componentId");
  });

  it("returns error when component is not found", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });
    mockedCacheRead.mockResolvedValue(null);
    mockedListCachedKeys.mockResolvedValue([]);

    const handler = getHandler("get_component_summary");
    const result = await handler({ projectId: "proj-1", componentName: "Ghost" });

    expect(result.content[0].text).toContain("not found in cache");
  });

  it("returns formatted summary on success", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "component/id-Container_abc") return "name: NavBar\ndescription: Top nav";
      if (key === "component/id-Container_abc/component-widget-tree-outline")
        return "outline-content";
      return null;
    });

    mockedListCachedKeys.mockResolvedValue(["component/id-Container_abc"]);

    mockedParseTreeOutline.mockReturnValue({
      key: "Container_abc",
      children: [],
      slot: undefined,
    });

    mockedExtractNodeInfo.mockResolvedValue({
      type: "Container",
      name: "NavBar",
      detail: "",
    });

    mockedSummarizeTriggers.mockResolvedValue([]);
    mockedFormatComponentSummary.mockReturnValue("## NavBar\nComponent tree here");

    const handler = getHandler("get_component_summary");
    const result = await handler({
      projectId: "proj-1",
      componentId: "Container_abc",
    });

    expect(result.content[0].text).toBe("## NavBar\nComponent tree here");
    expect(mockedFormatComponentSummary).toHaveBeenCalled();
  });

  it("returns error when widget tree outline is not cached", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "component/id-Container_abc") return "name: MyComp";
      return null;
    });

    const handler = getHandler("get_component_summary");
    const result = await handler({
      projectId: "proj-1",
      componentId: "Container_abc",
    });

    expect(result.content[0].text).toContain("widget tree outline is not cached");
  });
});

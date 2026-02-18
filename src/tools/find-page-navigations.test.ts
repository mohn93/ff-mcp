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

// Mock the resolvePage import from get-page-summary
vi.mock("./get-page-summary.js", () => ({
  resolvePage: vi.fn(),
}));

import { createMockServer } from "../__helpers__/mock-server.js";
import {
  registerFindPageNavigationsTool,
  parseActionContext,
  findNavigateAction,
} from "./find-page-navigations.js";
import { cacheRead, cacheMeta, listCachedKeys } from "../utils/cache.js";
import { resolvePage } from "./get-page-summary.js";

const mockedCacheRead = vi.mocked(cacheRead);
const mockedCacheMeta = vi.mocked(cacheMeta);
const mockedListCachedKeys = vi.mocked(listCachedKeys);
const mockedResolvePage = vi.mocked(resolvePage);

// ---------------------------------------------------------------------------
// parseActionContext
// ---------------------------------------------------------------------------
describe("parseActionContext", () => {
  it("parses page action context", () => {
    const result = parseActionContext(
      "page/id-Scaffold_abc/page-widget-tree-outline/node/id-Widget_123/trigger_actions/id-ON_TAP/action/id-act1"
    );
    expect(result).toEqual({
      parentType: "page",
      parentId: "Scaffold_abc",
      widgetKey: "Widget_123",
      trigger: "ON_TAP",
    });
  });

  it("parses component action context", () => {
    const result = parseActionContext(
      "component/id-Container_xyz/component-widget-tree-outline/node/id-Button_456/trigger_actions/id-ON_LONG_PRESS/action/id-act2"
    );
    expect(result).toEqual({
      parentType: "component",
      parentId: "Container_xyz",
      widgetKey: "Button_456",
      trigger: "ON_LONG_PRESS",
    });
  });

  it("returns null for non-action file keys", () => {
    expect(parseActionContext("app-details")).toBeNull();
    expect(parseActionContext("page/id-Scaffold_abc")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// findNavigateAction
// ---------------------------------------------------------------------------
describe("findNavigateAction", () => {
  it("finds a navigate action targeting the scaffold", () => {
    const action = {
      navigate: {
        pageNodeKeyRef: { key: "Scaffold_target" },
        allowBack: true,
        passedParameters: {
          widgetClassNodeKeyRef: { key: "ignored" },
          userId: { value: "123" },
          screen: { value: "home" },
        },
      },
    };

    const result = findNavigateAction(action, "Scaffold_target", false, 0);
    expect(result).not.toBeNull();
    expect(result!.disabled).toBe(false);
    expect(result!.allowBack).toBe(true);
    expect(result!.passedParams).toContain("userId");
    expect(result!.passedParams).toContain("screen");
    // widgetClassNodeKeyRef should be filtered out
    expect(result!.passedParams).not.toContain("widgetClassNodeKeyRef");
  });

  it("returns null when navigate targets a different scaffold", () => {
    const action = {
      navigate: {
        pageNodeKeyRef: { key: "Scaffold_other" },
      },
    };

    const result = findNavigateAction(action, "Scaffold_target", false, 0);
    expect(result).toBeNull();
  });

  it("detects disabled navigate actions inside disableAction wrapper", () => {
    const action = {
      disableAction: {
        navigate: {
          pageNodeKeyRef: { key: "Scaffold_target" },
          allowBack: false,
        },
      },
    };

    const result = findNavigateAction(action, "Scaffold_target", false, 0);
    expect(result).not.toBeNull();
    expect(result!.disabled).toBe(true);
    expect(result!.allowBack).toBe(false);
  });

  it("recursively searches nested objects", () => {
    const action = {
      someWrapper: {
        innerWrapper: {
          navigate: {
            pageNodeKeyRef: { key: "Scaffold_deep" },
          },
        },
      },
    };

    const result = findNavigateAction(action, "Scaffold_deep", false, 0);
    expect(result).not.toBeNull();
  });

  it("returns null when depth exceeds 12", () => {
    const action = {
      navigate: {
        pageNodeKeyRef: { key: "Scaffold_target" },
      },
    };

    const result = findNavigateAction(action, "Scaffold_target", false, 13);
    expect(result).toBeNull();
  });

  it("returns null for non-objects", () => {
    expect(findNavigateAction(null, "X", false, 0)).toBeNull();
    expect(findNavigateAction("string", "X", false, 0)).toBeNull();
    expect(findNavigateAction(42, "X", false, 0)).toBeNull();
  });

  it("defaults allowBack to true when not specified", () => {
    const action = {
      navigate: {
        pageNodeKeyRef: { key: "Scaffold_target" },
        // no allowBack field
      },
    };

    const result = findNavigateAction(action, "Scaffold_target", false, 0);
    expect(result).not.toBeNull();
    expect(result!.allowBack).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// find_page_navigations handler
// ---------------------------------------------------------------------------
describe("find_page_navigations handler", () => {
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockServer();
    registerFindPageNavigationsTool(mock.server as any);
    getHandler = mock.getHandler;
  });

  it("registers with the correct tool name", () => {
    expect(() => getHandler("find_page_navigations")).not.toThrow();
  });

  it("returns error when cache is not synced", async () => {
    mockedCacheMeta.mockResolvedValue(null);

    const handler = getHandler("find_page_navigations");
    const result = await handler({ projectId: "proj-1", pageName: "Home" });

    expect(result.content[0].text).toContain("No cache found");
  });

  it("returns error when neither pageName nor scaffoldId provided", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    const handler = getHandler("find_page_navigations");
    const result = await handler({ projectId: "proj-1" });

    expect(result.content[0].text).toContain("Provide either pageName or scaffoldId");
  });

  it("finds navigation actions targeting the page", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedResolvePage.mockResolvedValue({
      ok: true,
      page: { scaffoldId: "Scaffold_target", pageFileKey: "page/id-Scaffold_target" },
    });

    const actionKey =
      "page/id-Scaffold_source/page-widget-tree-outline/node/id-Button_1/trigger_actions/id-ON_TAP/action/id-nav1";

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "page/id-Scaffold_target") return "name: TargetPage";
      if (key === "page/id-Scaffold_source") return "name: SourcePage";
      if (key === actionKey) {
        return `navigate:\n  pageNodeKeyRef:\n    key: Scaffold_target\n  allowBack: true`;
      }
      return null;
    });

    mockedListCachedKeys.mockResolvedValue([
      "page/id-Scaffold_target",
      "page/id-Scaffold_source",
      actionKey,
    ]);

    const handler = getHandler("find_page_navigations");
    const result = await handler({
      projectId: "proj-1",
      scaffoldId: "Scaffold_target",
    });

    expect(result.content[0].text).toContain("TargetPage");
    expect(result.content[0].text).toContain("Found 1 navigation");
    expect(result.content[0].text).toContain("SourcePage");
    expect(result.content[0].text).toContain("ON_TAP");
  });

  it("returns no navigations message when none found", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedResolvePage.mockResolvedValue({
      ok: true,
      page: { scaffoldId: "Scaffold_lonely", pageFileKey: "page/id-Scaffold_lonely" },
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "page/id-Scaffold_lonely") return "name: LonelyPage";
      return null;
    });

    mockedListCachedKeys.mockResolvedValue([]);

    const handler = getHandler("find_page_navigations");
    const result = await handler({
      projectId: "proj-1",
      pageName: "LonelyPage",
    });

    expect(result.content[0].text).toContain("No navigations found");
  });

  it("returns page not found when resolvePage fails", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedResolvePage.mockResolvedValue({
      ok: false,
      available: ["PageA", "PageB"],
    });

    const handler = getHandler("find_page_navigations");
    const result = await handler({
      projectId: "proj-1",
      pageName: "Missing",
    });

    expect(result.content[0].text).toContain("not found in cache");
    expect(result.content[0].text).toContain("PageA");
    expect(result.content[0].text).toContain("PageB");
  });
});

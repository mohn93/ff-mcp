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

// Mock the resolveComponent import from get-component-summary
vi.mock("./get-component-summary.js", () => ({
  resolveComponent: vi.fn(),
}));

import { createMockServer } from "../__helpers__/mock-server.js";
import {
  registerFindComponentUsagesTool,
  parseParentFromKey,
  resolveParamValue,
} from "./find-component-usages.js";
import { cacheRead, cacheMeta, listCachedKeys } from "../utils/cache.js";
import { resolveComponent } from "./get-component-summary.js";

const mockedCacheRead = vi.mocked(cacheRead);
const mockedCacheMeta = vi.mocked(cacheMeta);
const mockedListCachedKeys = vi.mocked(listCachedKeys);
const mockedResolveComponent = vi.mocked(resolveComponent);

// ---------------------------------------------------------------------------
// parseParentFromKey
// ---------------------------------------------------------------------------
describe("parseParentFromKey", () => {
  it("extracts page parent from file key", () => {
    const result = parseParentFromKey(
      "page/id-Scaffold_abc/page-widget-tree-outline/node/id-Widget_123"
    );
    expect(result).toEqual({ type: "page", id: "Scaffold_abc" });
  });

  it("extracts component parent from file key", () => {
    const result = parseParentFromKey(
      "component/id-Container_xyz/component-widget-tree-outline/node/id-Widget_456"
    );
    expect(result).toEqual({ type: "component", id: "Container_xyz" });
  });

  it("returns null for unrecognized file key", () => {
    expect(parseParentFromKey("app-details")).toBeNull();
    expect(parseParentFromKey("folders")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// resolveParamValue
// ---------------------------------------------------------------------------
describe("resolveParamValue", () => {
  it("resolves i18n variable with serialized value", () => {
    const param = {
      variable: {
        source: "INTERNATIONALIZATION",
        functionCall: {
          values: [
            {
              inputValue: { serializedValue: "Hello World" },
            },
          ],
        },
      },
    };
    expect(resolveParamValue(param)).toBe('"Hello World" (i18n)');
  });

  it("returns [i18n] when no serialized value", () => {
    const param = {
      variable: {
        source: "INTERNATIONALIZATION",
        functionCall: { values: [] },
      },
    };
    expect(resolveParamValue(param)).toBe("[i18n]");
  });

  it("returns source name for other variable sources", () => {
    const param = { variable: { source: "PAGE_STATE" } };
    expect(resolveParamValue(param)).toBe("[PAGE_STATE]");
  });

  it("returns [dynamic] for variable with no source", () => {
    const param = { variable: {} };
    expect(resolveParamValue(param)).toBe("[dynamic]");
  });

  it("resolves string inputValue", () => {
    const param = { inputValue: "hello" };
    expect(resolveParamValue(param)).toBe('"hello"');
  });

  it("resolves number inputValue", () => {
    const param = { inputValue: 42 };
    expect(resolveParamValue(param)).toBe('"42"');
  });

  it("resolves serializedValue from inputValue object", () => {
    const param = { inputValue: { serializedValue: "some-value" } };
    expect(resolveParamValue(param)).toBe('"some-value"');
  });

  it("resolves themeColor from inputValue object", () => {
    const param = { inputValue: { themeColor: "primaryText" } };
    expect(resolveParamValue(param)).toBe("[theme:primaryText]");
  });

  it("returns [dynamic] when no recognizable pattern", () => {
    expect(resolveParamValue({})).toBe("[dynamic]");
  });
});

// ---------------------------------------------------------------------------
// find_component_usages handler
// ---------------------------------------------------------------------------
describe("find_component_usages handler", () => {
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockServer();
    registerFindComponentUsagesTool(mock.server as any);
    getHandler = mock.getHandler;
  });

  it("registers with the correct tool name", () => {
    expect(() => getHandler("find_component_usages")).not.toThrow();
  });

  it("returns error when cache is not synced", async () => {
    mockedCacheMeta.mockResolvedValue(null);

    const handler = getHandler("find_component_usages");
    const result = await handler({ projectId: "proj-1", componentName: "MyComp" });

    expect(result.content[0].text).toContain("No cache found");
  });

  it("returns error when neither componentName nor componentId provided", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    const handler = getHandler("find_component_usages");
    const result = await handler({ projectId: "proj-1" });

    expect(result.content[0].text).toContain("Provide either componentName or componentId");
  });

  it("finds component usages in node files", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedResolveComponent.mockResolvedValue({
      ok: true,
      component: {
        containerId: "Container_target",
        componentFileKey: "component/id-Container_target",
      },
    });

    // Component display name
    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "component/id-Container_target") return "name: MyWidget";
      if (key === "page/id-Scaffold_abc") return "name: HomePage";
      // The node file that references the component
      if (
        key ===
        "page/id-Scaffold_abc/page-widget-tree-outline/node/id-Widget_ref"
      ) {
        return `componentClassKeyRef:\n  key: Container_target\nparameterValues:\n  param1:\n    paramIdentifier: title\n    inputValue: "Hello"`;
      }
      return null;
    });

    mockedListCachedKeys.mockResolvedValue([
      "page/id-Scaffold_abc",
      "page/id-Scaffold_abc/page-widget-tree-outline/node/id-Widget_ref",
    ]);

    const handler = getHandler("find_component_usages");
    const result = await handler({
      projectId: "proj-1",
      componentName: "MyWidget",
    });

    expect(result.content[0].text).toContain("MyWidget");
    expect(result.content[0].text).toContain("Found 1 usage");
    expect(result.content[0].text).toContain("HomePage");
  });

  it("returns no usages message when none found", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedResolveComponent.mockResolvedValue({
      ok: true,
      component: {
        containerId: "Container_lonely",
        componentFileKey: "component/id-Container_lonely",
      },
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "component/id-Container_lonely") return "name: LonelyWidget";
      return null;
    });

    mockedListCachedKeys.mockResolvedValue([]);

    const handler = getHandler("find_component_usages");
    const result = await handler({
      projectId: "proj-1",
      componentId: "Container_lonely",
    });

    expect(result.content[0].text).toContain("No usages found");
  });
});

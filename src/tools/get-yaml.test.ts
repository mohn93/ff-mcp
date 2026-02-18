import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock cache BEFORE importing the tool
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

import { createMockServer } from "../__helpers__/mock-server.js";
import { registerGetYamlTool } from "./get-yaml.js";
import { cacheRead, listCachedKeys } from "../utils/cache.js";

const mockedCacheRead = vi.mocked(cacheRead);
const mockedListCachedKeys = vi.mocked(listCachedKeys);

describe("get_project_yaml tool", () => {
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockServer();
    registerGetYamlTool(mock.server as any);
    getHandler = mock.getHandler;
  });

  it("registers with the correct tool name", () => {
    expect(() => getHandler("get_project_yaml")).not.toThrow();
  });

  it("returns cached content with header when fileName is provided", async () => {
    mockedCacheRead.mockResolvedValue("name: TestPage\nroute: /test");

    const handler = getHandler("get_project_yaml");
    const result = await handler({
      projectId: "proj-123",
      fileName: "page/id-Scaffold_abc",
    });

    expect(mockedCacheRead).toHaveBeenCalledWith("proj-123", "page/id-Scaffold_abc");
    expect(result.content[0].text).toBe(
      "# page/id-Scaffold_abc\nname: TestPage\nroute: /test"
    );
  });

  it("returns error when fileName is not in cache", async () => {
    mockedCacheRead.mockResolvedValue(null);

    const handler = getHandler("get_project_yaml");
    const result = await handler({
      projectId: "proj-123",
      fileName: "missing-file",
    });

    expect(result.content[0].text).toContain("not found in local cache");
    expect(result.content[0].text).toContain("proj-123");
    expect(result.content[0].text).toContain("sync_project");
  });

  it("lists all cached keys when no fileName is provided", async () => {
    mockedListCachedKeys.mockResolvedValue([
      "app-details",
      "page/id-Scaffold_abc",
      "folders",
    ]);

    const handler = getHandler("get_project_yaml");
    const result = await handler({ projectId: "proj-123" });

    expect(mockedListCachedKeys).toHaveBeenCalledWith("proj-123");
    expect(result.content[0].text).toContain("Cached files (3)");
    expect(result.content[0].text).toContain("app-details");
    expect(result.content[0].text).toContain("page/id-Scaffold_abc");
    expect(result.content[0].text).toContain("folders");
  });

  it("returns error when no cached files and no fileName", async () => {
    mockedListCachedKeys.mockResolvedValue([]);

    const handler = getHandler("get_project_yaml");
    const result = await handler({ projectId: "proj-empty" });

    expect(result.content[0].text).toContain("No cached files found");
    expect(result.content[0].text).toContain("proj-empty");
    expect(result.content[0].text).toContain("sync_project");
  });
});

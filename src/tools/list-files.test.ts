import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock cache BEFORE importing the tool
vi.mock("../utils/cache.js", () => ({
  cacheRead: vi.fn(),
  cacheWrite: vi.fn(),
  cacheWriteBulk: vi.fn(),
  cacheMeta: vi.fn(),
  cacheAgeFooter: vi.fn(() => ""),
  cacheWriteMeta: vi.fn(),
  cacheInvalidate: vi.fn(),
  listCachedKeys: vi.fn(),
  cacheDir: vi.fn(),
}));

import { createMockServer } from "../__helpers__/mock-server.js";
import { createMockClient, asClient } from "../__helpers__/mock-client.js";
import { registerListFilesTool } from "./list-files.js";
import { cacheMeta, listCachedKeys } from "../utils/cache.js";

const mockedCacheMeta = vi.mocked(cacheMeta);
const mockedListCachedKeys = vi.mocked(listCachedKeys);

describe("list_project_files tool", () => {
  let mockClient: ReturnType<typeof createMockClient>;
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
    const mock = createMockServer();
    registerListFilesTool(mock.server as any, asClient(mockClient));
    getHandler = mock.getHandler;
  });

  it("registers with the correct tool name", () => {
    expect(() => getHandler("list_project_files")).not.toThrow();
  });

  it("returns cached keys when project is synced", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01T00:00:00Z",
      fileCount: 3,
      syncMethod: "bulk",
    });
    mockedListCachedKeys.mockResolvedValue([
      "app-details",
      "page/id-Scaffold_abc",
      "folders",
    ]);

    const handler = getHandler("list_project_files");
    const result = await handler({ projectId: "proj-cached" });

    expect(mockedCacheMeta).toHaveBeenCalledWith("proj-cached");
    expect(mockedListCachedKeys).toHaveBeenCalledWith("proj-cached");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.source).toBe("cache");
    expect(parsed.syncedAt).toBe("2025-01-01T00:00:00Z");
    expect(parsed.value.file_names).toEqual([
      "app-details",
      "page/id-Scaffold_abc",
      "folders",
    ]);
    // Should not call client API when cache exists
    expect(mockClient.listPartitionedFileNames).not.toHaveBeenCalled();
  });

  it("falls back to API when cache is not available", async () => {
    mockedCacheMeta.mockResolvedValue(null);
    const apiResult = {
      value: { file_names: ["app-details", "page/id-Scaffold_xyz"] },
    };
    mockClient.listPartitionedFileNames.mockResolvedValue(apiResult);

    const handler = getHandler("list_project_files");
    const result = await handler({ projectId: "proj-no-cache" });

    expect(mockClient.listPartitionedFileNames).toHaveBeenCalledWith("proj-no-cache");
    expect(JSON.parse(result.content[0].text)).toEqual(apiResult);
  });

  it("does not call listCachedKeys when cacheMeta returns null", async () => {
    mockedCacheMeta.mockResolvedValue(null);
    mockClient.listPartitionedFileNames.mockResolvedValue({ value: { file_names: [] } });

    const handler = getHandler("list_project_files");
    await handler({ projectId: "proj-no-cache" });

    expect(mockedListCachedKeys).not.toHaveBeenCalled();
  });

  it("filters by prefix when cache exists and prefix is provided", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01T00:00:00Z",
      fileCount: 5,
      syncMethod: "bulk",
    });
    mockedListCachedKeys.mockResolvedValue([
      "page/id-Scaffold_abc",
      "page/id-Scaffold_def",
    ]);

    const handler = getHandler("list_project_files");
    const result = await handler({ projectId: "proj-cached", prefix: "page/" });

    expect(mockedListCachedKeys).toHaveBeenCalledWith("proj-cached", "page/");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.source).toBe("cache");
    expect(parsed.value.file_names).toEqual([
      "page/id-Scaffold_abc",
      "page/id-Scaffold_def",
    ]);
  });

  it("filters by prefix client-side when falling back to API", async () => {
    mockedCacheMeta.mockResolvedValue(null);
    const apiResult = {
      value: {
        file_names: [
          "app-details",
          "page/id-Scaffold_abc",
          "page/id-Scaffold_def",
          "custom-file/my-action",
          "folders",
        ],
      },
    };
    mockClient.listPartitionedFileNames.mockResolvedValue(apiResult);

    const handler = getHandler("list_project_files");
    const result = await handler({ projectId: "proj-no-cache", prefix: "page/" });

    expect(mockClient.listPartitionedFileNames).toHaveBeenCalledWith("proj-no-cache");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.value.file_names).toEqual([
      "page/id-Scaffold_abc",
      "page/id-Scaffold_def",
    ]);
  });

  it("returns all keys when prefix is not provided (existing behavior)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-06-01T00:00:00Z",
      fileCount: 3,
      syncMethod: "bulk",
    });
    mockedListCachedKeys.mockResolvedValue([
      "app-details",
      "page/id-Scaffold_abc",
      "folders",
    ]);

    const handler = getHandler("list_project_files");
    const result = await handler({ projectId: "proj-cached" });

    expect(mockedListCachedKeys).toHaveBeenCalledWith("proj-cached");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.value.file_names).toEqual([
      "app-details",
      "page/id-Scaffold_abc",
      "folders",
    ]);
  });
});

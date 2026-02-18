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

vi.mock("../utils/decode-yaml.js", () => ({
  decodeProjectYamlResponse: vi.fn(),
}));

// list-pages.ts is imported for fetchOneFile — mock it too
vi.mock("./list-pages.js", () => ({
  fetchOneFile: vi.fn(),
  extractPageFileKeys: vi.fn(),
}));

import { createMockServer } from "../__helpers__/mock-server.js";
import { createMockClient, asClient } from "../__helpers__/mock-client.js";
import { registerSyncProjectTool } from "./sync-project.js";
import {
  cacheMeta,
  cacheWriteBulk,
  cacheWriteMeta,
  cacheWrite,
} from "../utils/cache.js";
import { decodeProjectYamlResponse } from "../utils/decode-yaml.js";
import { fetchOneFile } from "./list-pages.js";

const mockedCacheMeta = vi.mocked(cacheMeta);
const mockedCacheWriteBulk = vi.mocked(cacheWriteBulk);
const mockedCacheWriteMeta = vi.mocked(cacheWriteMeta);
const mockedCacheWrite = vi.mocked(cacheWrite);
const mockedDecodeYaml = vi.mocked(decodeProjectYamlResponse);
const mockedFetchOneFile = vi.mocked(fetchOneFile);

describe("sync_project tool", () => {
  let mockClient: ReturnType<typeof createMockClient>;
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
    const mock = createMockServer();
    registerSyncProjectTool(mock.server as any, asClient(mockClient));
    getHandler = mock.getHandler;
  });

  it("registers with the correct tool name", () => {
    expect(() => getHandler("sync_project")).not.toThrow();
  });

  it("returns already_cached when cache exists and force is not set", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01T00:00:00Z",
      fileCount: 42,
      syncMethod: "bulk",
    });

    const handler = getHandler("sync_project");
    const result = await handler({ projectId: "proj-cached" });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.status).toBe("already_cached");
    expect(parsed.fileCount).toBe(42);
    expect(parsed.syncMethod).toBe("bulk");
    expect(mockClient.getProjectYamls).not.toHaveBeenCalled();
  });

  it("re-syncs when force=true even if cache exists", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01T00:00:00Z",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockClient.getProjectYamls.mockResolvedValue("raw-zip");
    mockedDecodeYaml.mockReturnValue({
      "app-details.yaml": "name: MyApp",
      "folders.yaml": "some: folders",
    });
    mockedCacheWriteBulk.mockResolvedValue(2);

    const handler = getHandler("sync_project");
    const result = await handler({ projectId: "proj-cached", force: true });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.status).toBe("synced");
    expect(parsed.method).toBe("bulk");
    expect(parsed.syncedFiles).toBe(2);
    expect(mockClient.getProjectYamls).toHaveBeenCalledWith("proj-cached");
  });

  it("performs bulk sync successfully", async () => {
    mockedCacheMeta.mockResolvedValue(null);
    mockClient.getProjectYamls.mockResolvedValue("raw-zip-data");
    mockedDecodeYaml.mockReturnValue({
      "app-details.yaml": "name: TestApp",
      "page/id-Scaffold_abc.yaml": "name: Page1",
    });
    mockedCacheWriteBulk.mockResolvedValue(2);

    const handler = getHandler("sync_project");
    const result = await handler({ projectId: "proj-new" });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.status).toBe("synced");
    expect(parsed.method).toBe("bulk");
    expect(parsed.syncedFiles).toBe(2);
    expect(parsed.failed).toBe(0);

    // Should strip .yaml extension from keys before bulk writing
    expect(mockedCacheWriteBulk).toHaveBeenCalledWith("proj-new", {
      "app-details": "name: TestApp",
      "page/id-Scaffold_abc": "name: Page1",
    });
    expect(mockedCacheWriteMeta).toHaveBeenCalled();
  });

  it("falls back to batched sync when bulk fails", async () => {
    mockedCacheMeta.mockResolvedValue(null);

    // Bulk fails
    mockClient.getProjectYamls.mockRejectedValue(new Error("ZIP too large"));

    // Fallback: list file names, then batch-fetch
    mockClient.listPartitionedFileNames.mockResolvedValue({
      value: { file_names: ["app-details", "page/id-Scaffold_abc"] },
    });

    mockedFetchOneFile.mockImplementation(async (_client, _pid, fileKey) => {
      return { fileKey, content: `name: ${fileKey}` };
    });

    const handler = getHandler("sync_project");
    const result = await handler({ projectId: "proj-fallback" });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.status).toBe("synced");
    expect(parsed.method).toBe("batched");
    expect(parsed.syncedFiles).toBe(2);
    expect(parsed.failed).toBe(0);
    expect(mockedCacheWriteMeta).toHaveBeenCalled();
  });

  it("reports error when no file keys from API in batched fallback", async () => {
    mockedCacheMeta.mockResolvedValue(null);
    mockClient.getProjectYamls.mockRejectedValue(new Error("fail"));
    mockClient.listPartitionedFileNames.mockResolvedValue({
      value: { file_names: [] },
    });

    const handler = getHandler("sync_project");
    const result = await handler({ projectId: "proj-empty" });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.status).toBe("error");
    expect(parsed.message).toContain("No file keys");
  });

  it("strips .yaml extension from ZIP entry keys to avoid double extension", async () => {
    mockedCacheMeta.mockResolvedValue(null);
    mockClient.getProjectYamls.mockResolvedValue("raw");
    mockedDecodeYaml.mockReturnValue({
      "folders.yaml": "folder-content",
      "app-details": "no-extension-content",
    });
    mockedCacheWriteBulk.mockResolvedValue(2);

    const handler = getHandler("sync_project");
    await handler({ projectId: "proj-ext" });

    const writtenEntries = mockedCacheWriteBulk.mock.calls[0][1];
    expect(writtenEntries).toHaveProperty("folders");
    expect(writtenEntries).toHaveProperty("app-details");
    expect(writtenEntries).not.toHaveProperty("folders.yaml");
  });
});

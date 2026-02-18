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
import { createMockClient, asClient } from "../__helpers__/mock-client.js";
import { registerUpdateYamlTool } from "./update-yaml.js";
import { cacheWrite } from "../utils/cache.js";

const mockedCacheWrite = vi.mocked(cacheWrite);

describe("update_project_yaml tool", () => {
  let mockClient: ReturnType<typeof createMockClient>;
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
    const mock = createMockServer();
    registerUpdateYamlTool(mock.server as any, asClient(mockClient));
    getHandler = mock.getHandler;
  });

  it("registers with the correct tool name", () => {
    expect(() => getHandler("update_project_yaml")).not.toThrow();
  });

  it("passes projectId and fileKeyToContent to client", async () => {
    const fakeResult = { success: true };
    mockClient.updateProjectByYaml.mockResolvedValue(fakeResult);

    const fileKeyToContent = {
      "app-details": "name: MyApp",
      "page/id-Scaffold_abc": "name: HomePage",
    };

    const handler = getHandler("update_project_yaml");
    const result = await handler({
      projectId: "proj-123",
      fileKeyToContent,
    });

    expect(mockClient.updateProjectByYaml).toHaveBeenCalledWith(
      "proj-123",
      fileKeyToContent
    );
    expect(JSON.parse(result.content[0].text)).toEqual(fakeResult);
  });

  it("writes each entry to cache after successful update", async () => {
    mockClient.updateProjectByYaml.mockResolvedValue({ success: true });

    const fileKeyToContent = {
      "file-a": "content-a",
      "file-b": "content-b",
      "file-c": "content-c",
    };

    const handler = getHandler("update_project_yaml");
    await handler({ projectId: "proj-x", fileKeyToContent });

    expect(mockedCacheWrite).toHaveBeenCalledTimes(3);
    expect(mockedCacheWrite).toHaveBeenCalledWith("proj-x", "file-a", "content-a");
    expect(mockedCacheWrite).toHaveBeenCalledWith("proj-x", "file-b", "content-b");
    expect(mockedCacheWrite).toHaveBeenCalledWith("proj-x", "file-c", "content-c");
  });

  it("returns the API result as JSON text", async () => {
    const fakeResult = { status: "ok", updated: 2 };
    mockClient.updateProjectByYaml.mockResolvedValue(fakeResult);

    const handler = getHandler("update_project_yaml");
    const result = await handler({
      projectId: "proj-123",
      fileKeyToContent: { "some-key": "content" },
    });

    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual(fakeResult);
  });
});

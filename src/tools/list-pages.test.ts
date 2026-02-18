import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock cache and decode-yaml BEFORE importing the tool
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

vi.mock("../utils/parse-folders.js", () => ({
  parseFolderMapping: vi.fn(),
}));

import { createMockServer } from "../__helpers__/mock-server.js";
import { createMockClient, asClient } from "../__helpers__/mock-client.js";
import {
  registerListPagesTool,
  extractPageFileKeys,
  fetchOneFile,
} from "./list-pages.js";
import { cacheRead, cacheWrite } from "../utils/cache.js";
import { decodeProjectYamlResponse } from "../utils/decode-yaml.js";
import { parseFolderMapping } from "../utils/parse-folders.js";

const mockedCacheRead = vi.mocked(cacheRead);
const mockedCacheWrite = vi.mocked(cacheWrite);
const mockedDecodeYaml = vi.mocked(decodeProjectYamlResponse);
const mockedParseFolders = vi.mocked(parseFolderMapping);

// ---------------------------------------------------------------------------
// extractPageFileKeys
// ---------------------------------------------------------------------------
describe("extractPageFileKeys", () => {
  it("filters for top-level page scaffold files only", () => {
    const input = {
      value: {
        file_names: [
          "app-details",
          "folders",
          "page/id-Scaffold_abc",
          "page/id-Scaffold_xyz",
          "page/id-Scaffold_abc/page-widget-tree-outline",
          "page/id-Scaffold_abc/page-widget-tree-outline/node/id-Widget_123",
          "component/id-Container_zzz",
        ],
      },
    };

    const result = extractPageFileKeys(input);
    expect(result).toEqual([
      "page/id-Scaffold_abc",
      "page/id-Scaffold_xyz",
    ]);
  });

  it("handles snake_case file_names field", () => {
    const input = { value: { file_names: ["page/id-Scaffold_one"] } };
    expect(extractPageFileKeys(input)).toEqual(["page/id-Scaffold_one"]);
  });

  it("handles camelCase fileNames field as fallback", () => {
    const input = { value: { fileNames: ["page/id-Scaffold_two"] } };
    expect(extractPageFileKeys(input)).toEqual(["page/id-Scaffold_two"]);
  });

  it("returns empty array when no matching files", () => {
    expect(extractPageFileKeys({ value: { file_names: ["app-details"] } })).toEqual([]);
    expect(extractPageFileKeys({})).toEqual([]);
    expect(extractPageFileKeys(null)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// fetchOneFile
// ---------------------------------------------------------------------------
describe("fetchOneFile", () => {
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  it("returns cached content when available", async () => {
    mockedCacheRead.mockResolvedValue("name: CachedPage");

    const result = await fetchOneFile(
      asClient(mockClient),
      "proj-1",
      "page/id-Scaffold_abc"
    );

    expect(result).toEqual({
      fileKey: "page/id-Scaffold_abc",
      content: "name: CachedPage",
    });
    expect(mockClient.getProjectYamls).not.toHaveBeenCalled();
  });

  it("fetches from API when not cached and writes to cache", async () => {
    mockedCacheRead.mockResolvedValue(null);
    mockClient.getProjectYamls.mockResolvedValue("raw-zip-data");
    mockedDecodeYaml.mockReturnValue({
      "page/id-Scaffold_abc": "name: FetchedPage",
    });

    const result = await fetchOneFile(
      asClient(mockClient),
      "proj-1",
      "page/id-Scaffold_abc"
    );

    expect(result).toEqual({
      fileKey: "page/id-Scaffold_abc",
      content: "name: FetchedPage",
    });
    expect(mockedCacheWrite).toHaveBeenCalledWith(
      "proj-1",
      "page/id-Scaffold_abc",
      "name: FetchedPage"
    );
  });

  it("returns null when API fetch fails", async () => {
    mockedCacheRead.mockResolvedValue(null);
    mockClient.getProjectYamls.mockRejectedValue(new Error("API error"));

    const result = await fetchOneFile(
      asClient(mockClient),
      "proj-1",
      "page/id-Scaffold_xyz"
    );

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// list_pages handler
// ---------------------------------------------------------------------------
describe("list_pages handler", () => {
  let mockClient: ReturnType<typeof createMockClient>;
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
    const mock = createMockServer();
    registerListPagesTool(mock.server as any, asClient(mockClient));
    getHandler = mock.getHandler;
  });

  it("registers with the correct tool name", () => {
    expect(() => getHandler("list_pages")).not.toThrow();
  });

  it("returns sorted PageInfo array", async () => {
    // Setup: listPartitionedFileNames returns page keys
    mockClient.listPartitionedFileNames.mockResolvedValue({
      value: {
        file_names: [
          "page/id-Scaffold_bbb",
          "page/id-Scaffold_aaa",
          "folders",
        ],
      },
    });

    // Setup: folders fetch (via fetchOneFile -> cacheRead)
    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "folders") {
        return "Scaffold_aaa: FolderB\nScaffold_bbb: FolderA";
      }
      if (key === "page/id-Scaffold_aaa") return "name: ZetaPage";
      if (key === "page/id-Scaffold_bbb") return "name: AlphaPage";
      return null;
    });

    mockedParseFolders.mockReturnValue({
      Scaffold_aaa: "FolderB",
      Scaffold_bbb: "FolderA",
    });

    const handler = getHandler("list_pages");
    const result = await handler({ projectId: "proj-test" });

    const pages = JSON.parse(result.content[0].text);
    expect(pages).toHaveLength(2);
    // Sorted by folder first (FolderA < FolderB), then name
    expect(pages[0].name).toBe("AlphaPage");
    expect(pages[0].folder).toBe("FolderA");
    expect(pages[1].name).toBe("ZetaPage");
    expect(pages[1].folder).toBe("FolderB");
  });

  it("marks pages as error when fetch fails", async () => {
    mockClient.listPartitionedFileNames.mockResolvedValue({
      value: { file_names: ["page/id-Scaffold_fail"] },
    });

    // folders not cached, API also returns empty
    mockedCacheRead.mockResolvedValue(null);
    mockClient.getProjectYamls.mockRejectedValue(new Error("fail"));
    mockedParseFolders.mockReturnValue({});

    const handler = getHandler("list_pages");
    const result = await handler({ projectId: "proj-err" });

    const pages = JSON.parse(result.content[0].text);
    expect(pages).toHaveLength(1);
    expect(pages[0].name).toBe("(error - could not fetch)");
    expect(pages[0].scaffoldId).toBe("Scaffold_fail");
  });
});

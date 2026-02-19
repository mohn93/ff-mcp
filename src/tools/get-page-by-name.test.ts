import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock cache and decode-yaml BEFORE importing the tool
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

vi.mock("../utils/decode-yaml.js", () => ({
  decodeProjectYamlResponse: vi.fn(),
}));

vi.mock("../utils/parse-folders.js", () => ({
  parseFolderMapping: vi.fn(),
}));

import { createMockServer } from "../__helpers__/mock-server.js";
import { createMockClient, asClient } from "../__helpers__/mock-client.js";
import { registerGetPageByNameTool } from "./get-page-by-name.js";
import { cacheRead } from "../utils/cache.js";
import { parseFolderMapping } from "../utils/parse-folders.js";

const mockedCacheRead = vi.mocked(cacheRead);
const mockedParseFolders = vi.mocked(parseFolderMapping);

describe("get_page_by_name tool", () => {
  let mockClient: ReturnType<typeof createMockClient>;
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
    const mock = createMockServer();
    registerGetPageByNameTool(mock.server as any, asClient(mockClient));
    getHandler = mock.getHandler;
  });

  it("registers with the correct tool name", () => {
    expect(() => getHandler("get_page_by_name")).not.toThrow();
  });

  it("finds a page by name (case-insensitive)", async () => {
    mockClient.listPartitionedFileNames.mockResolvedValue({
      value: { file_names: ["page/id-Scaffold_abc", "page/id-Scaffold_xyz"] },
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "folders") return "some-folder-content";
      if (key === "page/id-Scaffold_abc") return "name: Welcome\nroute: /welcome";
      if (key === "page/id-Scaffold_xyz") return "name: Settings\nroute: /settings";
      return null;
    });

    mockedParseFolders.mockReturnValue({ Scaffold_abc: "Main", Scaffold_xyz: "Utils" });

    const handler = getHandler("get_page_by_name");
    const result = await handler({ projectId: "proj-1", pageName: "welcome" });

    expect(result.content[0].text).toContain("Welcome");
    expect(result.content[0].text).toContain("Scaffold_abc");
    expect(result.content[0].text).toContain("Main");
    expect(result.content[0].text).toContain("name: Welcome");
  });

  it("returns 'not found' with available names when no match", async () => {
    mockClient.listPartitionedFileNames.mockResolvedValue({
      value: { file_names: ["page/id-Scaffold_abc", "page/id-Scaffold_xyz"] },
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "folders") return "folder-content";
      if (key === "page/id-Scaffold_abc") return "name: Welcome";
      if (key === "page/id-Scaffold_xyz") return "name: Settings";
      return null;
    });

    mockedParseFolders.mockReturnValue({});

    const handler = getHandler("get_page_by_name");
    const result = await handler({ projectId: "proj-1", pageName: "NonExistent" });

    expect(result.content[0].text).toContain('Page "NonExistent" not found');
    expect(result.content[0].text).toContain("Welcome");
    expect(result.content[0].text).toContain("Settings");
  });

  it("uses case-insensitive matching", async () => {
    mockClient.listPartitionedFileNames.mockResolvedValue({
      value: { file_names: ["page/id-Scaffold_abc"] },
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "folders") return "";
      if (key === "page/id-Scaffold_abc") return "name: GoldPass";
      return null;
    });

    mockedParseFolders.mockReturnValue({});

    const handler = getHandler("get_page_by_name");
    const result = await handler({ projectId: "proj-1", pageName: "GOLDPASS" });

    expect(result.content[0].text).toContain("GoldPass");
    expect(result.content[0].text).toContain("Scaffold_abc");
  });

  it("includes folder in the output header", async () => {
    mockClient.listPartitionedFileNames.mockResolvedValue({
      value: { file_names: ["page/id-Scaffold_def"] },
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "folders") return "folders-yaml";
      if (key === "page/id-Scaffold_def") return "name: ProfilePage";
      return null;
    });

    mockedParseFolders.mockReturnValue({ Scaffold_def: "UserFlow" });

    const handler = getHandler("get_page_by_name");
    const result = await handler({ projectId: "proj-1", pageName: "ProfilePage" });

    expect(result.content[0].text).toContain("UserFlow");
    expect(result.content[0].text).toContain("page/id-Scaffold_def");
  });
});

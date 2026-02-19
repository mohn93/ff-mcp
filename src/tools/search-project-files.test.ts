import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock all dependencies BEFORE imports
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
import { registerSearchProjectFilesTool } from "./search-project-files.js";
import { cacheMeta, listCachedKeys } from "../utils/cache.js";

const mockedCacheMeta = vi.mocked(cacheMeta);
const mockedListCachedKeys = vi.mocked(listCachedKeys);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMeta() {
  return { lastSyncedAt: "2025-01-01", fileCount: 20, syncMethod: "bulk" as const };
}

const SAMPLE_KEYS = [
  "app-details",
  "app-state",
  "custom-file/id-MAIN",
  "custom-file/id-MAIN/custom-file-code.dart",
  "custom-file/id-OTHER",
  "custom-actions/id-abc",
  "page/id-Scaffold_abc",
  "component/id-Container_xyz",
  "app-action-components/id-ld3jo3",
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("search_project_files handler", () => {
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockServer();
    registerSearchProjectFilesTool(mock.server as any);
    getHandler = mock.getHandler;
  });

  // -----------------------------------------------------------------------
  // 1. Registers with correct tool name
  // -----------------------------------------------------------------------
  it("registers with correct tool name 'search_project_files'", () => {
    expect(() => getHandler("search_project_files")).not.toThrow();
  });

  // -----------------------------------------------------------------------
  // 2. Returns "No cache found" when cacheMeta returns null
  // -----------------------------------------------------------------------
  it("returns 'No cache found' when cacheMeta returns null", async () => {
    mockedCacheMeta.mockResolvedValue(null);

    const handler = getHandler("search_project_files");
    const result = await handler({ projectId: "proj-no-cache", query: "page" });

    expect(result.content[0].text).toContain("No cache found");
    expect(result.content[0].text).toContain("proj-no-cache");
    expect(result.content[0].text).toContain("sync_project");
  });

  // -----------------------------------------------------------------------
  // 3. Contains mode (default) matches case-insensitively
  // -----------------------------------------------------------------------
  it("contains mode (default) matches case-insensitively", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());
    mockedListCachedKeys.mockResolvedValue(SAMPLE_KEYS);

    const handler = getHandler("search_project_files");
    const result = await handler({ projectId: "proj-1", query: "MAIN" });
    const text = result.content[0].text;

    expect(text).toContain("custom-file/id-MAIN");
    expect(text).toContain("custom-file/id-MAIN/custom-file-code.dart");
    expect(text).toContain("Found 2 files");
  });

  // -----------------------------------------------------------------------
  // 4. Prefix mode matches by startsWith
  // -----------------------------------------------------------------------
  it("prefix mode matches by startsWith", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());
    mockedListCachedKeys.mockResolvedValue(SAMPLE_KEYS);

    const handler = getHandler("search_project_files");
    const result = await handler({ projectId: "proj-1", query: "custom-file/", mode: "prefix" });
    const text = result.content[0].text;

    expect(text).toContain("custom-file/id-MAIN");
    expect(text).toContain("custom-file/id-MAIN/custom-file-code.dart");
    expect(text).toContain("custom-file/id-OTHER");
    expect(text).toContain("Found 3 files");
    // Should NOT include custom-actions (different prefix)
    expect(text).not.toContain("custom-actions/id-abc");
  });

  // -----------------------------------------------------------------------
  // 5. Regex mode supports patterns
  // -----------------------------------------------------------------------
  it("regex mode supports patterns like '^app-'", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());
    mockedListCachedKeys.mockResolvedValue(SAMPLE_KEYS);

    const handler = getHandler("search_project_files");
    const result = await handler({ projectId: "proj-1", query: "^app-", mode: "regex" });
    const text = result.content[0].text;

    expect(text).toContain("app-details");
    expect(text).toContain("app-state");
    expect(text).toContain("app-action-components/id-ld3jo3");
    expect(text).toContain("Found 3 files");
    // Should NOT include page/component keys
    expect(text).not.toContain("page/id-Scaffold_abc");
    expect(text).not.toContain("component/id-Container_xyz");
  });

  // -----------------------------------------------------------------------
  // 6. Returns "No files found" when nothing matches
  // -----------------------------------------------------------------------
  it("returns 'No files found' when nothing matches", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());
    mockedListCachedKeys.mockResolvedValue(SAMPLE_KEYS);

    const handler = getHandler("search_project_files");
    const result = await handler({ projectId: "proj-1", query: "nonexistent-thing" });
    const text = result.content[0].text;

    expect(text).toContain("No files found");
    expect(text).toContain("nonexistent-thing");
  });

  // -----------------------------------------------------------------------
  // 7. Truncates results at 100 with a warning
  // -----------------------------------------------------------------------
  it("truncates results at 100 with a warning showing '100 of 150'", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    // Generate 150 matching keys
    const manyKeys = Array.from({ length: 150 }, (_, i) => `page/id-Scaffold_${i}`);
    mockedListCachedKeys.mockResolvedValue(manyKeys);

    const handler = getHandler("search_project_files");
    const result = await handler({ projectId: "proj-1", query: "page" });
    const text = result.content[0].text;

    expect(text).toContain("100 of 150");
    // Count the number of "- " lines (each result is "- key")
    const lines = text.split("\n").filter((l: string) => l.startsWith("- "));
    expect(lines).toHaveLength(100);
  });
});

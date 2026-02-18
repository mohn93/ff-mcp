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

import { createMockServer } from "../__helpers__/mock-server.js";
import { registerGetProjectConfigTool } from "./get-project-config.js";
import { cacheRead, cacheMeta, listCachedKeys } from "../utils/cache.js";

const mockedCacheRead = vi.mocked(cacheRead);
const mockedCacheMeta = vi.mocked(cacheMeta);
const mockedListCachedKeys = vi.mocked(listCachedKeys);

describe("get_project_config handler", () => {
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockServer();
    registerGetProjectConfigTool(mock.server as any);
    getHandler = mock.getHandler;
  });

  it("registers with the correct tool name", () => {
    expect(() => getHandler("get_project_config")).not.toThrow();
  });

  it('returns "No cache found" error when cacheMeta returns null', async () => {
    mockedCacheMeta.mockResolvedValue(null);

    const handler = getHandler("get_project_config");
    const result = await handler({ projectId: "proj-no-cache" });

    expect(result.content[0].text).toContain("No cache found");
    expect(result.content[0].text).toContain("sync_project");
  });

  it("shows app details (name, initial page resolved, routing)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "app-details") {
        return [
          "name: MyApp",
          "initialPageKeyRef:",
          "  key: Scaffold_abc",
          "routingSettings:",
          "  enableRouting: true",
          "  pagesAreSubroutesOfRoot: false",
        ].join("\n");
      }
      if (key === "page/id-Scaffold_abc") return "name: HomePage";
      return null;
    });

    const handler = getHandler("get_project_config");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## App Details");
    expect(text).toContain("Name: MyApp");
    expect(text).toContain("Initial page: HomePage (Scaffold_abc)");
    expect(text).toContain("Routing: enabled, pages are subroutes: no");
  });

  it("shows authentication section when active with Firebase provider", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "authentication") {
        return [
          "active: true",
          "firebaseConfigFileInfos:",
          "  - something: true",
        ].join("\n");
      }
      return null;
    });

    const handler = getHandler("get_project_config");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Authentication");
    expect(text).toContain("Status: Active");
    expect(text).toContain("Provider: Firebase");
  });

  it("shows authentication section as inactive when active is false", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "authentication") return "active: false";
      return null;
    });

    const handler = getHandler("get_project_config");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Authentication");
    expect(text).toContain("Status: Inactive");
    expect(text).not.toContain("Provider:");
  });

  it("detects Supabase provider when supabase config is present", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "authentication") {
        return [
          "active: true",
          "supabase:",
          "  url: https://example.supabase.co",
        ].join("\n");
      }
      return null;
    });

    const handler = getHandler("get_project_config");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("Status: Active");
    expect(text).toContain("Provider: Supabase");
  });

  it("shows auth pages from app-details (home page, sign-in page resolved to names)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "app-details") {
        return [
          "name: MyApp",
          "authPageInfo:",
          "  homePageNodeKeyRef:",
          "    key: Scaffold_home",
          "  signInPageNodeKeyRef:",
          "    key: Scaffold_login",
        ].join("\n");
      }
      if (key === "authentication") return "active: true\nfirebaseConfigFileInfos:\n  - x: 1";
      if (key === "page/id-Scaffold_home") return "name: Dashboard";
      if (key === "page/id-Scaffold_login") return "name: LoginPage";
      return null;
    });

    const handler = getHandler("get_project_config");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("Home page: Dashboard (Scaffold_home)");
    expect(text).toContain("Sign-in page: LoginPage (Scaffold_login)");
  });

  it("shows nav bar (visible, type, labels, tabs with resolved names)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "nav-bar") {
        return [
          "show: true",
          "navBarType: FLOATING",
          "labels: true",
          "pageKeyRefOrder:",
          "  - key: Scaffold_tab1",
          "  - key: Scaffold_tab2",
        ].join("\n");
      }
      if (key === "page/id-Scaffold_tab1") return "name: HomeTab";
      if (key === "page/id-Scaffold_tab2") return "name: ProfileTab";
      return null;
    });

    const handler = getHandler("get_project_config");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Nav Bar");
    expect(text).toContain("Visible: Yes");
    expect(text).toContain("Type: FLOATING");
    expect(text).toContain("Labels: Yes");
    expect(text).toContain("Tabs:");
    expect(text).toContain("1. HomeTab (Scaffold_tab1)");
    expect(text).toContain("2. ProfileTab (Scaffold_tab2)");
  });

  it("shows nav bar as not visible when show is false", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "nav-bar") return "show: false";
      return null;
    });

    const handler = getHandler("get_project_config");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Nav Bar");
    expect(text).toContain("Visible: No");
  });

  it("shows permissions (built-in + custom)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "permissions") {
        return [
          "permissionMessages:",
          "  - permissionType: CAMERA",
          "    message:",
          "      textValue:",
          '        inputValue: "Camera needed"',
          "userDefinedPermissions:",
          "  - names:",
          "      iosName: NSHealthShareUsageDescription",
          "      androidName: android.permission.HEALTH",
          "    message:",
          "      textValue:",
          '        inputValue: "Health data access"',
        ].join("\n");
      }
      return null;
    });

    const handler = getHandler("get_project_config");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Permissions");
    expect(text).toContain("Built-in:");
    expect(text).toContain('CAMERA: "Camera needed"');
    expect(text).toContain("Custom:");
    expect(text).toContain(
      'NSHealthShareUsageDescription / android.permission.HEALTH: "Health data access"'
    );
  });

  it("shows services (RevenueCat enabled)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "revenue-cat") return "enabled: true";
      return null;
    });

    const handler = getHandler("get_project_config");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Services");
    expect(text).toContain("RevenueCat: enabled");
  });

  it("shows services (RevenueCat disabled)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "revenue-cat") return "enabled: false";
      return null;
    });

    const handler = getHandler("get_project_config");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Services");
    expect(text).toContain("RevenueCat: disabled");
  });

  it('returns "(not cached)" for app-details when missing', async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    // All cache reads return null
    mockedCacheRead.mockResolvedValue(null);

    const handler = getHandler("get_project_config");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## App Details");
    expect(text).toContain("(not cached)");
  });
});

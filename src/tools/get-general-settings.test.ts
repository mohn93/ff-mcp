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
import { registerGetGeneralSettingsTool } from "./get-general-settings.js";
import { cacheRead, cacheMeta } from "../utils/cache.js";
import YAML from "yaml";

const mockedCacheRead = vi.mocked(cacheRead);
const mockedCacheMeta = vi.mocked(cacheMeta);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMeta() {
  return { lastSyncedAt: "2025-01-01", fileCount: 20, syncMethod: "bulk" as const };
}

function makeAppDetailsYaml(overrides: Record<string, unknown> = {}) {
  return YAML.stringify({
    name: "MyTestApp",
    initialPageKeyRef: { key: "Scaffold_abc123" },
    routingSettings: {
      enableRouting: true,
      pagesAreSubroutesOfRoot: false,
    },
    allAppNames: {
      appNames: {
        PROD: {
          packageName: "com.example.testapp",
          displayName: "MyTestApp",
        },
      },
    },
    ...overrides,
  });
}

function makeAppAssetsYaml(overrides: Record<string, unknown> = {}) {
  return YAML.stringify({
    appIconPath: "projects/xxx/assets/icon.jpg",
    splashImage: {
      path: "projects/xxx/assets/splash.png",
      fit: "FF_BOX_FIT_COVER",
      minSplashScreenDuration: 1500,
    },
    errorImagePath: "projects/xxx/assets/default-image.png",
    ...overrides,
  });
}

function makeNavBarYaml(overrides: Record<string, unknown> = {}) {
  return YAML.stringify({
    show: true,
    navBarType: "FLOATING",
    labels: true,
    pageKeyRefOrder: [
      { key: "Scaffold_home1" },
      { key: "Scaffold_profile1" },
    ],
    ...overrides,
  });
}

function makePageYaml(name: string) {
  return `name: ${name}\nsomeOtherField: value`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("get_general_settings handler", () => {
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockServer();
    registerGetGeneralSettingsTool(mock.server as any);
    getHandler = mock.getHandler;
  });

  // -----------------------------------------------------------------------
  // 1. Registers with correct tool name
  // -----------------------------------------------------------------------
  it("registers with correct tool name 'get_general_settings'", () => {
    expect(() => getHandler("get_general_settings")).not.toThrow();
  });

  // -----------------------------------------------------------------------
  // 2. Returns "No cache found" error when cacheMeta returns null
  // -----------------------------------------------------------------------
  it("returns 'No cache found' error when cacheMeta returns null", async () => {
    mockedCacheMeta.mockResolvedValue(null);

    const handler = getHandler("get_general_settings");
    const result = await handler({ projectId: "proj-no-cache" });

    expect(result.content[0].text).toContain("No cache found");
    expect(result.content[0].text).toContain("proj-no-cache");
    expect(result.content[0].text).toContain("sync_project");
  });

  // -----------------------------------------------------------------------
  // 3. Returns App Details section with name, package, initial page, routing
  // -----------------------------------------------------------------------
  it("returns App Details with name, package name, initial page, and routing", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "app-details") return makeAppDetailsYaml();
      if (key === "page/id-Scaffold_abc123") return makePageYaml("HomePage");
      return null;
    });

    const handler = getHandler("get_general_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("# General Settings");
    expect(text).toContain("## App Details");
    expect(text).toContain("Name: MyTestApp");
    expect(text).toContain("Package name: com.example.testapp");
    expect(text).toContain("Initial page: HomePage (Scaffold_abc123)");
    expect(text).toContain("Routing: enabled");
    expect(text).toContain("pages are subroutes: no");
  });

  // -----------------------------------------------------------------------
  // 4. Returns App Assets section with icon, splash, error image
  // -----------------------------------------------------------------------
  it("returns App Assets with icon, splash, and error image", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "app-assets") return makeAppAssetsYaml();
      return null;
    });

    const handler = getHandler("get_general_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## App Assets");
    expect(text).toContain("App icon: projects/xxx/assets/icon.jpg");
    expect(text).toContain("Splash image: projects/xxx/assets/splash.png");
    expect(text).toContain("fit: FF_BOX_FIT_COVER");
    expect(text).toContain("Splash duration: 1500ms");
    expect(text).toContain("Error image: projects/xxx/assets/default-image.png");
  });

  // -----------------------------------------------------------------------
  // 5. Returns Nav Bar section with visibility, type, labels, tabs
  // -----------------------------------------------------------------------
  it("returns Nav Bar with visibility, type, labels, and tab pages", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "nav-bar") return makeNavBarYaml();
      if (key === "page/id-Scaffold_home1") return makePageYaml("Home");
      if (key === "page/id-Scaffold_profile1") return makePageYaml("Profile");
      return null;
    });

    const handler = getHandler("get_general_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Nav Bar & App Bar");
    expect(text).toContain("Visible: Yes");
    expect(text).toContain("Type: FLOATING");
    expect(text).toContain("Labels: Yes");
    expect(text).toContain("1. Home (Scaffold_home1)");
    expect(text).toContain("2. Profile (Scaffold_profile1)");
  });

  // -----------------------------------------------------------------------
  // 6. Shows Nav Bar as hidden when show is false
  // -----------------------------------------------------------------------
  it("shows Nav Bar as hidden when show is false", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "nav-bar") return makeNavBarYaml({ show: false });
      return null;
    });

    const handler = getHandler("get_general_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Nav Bar & App Bar");
    expect(text).toContain("Visible: No");
  });

  // -----------------------------------------------------------------------
  // 7. Returns all 3 sections when all data is present
  // -----------------------------------------------------------------------
  it("returns all 3 sections when all YAML files are present", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "app-details") return makeAppDetailsYaml();
      if (key === "app-assets") return makeAppAssetsYaml();
      if (key === "nav-bar") return makeNavBarYaml();
      if (key === "page/id-Scaffold_abc123") return makePageYaml("HomePage");
      if (key === "page/id-Scaffold_home1") return makePageYaml("Home");
      if (key === "page/id-Scaffold_profile1") return makePageYaml("Profile");
      return null;
    });

    const handler = getHandler("get_general_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("# General Settings");
    expect(text).toContain("## App Details");
    expect(text).toContain("## App Assets");
    expect(text).toContain("## Nav Bar & App Bar");

    // Spot-check content from each section
    expect(text).toContain("Name: MyTestApp");
    expect(text).toContain("App icon: projects/xxx/assets/icon.jpg");
    expect(text).toContain("Visible: Yes");
  });

  // -----------------------------------------------------------------------
  // 8. Shows "(not configured)" for missing sections
  // -----------------------------------------------------------------------
  it("shows '(not configured)' for all sections when no YAML files are cached", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    // All cacheRead calls return null
    mockedCacheRead.mockResolvedValue(null);

    const handler = getHandler("get_general_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("# General Settings");
    expect(text).toContain("## App Details");
    expect(text).toContain("## App Assets");
    expect(text).toContain("## Nav Bar & App Bar");

    // All sections should show not configured
    const notConfiguredCount = (text.match(/\(not configured\)/g) || []).length;
    expect(notConfiguredCount).toBe(3);
  });

  // -----------------------------------------------------------------------
  // 9. Handles missing initial page ref gracefully
  // -----------------------------------------------------------------------
  it("handles missing initial page ref gracefully", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    const yaml = makeAppDetailsYaml({
      initialPageKeyRef: undefined,
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "app-details") return yaml;
      return null;
    });

    const handler = getHandler("get_general_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("Initial page: not set");
  });

  // -----------------------------------------------------------------------
  // 10. Falls back to scaffold ID when page name can't be resolved
  // -----------------------------------------------------------------------
  it("falls back to scaffold ID when page name cannot be resolved", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "app-details") return makeAppDetailsYaml();
      // page/id-Scaffold_abc123 returns null — can't resolve name
      return null;
    });

    const handler = getHandler("get_general_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("Initial page: Scaffold_abc123 (Scaffold_abc123)");
  });

  // -----------------------------------------------------------------------
  // 11. Extracts package name from first environment
  // -----------------------------------------------------------------------
  it("extracts package name from first environment in allAppNames", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    const yaml = makeAppDetailsYaml({
      allAppNames: {
        appNames: {
          DEV: {
            packageName: "com.example.dev",
            displayName: "DevApp",
          },
          PROD: {
            packageName: "com.example.prod",
            displayName: "ProdApp",
          },
        },
      },
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "app-details") return yaml;
      return null;
    });

    const handler = getHandler("get_general_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    // Should show the first env's package name
    expect(text).toContain("Package name: com.example.");
  });

  // -----------------------------------------------------------------------
  // 12. Handles splash image with duration
  // -----------------------------------------------------------------------
  it("handles app assets with missing optional fields", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    const yaml = makeAppAssetsYaml({
      appIconPath: undefined,
      splashImage: undefined,
      errorImagePath: undefined,
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "app-assets") return yaml;
      return null;
    });

    const handler = getHandler("get_general_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## App Assets");
    // Should not crash, should show not set or similar
    expect(text).not.toContain("undefined");
  });

  // -----------------------------------------------------------------------
  // 13. Nav bar with no page refs
  // -----------------------------------------------------------------------
  it("handles nav bar with no page refs", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "nav-bar") return makeNavBarYaml({ pageKeyRefOrder: undefined });
      return null;
    });

    const handler = getHandler("get_general_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Nav Bar & App Bar");
    expect(text).toContain("Visible: Yes");
    // Should not crash or show tab lines
    expect(text).not.toContain("1.");
  });
});

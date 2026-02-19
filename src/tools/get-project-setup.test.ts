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

vi.mock("../utils/resolve-data-type.js", () => ({
  resolveDataType: vi.fn((dt: Record<string, unknown>) => {
    if (dt.scalarType) return dt.scalarType as string;
    return "unknown";
  }),
}));

import { createMockServer } from "../__helpers__/mock-server.js";
import { registerGetProjectSetupTool } from "./get-project-setup.js";
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

function makeFirebaseAnalyticsYaml(overrides: Record<string, unknown> = {}) {
  return YAML.stringify({
    enabled: true,
    automaticEventSettings: {
      onPageLoad: true,
      onActionsStart: true,
      onAuth: true,
    },
    ...overrides,
  });
}

function makeFirebaseRemoteConfigYaml(overrides: Record<string, unknown> = {}) {
  return YAML.stringify({
    enabled: true,
    fields: [
      {
        parameter: {
          identifier: { name: "newiOSVersion" },
          dataType: { scalarType: "String" },
        },
        serializedDefaultValue: "1.1.1",
      },
    ],
    ...overrides,
  });
}

function makeLanguagesYaml(overrides: Record<string, unknown> = {}) {
  return YAML.stringify({
    languages: [{ language: "en" }, { language: "es" }],
    primaryLanguage: { language: "en" },
    displayLanguage: { language: "en" },
    ...overrides,
  });
}

function makePlatformsYaml(overrides: Record<string, unknown> = {}) {
  return YAML.stringify({
    enableWeb: false,
    ...overrides,
  });
}

function makePermissionsYaml(overrides: Record<string, unknown> = {}) {
  return YAML.stringify({
    permissionMessages: [
      {
        permissionType: "CAMERA",
        message: { textValue: { inputValue: "Camera needed" } },
      },
    ],
    userDefinedPermissions: [
      {
        names: {
          iosName: "NSHealthShareUsageDescription",
          androidName: "android.permission.HEALTH",
        },
        message: { textValue: { inputValue: "Health data access" } },
      },
    ],
    ...overrides,
  });
}

function makeDependenciesYaml(overrides: Record<string, unknown> = {}) {
  return YAML.stringify({
    dependencies: [
      {
        projectId: "push-fire-lib-mblt3v",
        name: "PushFire-Lib",
        version: "current",
      },
    ],
    ...overrides,
  });
}

function makeCustomCodeDependenciesYaml(overrides: Record<string, unknown> = {}) {
  return YAML.stringify({
    pubspecDependencies: [
      { name: "firebase_storage", version: "12.3.2" },
      { name: "geolocator", version: "13.0.1" },
    ],
    ...overrides,
  });
}

function makeEnvironmentSettingsYaml(overrides: Record<string, unknown> = {}) {
  return YAML.stringify({
    currentEnvironment: { name: "Production", key: "PROD" },
    environmentValues: [
      {
        parameter: {
          identifier: { name: "apiKey" },
          dataType: { scalarType: "String" },
        },
        isPrivate: true,
        valuesMap: {
          PROD: { serializedValue: "sk-secret-123" },
        },
      },
      {
        parameter: {
          identifier: { name: "baseUrl" },
          dataType: { scalarType: "String" },
        },
        isPrivate: false,
        valuesMap: {
          PROD: { serializedValue: "https://api.prod.com" },
        },
      },
    ],
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("get_project_setup handler", () => {
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockServer();
    registerGetProjectSetupTool(mock.server as any);
    getHandler = mock.getHandler;
  });

  // -----------------------------------------------------------------------
  // 1. Registers with correct tool name
  // -----------------------------------------------------------------------
  it("registers with correct tool name 'get_project_setup'", () => {
    expect(() => getHandler("get_project_setup")).not.toThrow();
  });

  // -----------------------------------------------------------------------
  // 2. Returns "No cache found" error when cacheMeta returns null
  // -----------------------------------------------------------------------
  it("returns 'No cache found' error when cacheMeta returns null", async () => {
    mockedCacheMeta.mockResolvedValue(null);

    const handler = getHandler("get_project_setup");
    const result = await handler({ projectId: "proj-no-cache" });

    expect(result.content[0].text).toContain("No cache found");
    expect(result.content[0].text).toContain("proj-no-cache");
    expect(result.content[0].text).toContain("sync_project");
  });

  // -----------------------------------------------------------------------
  // 3. Firebase section — shows enabled/disabled services
  // -----------------------------------------------------------------------
  it("returns Firebase section with enabled/disabled services", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "firebase-analytics") return makeFirebaseAnalyticsYaml();
      if (key === "firebase-app-check") return YAML.stringify({ enabled: false });
      if (key === "firebase-crashlytics") return YAML.stringify({ enabled: true });
      if (key === "firebase-performance-monitoring") return YAML.stringify({ enabled: false });
      if (key === "firebase-remote-config") return makeFirebaseRemoteConfigYaml();
      return null;
    });

    const handler = getHandler("get_project_setup");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("# Project Setup");
    expect(text).toContain("## Firebase");
    expect(text).toContain("Analytics: enabled");
    expect(text).toContain("App Check: disabled");
    expect(text).toContain("Crashlytics: enabled");
    expect(text).toContain("Performance Monitoring: disabled");
    expect(text).toContain("Remote Config: enabled");
  });

  // -----------------------------------------------------------------------
  // 4. Firebase Analytics — automatic event settings
  // -----------------------------------------------------------------------
  it("shows Firebase Analytics automatic event settings", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "firebase-analytics") return makeFirebaseAnalyticsYaml();
      return null;
    });

    const handler = getHandler("get_project_setup");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("onPageLoad: Yes");
    expect(text).toContain("onActionsStart: Yes");
    expect(text).toContain("onAuth: Yes");
  });

  // -----------------------------------------------------------------------
  // 5. Firebase Remote Config — field names and default values
  // -----------------------------------------------------------------------
  it("shows Firebase Remote Config fields with names and defaults", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "firebase-remote-config") return makeFirebaseRemoteConfigYaml();
      return null;
    });

    const handler = getHandler("get_project_setup");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("newiOSVersion");
    expect(text).toContain("String");
    expect(text).toContain("1.1.1");
  });

  // -----------------------------------------------------------------------
  // 6. Languages section
  // -----------------------------------------------------------------------
  it("returns Languages section with primary, display, and all languages", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "languages") return makeLanguagesYaml();
      return null;
    });

    const handler = getHandler("get_project_setup");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Languages");
    expect(text).toContain("Primary: en");
    expect(text).toContain("Display: en");
    expect(text).toContain("en");
    expect(text).toContain("es");
  });

  // -----------------------------------------------------------------------
  // 7. Platforms section
  // -----------------------------------------------------------------------
  it("returns Platforms section with web enabled status", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "platforms") return makePlatformsYaml();
      return null;
    });

    const handler = getHandler("get_project_setup");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Platforms");
    expect(text).toContain("Web: disabled");
  });

  it("shows web enabled when enableWeb is true", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "platforms") return makePlatformsYaml({ enableWeb: true });
      return null;
    });

    const handler = getHandler("get_project_setup");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("Web: enabled");
  });

  // -----------------------------------------------------------------------
  // 8. Permissions section — built-in and custom
  // -----------------------------------------------------------------------
  it("returns Permissions section with built-in and custom permissions", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "permissions") return makePermissionsYaml();
      return null;
    });

    const handler = getHandler("get_project_setup");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Permissions");
    expect(text).toContain("Built-in:");
    expect(text).toContain("CAMERA");
    expect(text).toContain("Camera needed");
    expect(text).toContain("Custom:");
    expect(text).toContain("NSHealthShareUsageDescription");
    expect(text).toContain("android.permission.HEALTH");
    expect(text).toContain("Health data access");
  });

  // -----------------------------------------------------------------------
  // 9. Project Dependencies section — FF library deps
  // -----------------------------------------------------------------------
  it("returns Project Dependencies with FF library deps", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "dependencies") return makeDependenciesYaml();
      return null;
    });

    const handler = getHandler("get_project_setup");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Project Dependencies");
    expect(text).toContain("PushFire-Lib");
    expect(text).toContain("push-fire-lib-mblt3v");
    expect(text).toContain("current");
  });

  // -----------------------------------------------------------------------
  // 10. Project Dependencies section — pubspec deps
  // -----------------------------------------------------------------------
  it("returns Project Dependencies with pubspec deps", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "custom-code-dependencies") return makeCustomCodeDependenciesYaml();
      return null;
    });

    const handler = getHandler("get_project_setup");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Project Dependencies");
    expect(text).toContain("firebase_storage");
    expect(text).toContain("12.3.2");
    expect(text).toContain("geolocator");
    expect(text).toContain("13.0.1");
  });

  // -----------------------------------------------------------------------
  // 11. Dev Environments section — current env + values with masking
  // -----------------------------------------------------------------------
  it("returns Dev Environments with current env and masked private values", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "environment-settings") return makeEnvironmentSettingsYaml();
      return null;
    });

    const handler = getHandler("get_project_setup");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Dev Environments");
    expect(text).toContain("Current: Production (PROD)");
    expect(text).toContain("apiKey");
    expect(text).toContain("****");
    expect(text).not.toContain("sk-secret-123");
    expect(text).toContain("baseUrl");
    expect(text).toContain("https://api.prod.com");
  });

  // -----------------------------------------------------------------------
  // 12. All sections present when all data is available
  // -----------------------------------------------------------------------
  it("returns all 6 sections when all YAML files are present", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "firebase-analytics") return makeFirebaseAnalyticsYaml();
      if (key === "firebase-app-check") return YAML.stringify({ enabled: true });
      if (key === "firebase-crashlytics") return YAML.stringify({ enabled: true });
      if (key === "firebase-performance-monitoring") return YAML.stringify({ enabled: true });
      if (key === "firebase-remote-config") return makeFirebaseRemoteConfigYaml();
      if (key === "languages") return makeLanguagesYaml();
      if (key === "platforms") return makePlatformsYaml();
      if (key === "permissions") return makePermissionsYaml();
      if (key === "dependencies") return makeDependenciesYaml();
      if (key === "custom-code-dependencies") return makeCustomCodeDependenciesYaml();
      if (key === "environment-settings") return makeEnvironmentSettingsYaml();
      return null;
    });

    const handler = getHandler("get_project_setup");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("# Project Setup");
    expect(text).toContain("## Firebase");
    expect(text).toContain("## Languages");
    expect(text).toContain("## Platforms");
    expect(text).toContain("## Permissions");
    expect(text).toContain("## Project Dependencies");
    expect(text).toContain("## Dev Environments");
  });

  // -----------------------------------------------------------------------
  // 13. Shows "(not configured)" for all missing sections
  // -----------------------------------------------------------------------
  it("shows '(not configured)' for all sections when no YAML files are cached", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());
    mockedCacheRead.mockResolvedValue(null);

    const handler = getHandler("get_project_setup");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("# Project Setup");
    expect(text).toContain("## Firebase");
    expect(text).toContain("## Languages");
    expect(text).toContain("## Platforms");
    expect(text).toContain("## Permissions");
    expect(text).toContain("## Project Dependencies");
    expect(text).toContain("## Dev Environments");

    const notConfiguredCount = (text.match(/\(not configured\)/g) || []).length;
    expect(notConfiguredCount).toBe(6);
  });

  // -----------------------------------------------------------------------
  // 14. Firebase section shows "(not configured)" when no firebase files
  // -----------------------------------------------------------------------
  it("shows Firebase as '(not configured)' when no firebase files exist", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "languages") return makeLanguagesYaml();
      return null;
    });

    const handler = getHandler("get_project_setup");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    // Firebase should show not configured
    const firebaseSection = text.split("## Languages")[0];
    expect(firebaseSection).toContain("## Firebase");
    expect(firebaseSection).toContain("(not configured)");

    // Languages should still be populated
    expect(text).toContain("Primary: en");
  });

  // -----------------------------------------------------------------------
  // 15. Remote Config with no fields
  // -----------------------------------------------------------------------
  it("handles Remote Config enabled with no fields", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "firebase-remote-config")
        return YAML.stringify({ enabled: true, fields: [] });
      return null;
    });

    const handler = getHandler("get_project_setup");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("Remote Config: enabled");
    // No field lines should appear
    expect(text).not.toContain("newiOSVersion");
  });

  // -----------------------------------------------------------------------
  // 16. Permissions with only built-in (no custom)
  // -----------------------------------------------------------------------
  it("handles permissions with only built-in permissions", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "permissions")
        return makePermissionsYaml({ userDefinedPermissions: undefined });
      return null;
    });

    const handler = getHandler("get_project_setup");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("Built-in:");
    expect(text).toContain("CAMERA");
    expect(text).not.toContain("Custom:");
  });

  // -----------------------------------------------------------------------
  // 17. Permissions with only custom (no built-in)
  // -----------------------------------------------------------------------
  it("handles permissions with only custom permissions", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "permissions")
        return makePermissionsYaml({ permissionMessages: undefined });
      return null;
    });

    const handler = getHandler("get_project_setup");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).not.toContain("Built-in:");
    expect(text).toContain("Custom:");
    expect(text).toContain("NSHealthShareUsageDescription");
  });

  // -----------------------------------------------------------------------
  // 18. Environment with no values
  // -----------------------------------------------------------------------
  it("handles environment settings with current env but no values", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "environment-settings")
        return YAML.stringify({
          currentEnvironment: { name: "Staging", key: "STAGING" },
          environmentValues: [],
        });
      return null;
    });

    const handler = getHandler("get_project_setup");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Dev Environments");
    expect(text).toContain("Current: Staging (STAGING)");
  });
});

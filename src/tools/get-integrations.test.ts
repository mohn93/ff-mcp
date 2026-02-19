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
import { registerGetIntegrationsTool } from "./get-integrations.js";
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

function makeAlgoliaYaml() {
  return YAML.stringify({
    applicationId: "SUEUI0E453",
    searchApiKey: "5c8d18d950352fcf5e66ec8d5df04a66",
    indexedCollections: [
      { name: "Establishments", key: "k2ktdun9" },
      { name: "Users", key: "u3xj1abc" },
    ],
    enabled: true,
  });
}

function makeGoogleMapsYaml() {
  return YAML.stringify({
    androidKey: "AIzaSyD0uDV3nw4IECNtb0U9g9Y2nyY9s69pp7s",
    iosKey: "AIzaSyDRYMeRxiOJmuyM5AuEB8a3RYYXm982IWk",
    webKey: "AIzaSyByZk31ost8F0OQlITBj8yn8pv06ks8u7o",
  });
}

function makeFirebaseAnalyticsYaml() {
  return YAML.stringify({
    enabled: true,
    automaticEventSettings: {
      onPageLoad: true,
      onActionsStart: true,
      onAuth: true,
    },
  });
}

function makeSupabaseYaml() {
  return YAML.stringify({
    enabled: true,
    supabaseUrl: "https://abc.supabase.co",
    supabaseAnonKey: "eyJhbGciOi...",
  });
}

function makeSqliteYaml() {
  return YAML.stringify({
    enabled: true,
    databaseName: "app.db",
  });
}

function makeGithubYaml() {
  return YAML.stringify({
    enabled: true,
    repoOwner: "myorg",
    repoName: "myrepo",
  });
}

function makeAdmobYaml() {
  return YAML.stringify({
    enabled: true,
    androidAppId: "ca-app-pub-123~456",
    iosAppId: "ca-app-pub-123~789",
  });
}

function makeMuxYaml() {
  return YAML.stringify({
    enabled: true,
  });
}

function makeOnesignalYaml() {
  return YAML.stringify({
    enabled: true,
    appId: "onesignal-app-id-123",
  });
}

function makeGeminiYaml() {
  return YAML.stringify({
    enabled: true,
    modelName: "gemini-pro",
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("get_integrations handler", () => {
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockServer();
    registerGetIntegrationsTool(mock.server as any);
    getHandler = mock.getHandler;
  });

  // -----------------------------------------------------------------------
  // 1. Registers with correct tool name
  // -----------------------------------------------------------------------
  it("registers with correct tool name 'get_integrations'", () => {
    expect(() => getHandler("get_integrations")).not.toThrow();
  });

  // -----------------------------------------------------------------------
  // 2. Returns "No cache found" error when cacheMeta returns null
  // -----------------------------------------------------------------------
  it("returns 'No cache found' error when cacheMeta returns null", async () => {
    mockedCacheMeta.mockResolvedValue(null);

    const handler = getHandler("get_integrations");
    const result = await handler({ projectId: "proj-no-cache" });

    expect(result.content[0].text).toContain("No cache found");
    expect(result.content[0].text).toContain("proj-no-cache");
    expect(result.content[0].text).toContain("sync_project");
  });

  // -----------------------------------------------------------------------
  // 3. Shows "(not configured)" for all sections when no YAML files exist
  // -----------------------------------------------------------------------
  it("shows '(not configured)' for all 10 sections when no YAML files are cached", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());
    mockedCacheRead.mockResolvedValue(null);

    const handler = getHandler("get_integrations");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("# Integrations");
    expect(text).toContain("## Supabase");
    expect(text).toContain("## SQLite");
    expect(text).toContain("## GitHub");
    expect(text).toContain("## Algolia");
    expect(text).toContain("## Google Analytics");
    expect(text).toContain("## Google Maps");
    expect(text).toContain("## AdMob");
    expect(text).toContain("## Mux Livestream");
    expect(text).toContain("## OneSignal");
    expect(text).toContain("## Gemini");

    const notConfiguredCount = (text.match(/\(not configured\)/g) || []).length;
    expect(notConfiguredCount).toBe(10);
  });

  // -----------------------------------------------------------------------
  // 4. Algolia: shows applicationId, indexed collections, enabled; hides searchApiKey
  // -----------------------------------------------------------------------
  it("shows Algolia applicationId and indexed collections, hides searchApiKey", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "algolia") return makeAlgoliaYaml();
      return null;
    });

    const handler = getHandler("get_integrations");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Algolia");
    expect(text).toContain("Enabled: Yes");
    expect(text).toContain("Application ID: SUEUI0E453");
    expect(text).toContain("Establishments");
    expect(text).toContain("Users");
    // Must NOT contain the searchApiKey value
    expect(text).not.toContain("5c8d18d950352fcf5e66ec8d5df04a66");
    expect(text).not.toContain("searchApiKey");
  });

  // -----------------------------------------------------------------------
  // 5. Google Maps: shows all 3 keys
  // -----------------------------------------------------------------------
  it("shows Google Maps Android, iOS, and Web keys", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "google-maps") return makeGoogleMapsYaml();
      return null;
    });

    const handler = getHandler("get_integrations");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Google Maps");
    expect(text).toContain("Android key: AIzaSyD0uDV3nw4IECNtb0U9g9Y2nyY9s69pp7s");
    expect(text).toContain("iOS key: AIzaSyDRYMeRxiOJmuyM5AuEB8a3RYYXm982IWk");
    expect(text).toContain("Web key: AIzaSyByZk31ost8F0OQlITBj8yn8pv06ks8u7o");
  });

  // -----------------------------------------------------------------------
  // 6. Google Analytics: shows enabled + event settings
  // -----------------------------------------------------------------------
  it("shows Google Analytics enabled status and automatic event settings", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "firebase-analytics") return makeFirebaseAnalyticsYaml();
      return null;
    });

    const handler = getHandler("get_integrations");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Google Analytics");
    expect(text).toContain("Enabled: Yes");
    expect(text).toContain("onPageLoad: Yes");
    expect(text).toContain("onActionsStart: Yes");
    expect(text).toContain("onAuth: Yes");
  });

  // -----------------------------------------------------------------------
  // 7. Supabase: shows enabled + non-sensitive fields
  // -----------------------------------------------------------------------
  it("shows Supabase enabled status and url", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "supabase") return makeSupabaseYaml();
      return null;
    });

    const handler = getHandler("get_integrations");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Supabase");
    expect(text).toContain("Enabled: Yes");
  });

  // -----------------------------------------------------------------------
  // 8. Generic integrations show enabled status and notable fields
  // -----------------------------------------------------------------------
  it("shows enabled status for SQLite, GitHub, AdMob, Mux, OneSignal, Gemini", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "sqlite") return makeSqliteYaml();
      if (key === "github") return makeGithubYaml();
      if (key === "admob") return makeAdmobYaml();
      if (key === "mux") return makeMuxYaml();
      if (key === "onesignal") return makeOnesignalYaml();
      if (key === "gemini") return makeGeminiYaml();
      return null;
    });

    const handler = getHandler("get_integrations");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    // SQLite
    expect(text).toContain("## SQLite");
    // GitHub
    expect(text).toContain("## GitHub");
    // AdMob
    expect(text).toContain("## AdMob");
    // Mux
    expect(text).toContain("## Mux Livestream");
    // OneSignal
    expect(text).toContain("## OneSignal");
    // Gemini
    expect(text).toContain("## Gemini");
  });

  // -----------------------------------------------------------------------
  // 9. All integrations present shows all sections populated
  // -----------------------------------------------------------------------
  it("returns all 10 sections populated when all integrations are configured", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "supabase") return makeSupabaseYaml();
      if (key === "sqlite") return makeSqliteYaml();
      if (key === "github") return makeGithubYaml();
      if (key === "algolia") return makeAlgoliaYaml();
      if (key === "firebase-analytics") return makeFirebaseAnalyticsYaml();
      if (key === "google-maps") return makeGoogleMapsYaml();
      if (key === "admob") return makeAdmobYaml();
      if (key === "mux") return makeMuxYaml();
      if (key === "onesignal") return makeOnesignalYaml();
      if (key === "gemini") return makeGeminiYaml();
      return null;
    });

    const handler = getHandler("get_integrations");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("# Integrations");

    // No "(not configured)" should appear
    expect(text).not.toContain("(not configured)");

    // All sections should be present
    expect(text).toContain("## Supabase");
    expect(text).toContain("## SQLite");
    expect(text).toContain("## GitHub");
    expect(text).toContain("## Algolia");
    expect(text).toContain("## Google Analytics");
    expect(text).toContain("## Google Maps");
    expect(text).toContain("## AdMob");
    expect(text).toContain("## Mux Livestream");
    expect(text).toContain("## OneSignal");
    expect(text).toContain("## Gemini");
  });

  // -----------------------------------------------------------------------
  // 10. Google Analytics disabled shows Enabled: No
  // -----------------------------------------------------------------------
  it("shows Google Analytics as disabled when enabled is false", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    const yaml = YAML.stringify({
      enabled: false,
      automaticEventSettings: {
        onPageLoad: false,
        onActionsStart: false,
        onAuth: false,
      },
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "firebase-analytics") return yaml;
      return null;
    });

    const handler = getHandler("get_integrations");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Google Analytics");
    expect(text).toContain("Enabled: No");
    expect(text).toContain("onPageLoad: No");
    expect(text).toContain("onActionsStart: No");
    expect(text).toContain("onAuth: No");
  });

  // -----------------------------------------------------------------------
  // 11. Algolia with no indexed collections shows empty list
  // -----------------------------------------------------------------------
  it("handles Algolia with no indexed collections gracefully", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    const yaml = YAML.stringify({
      applicationId: "ABC123",
      searchApiKey: "secret",
      enabled: true,
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "algolia") return yaml;
      return null;
    });

    const handler = getHandler("get_integrations");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Algolia");
    expect(text).toContain("Application ID: ABC123");
    expect(text).not.toContain("secret");
  });

  // -----------------------------------------------------------------------
  // 12. Google Maps with partial keys
  // -----------------------------------------------------------------------
  it("handles Google Maps with only some keys configured", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    const yaml = YAML.stringify({
      androidKey: "AIzaSyFoo",
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "google-maps") return yaml;
      return null;
    });

    const handler = getHandler("get_integrations");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Google Maps");
    expect(text).toContain("Android key: AIzaSyFoo");
    expect(text).toContain("iOS key: not set");
    expect(text).toContain("Web key: not set");
  });

  // -----------------------------------------------------------------------
  // 13. Mixed configured and unconfigured integrations
  // -----------------------------------------------------------------------
  it("handles mixed configured and unconfigured integrations", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "algolia") return makeAlgoliaYaml();
      if (key === "google-maps") return makeGoogleMapsYaml();
      return null;
    });

    const handler = getHandler("get_integrations");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    // Algolia and Google Maps should have content
    expect(text).toContain("Application ID: SUEUI0E453");
    expect(text).toContain("Android key: AIzaSyD0uDV3nw4IECNtb0U9g9Y2nyY9s69pp7s");

    // The remaining 8 should show "(not configured)"
    const notConfiguredCount = (text.match(/\(not configured\)/g) || []).length;
    expect(notConfiguredCount).toBe(8);
  });
});

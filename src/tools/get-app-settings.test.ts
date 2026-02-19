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
import { registerGetAppSettingsTool } from "./get-app-settings.js";
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

function makeAuthYaml(overrides: Record<string, unknown> = {}) {
  return YAML.stringify({
    active: true,
    firebaseConfigFileInfos: [{ something: true }],
    ...overrides,
  });
}

function makeAppDetailsYaml(overrides: Record<string, unknown> = {}) {
  return YAML.stringify({
    name: "MyTestApp",
    authPageInfo: {
      homePageNodeKeyRef: { key: "Scaffold_home" },
      signInPageNodeKeyRef: { key: "Scaffold_login" },
    },
    ...overrides,
  });
}

function makePushNotificationsYaml(overrides: Record<string, unknown> = {}) {
  return YAML.stringify({
    enabled: true,
    allowScheduledNotifications: false,
    autoPromptUsersForNotificationsPermission: true,
    lastNotificationSent: {
      notificationTitle: "Welcome to perkspass",
      notificationText: "Enjoy your discounts",
      status: "succeeded",
    },
    ...overrides,
  });
}

function makeMobileDeploymentYaml(overrides: Record<string, unknown> = {}) {
  return YAML.stringify({
    codemagicSettingsMap: {
      PROD: {
        appStoreSettings: {
          ascKeyId: "AKUAKF2ZCH",
          ascIssuerId: "57e34d27-22ff-47c3-a187-a2cf6b1807b7",
          ascPrivateKey: "-----BEGIN PRIVATE KEY-----\nSECRET...",
          ascAppId: "6466313325",
        },
        buildVersion: {
          buildVersion: "1.1.8",
          buildNumber: 110,
          lastSubmitted: "1.0.99+96",
        },
        playStoreSettings: {
          playTrack: "INTERNAL",
        },
      },
    },
    ...overrides,
  });
}

function makeWebPublishingYaml(overrides: Record<string, unknown> = {}) {
  return YAML.stringify({
    webSettings: {
      PROD: {
        seoDescription: "Idaho's #1 Discount Pass",
        pageTitle: "GoldPass",
        orientation: "PORTRAIT_PRIMARY",
      },
    },
    ...overrides,
  });
}

function makePageYaml(name: string) {
  return `name: ${name}\nsomeOtherField: value`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("get_app_settings handler", () => {
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockServer();
    registerGetAppSettingsTool(mock.server as any);
    getHandler = mock.getHandler;
  });

  // -----------------------------------------------------------------------
  // 1. Registers with correct tool name
  // -----------------------------------------------------------------------
  it("registers with correct tool name 'get_app_settings'", () => {
    expect(() => getHandler("get_app_settings")).not.toThrow();
  });

  // -----------------------------------------------------------------------
  // 2. Returns "No cache found" error when cacheMeta returns null
  // -----------------------------------------------------------------------
  it("returns 'No cache found' error when cacheMeta returns null", async () => {
    mockedCacheMeta.mockResolvedValue(null);

    const handler = getHandler("get_app_settings");
    const result = await handler({ projectId: "proj-no-cache" });

    expect(result.content[0].text).toContain("No cache found");
    expect(result.content[0].text).toContain("proj-no-cache");
    expect(result.content[0].text).toContain("sync_project");
  });

  // -----------------------------------------------------------------------
  // 3. Authentication section — active with Firebase provider
  // -----------------------------------------------------------------------
  it("shows Authentication as active with Firebase provider", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "authentication") return makeAuthYaml();
      if (key === "app-details") return makeAppDetailsYaml();
      if (key === "page/id-Scaffold_home") return makePageYaml("Dashboard");
      if (key === "page/id-Scaffold_login") return makePageYaml("LoginPage");
      return null;
    });

    const handler = getHandler("get_app_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("# App Settings");
    expect(text).toContain("## Authentication");
    expect(text).toContain("Status: Active");
    expect(text).toContain("Provider: Firebase");
    expect(text).toContain("Home page: Dashboard (Scaffold_home)");
    expect(text).toContain("Sign-in page: LoginPage (Scaffold_login)");
  });

  // -----------------------------------------------------------------------
  // 4. Authentication section — active with Supabase provider
  // -----------------------------------------------------------------------
  it("shows Authentication as active with Supabase provider", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "authentication") {
        return YAML.stringify({
          active: true,
          supabase: { url: "https://example.supabase.co" },
        });
      }
      return null;
    });

    const handler = getHandler("get_app_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("Status: Active");
    expect(text).toContain("Provider: Supabase");
  });

  // -----------------------------------------------------------------------
  // 5. Authentication section — inactive
  // -----------------------------------------------------------------------
  it("shows Authentication as inactive when active is false", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "authentication") return makeAuthYaml({ active: false });
      return null;
    });

    const handler = getHandler("get_app_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Authentication");
    expect(text).toContain("Status: Inactive");
    expect(text).not.toContain("Provider:");
  });

  // -----------------------------------------------------------------------
  // 6. Authentication section — falls back to scaffold ID when page name unresolvable
  // -----------------------------------------------------------------------
  it("falls back to scaffold ID when auth page name cannot be resolved", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "authentication") return makeAuthYaml();
      if (key === "app-details") return makeAppDetailsYaml();
      // page cache returns null — can't resolve names
      return null;
    });

    const handler = getHandler("get_app_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("Home page: Scaffold_home (Scaffold_home)");
    expect(text).toContain("Sign-in page: Scaffold_login (Scaffold_login)");
  });

  // -----------------------------------------------------------------------
  // 7. Push Notifications section — fully populated
  // -----------------------------------------------------------------------
  it("shows Push Notifications with all fields", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "push-notifications") return makePushNotificationsYaml();
      return null;
    });

    const handler = getHandler("get_app_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Push Notifications");
    expect(text).toContain("Enabled: Yes");
    expect(text).toContain("Scheduled notifications: No");
    expect(text).toContain("Auto-prompt permission: Yes");
    expect(text).toContain("Last notification: \"Welcome to perkspass\" (succeeded)");
  });

  // -----------------------------------------------------------------------
  // 8. Push Notifications section — disabled
  // -----------------------------------------------------------------------
  it("shows Push Notifications as disabled", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "push-notifications") {
        return YAML.stringify({ enabled: false });
      }
      return null;
    });

    const handler = getHandler("get_app_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Push Notifications");
    expect(text).toContain("Enabled: No");
  });

  // -----------------------------------------------------------------------
  // 9. Push Notifications section — missing (not configured)
  // -----------------------------------------------------------------------
  it("shows Push Notifications as '(not configured)' when missing", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());
    mockedCacheRead.mockResolvedValue(null);

    const handler = getHandler("get_app_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Push Notifications");
    expect(text).toContain("(not configured)");
  });

  // -----------------------------------------------------------------------
  // 10. Mobile Deployment — fully populated, PROD env
  // -----------------------------------------------------------------------
  it("shows Mobile Deployment with build version, stores, no private keys", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "mobile-deployment") return makeMobileDeploymentYaml();
      return null;
    });

    const handler = getHandler("get_app_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Mobile Deployment");
    expect(text).toContain("Environment: PROD");
    expect(text).toContain("Version: 1.1.8");
    expect(text).toContain("Build number: 110");
    expect(text).toContain("Last submitted: 1.0.99+96");
    expect(text).toContain("Play Store track: INTERNAL");
    expect(text).toContain("App Store ID: 6466313325");

    // CRITICAL: must NOT output private key
    expect(text).not.toContain("PRIVATE KEY");
    expect(text).not.toContain("ascPrivateKey");
    expect(text).not.toContain("SECRET");
  });

  // -----------------------------------------------------------------------
  // 11. Mobile Deployment — falls back to first env key when PROD not present
  // -----------------------------------------------------------------------
  it("falls back to first env key when PROD not present in mobile deployment", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    const yaml = YAML.stringify({
      codemagicSettingsMap: {
        STAGING: {
          buildVersion: {
            buildVersion: "0.5.0",
            buildNumber: 42,
            lastSubmitted: "0.4.0+10",
          },
          playStoreSettings: {
            playTrack: "ALPHA",
          },
        },
      },
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "mobile-deployment") return yaml;
      return null;
    });

    const handler = getHandler("get_app_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("Environment: STAGING");
    expect(text).toContain("Version: 0.5.0");
    expect(text).toContain("Build number: 42");
    expect(text).toContain("Play Store track: ALPHA");
  });

  // -----------------------------------------------------------------------
  // 12. Mobile Deployment — missing (not configured)
  // -----------------------------------------------------------------------
  it("shows Mobile Deployment as '(not configured)' when missing", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());
    mockedCacheRead.mockResolvedValue(null);

    const handler = getHandler("get_app_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Mobile Deployment");
    expect(text).toContain("(not configured)");
  });

  // -----------------------------------------------------------------------
  // 13. Web Deployment — fully populated, PROD env
  // -----------------------------------------------------------------------
  it("shows Web Deployment with page title, SEO, orientation", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "web-publishing") return makeWebPublishingYaml();
      return null;
    });

    const handler = getHandler("get_app_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Web Deployment");
    expect(text).toContain("Environment: PROD");
    expect(text).toContain("Page title: GoldPass");
    expect(text).toContain("SEO description: Idaho's #1 Discount Pass");
    expect(text).toContain("Orientation: PORTRAIT_PRIMARY");
  });

  // -----------------------------------------------------------------------
  // 14. Web Deployment — falls back to first env key when PROD not present
  // -----------------------------------------------------------------------
  it("falls back to first env key when PROD not present in web deployment", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    const yaml = YAML.stringify({
      webSettings: {
        DEV: {
          pageTitle: "DevApp",
          seoDescription: "A dev app",
          orientation: "LANDSCAPE",
        },
      },
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "web-publishing") return yaml;
      return null;
    });

    const handler = getHandler("get_app_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("Environment: DEV");
    expect(text).toContain("Page title: DevApp");
    expect(text).toContain("SEO description: A dev app");
    expect(text).toContain("Orientation: LANDSCAPE");
  });

  // -----------------------------------------------------------------------
  // 15. Web Deployment — missing (not configured)
  // -----------------------------------------------------------------------
  it("shows Web Deployment as '(not configured)' when missing", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());
    mockedCacheRead.mockResolvedValue(null);

    const handler = getHandler("get_app_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Web Deployment");
    expect(text).toContain("(not configured)");
  });

  // -----------------------------------------------------------------------
  // 16. All sections present
  // -----------------------------------------------------------------------
  it("returns all 4 sections when all data is present", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "authentication") return makeAuthYaml();
      if (key === "app-details") return makeAppDetailsYaml();
      if (key === "push-notifications") return makePushNotificationsYaml();
      if (key === "mobile-deployment") return makeMobileDeploymentYaml();
      if (key === "web-publishing") return makeWebPublishingYaml();
      if (key === "page/id-Scaffold_home") return makePageYaml("Dashboard");
      if (key === "page/id-Scaffold_login") return makePageYaml("LoginPage");
      return null;
    });

    const handler = getHandler("get_app_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("# App Settings");
    expect(text).toContain("## Authentication");
    expect(text).toContain("## Push Notifications");
    expect(text).toContain("## Mobile Deployment");
    expect(text).toContain("## Web Deployment");

    // Spot-check each section has data
    expect(text).toContain("Provider: Firebase");
    expect(text).toContain("Enabled: Yes");
    expect(text).toContain("Version: 1.1.8");
    expect(text).toContain("Page title: GoldPass");
  });

  // -----------------------------------------------------------------------
  // 17. All sections show "(not configured)" when nothing cached
  // -----------------------------------------------------------------------
  it("shows '(not configured)' for all sections when no YAML files are cached", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());
    mockedCacheRead.mockResolvedValue(null);

    const handler = getHandler("get_app_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("# App Settings");
    expect(text).toContain("## Authentication");
    expect(text).toContain("## Push Notifications");
    expect(text).toContain("## Mobile Deployment");
    expect(text).toContain("## Web Deployment");

    // All sections should show not configured (auth shows "Inactive" not "not configured")
    const notConfiguredCount = (text.match(/\(not configured\)/g) || []).length;
    expect(notConfiguredCount).toBe(3); // Push, Mobile, Web
  });

  // -----------------------------------------------------------------------
  // 18. Push notifications without lastNotificationSent
  // -----------------------------------------------------------------------
  it("handles push notifications without lastNotificationSent", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "push-notifications") {
        return YAML.stringify({
          enabled: true,
          allowScheduledNotifications: true,
          autoPromptUsersForNotificationsPermission: false,
        });
      }
      return null;
    });

    const handler = getHandler("get_app_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("Enabled: Yes");
    expect(text).toContain("Scheduled notifications: Yes");
    expect(text).toContain("Auto-prompt permission: No");
    expect(text).not.toContain("Last notification:");
  });

  // -----------------------------------------------------------------------
  // 19. Mobile deployment without App Store settings
  // -----------------------------------------------------------------------
  it("handles mobile deployment without App Store settings", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    const yaml = YAML.stringify({
      codemagicSettingsMap: {
        PROD: {
          buildVersion: {
            buildVersion: "2.0.0",
            buildNumber: 200,
          },
          playStoreSettings: {
            playTrack: "PRODUCTION",
          },
        },
      },
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "mobile-deployment") return yaml;
      return null;
    });

    const handler = getHandler("get_app_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("Version: 2.0.0");
    expect(text).toContain("Build number: 200");
    expect(text).toContain("Play Store track: PRODUCTION");
    expect(text).not.toContain("App Store ID:");
  });

  // -----------------------------------------------------------------------
  // 20. Authentication — no authPageInfo in app-details
  // -----------------------------------------------------------------------
  it("handles missing authPageInfo in app-details", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "authentication") return makeAuthYaml();
      if (key === "app-details") {
        return YAML.stringify({ name: "MyApp" }); // No authPageInfo
      }
      return null;
    });

    const handler = getHandler("get_app_settings");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Authentication");
    expect(text).toContain("Status: Active");
    expect(text).toContain("Provider: Firebase");
    // Should not crash or show undefined
    expect(text).not.toContain("undefined");
    expect(text).not.toContain("Home page:");
    expect(text).not.toContain("Sign-in page:");
  });
});

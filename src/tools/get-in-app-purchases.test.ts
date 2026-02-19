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
import { registerGetInAppPurchasesTool } from "./get-in-app-purchases.js";
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("get_in_app_purchases handler", () => {
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockServer();
    registerGetInAppPurchasesTool(mock.server as any);
    getHandler = mock.getHandler;
  });

  // -----------------------------------------------------------------------
  // 1. Registers with correct tool name
  // -----------------------------------------------------------------------
  it("registers with correct tool name 'get_in_app_purchases'", () => {
    expect(() => getHandler("get_in_app_purchases")).not.toThrow();
  });

  // -----------------------------------------------------------------------
  // 2. Returns "No cache found" error when cacheMeta returns null
  // -----------------------------------------------------------------------
  it("returns 'No cache found' error when cacheMeta returns null", async () => {
    mockedCacheMeta.mockResolvedValue(null);

    const handler = getHandler("get_in_app_purchases");
    const result = await handler({ projectId: "proj-no-cache" });

    expect(result.content[0].text).toContain("No cache found");
    expect(result.content[0].text).toContain("proj-no-cache");
    expect(result.content[0].text).toContain("sync_project");
  });

  // -----------------------------------------------------------------------
  // 3. Shows "(not configured)" for all providers when none exist
  // -----------------------------------------------------------------------
  it("shows '(not configured)' for all providers when no YAML files are cached", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());
    mockedCacheRead.mockResolvedValue(null);

    const handler = getHandler("get_in_app_purchases");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("# In-App Purchases & Subscriptions");
    expect(text).toContain("## Stripe");
    expect(text).toContain("## Braintree");
    expect(text).toContain("## RevenueCat");
    expect(text).toContain("## Razorpay");

    const notConfiguredCount = (text.match(/\(not configured\)/g) || []).length;
    expect(notConfiguredCount).toBe(4);
  });

  // -----------------------------------------------------------------------
  // 4. Shows RevenueCat enabled status
  // -----------------------------------------------------------------------
  it("shows RevenueCat enabled status when cached", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "revenue-cat") return YAML.stringify({ enabled: true });
      return null;
    });

    const handler = getHandler("get_in_app_purchases");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## RevenueCat");
    expect(text).toContain("Enabled: Yes");
  });

  // -----------------------------------------------------------------------
  // 5. Shows RevenueCat disabled status
  // -----------------------------------------------------------------------
  it("shows RevenueCat disabled when enabled is false", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "revenue-cat") return YAML.stringify({ enabled: false });
      return null;
    });

    const handler = getHandler("get_in_app_purchases");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## RevenueCat");
    expect(text).toContain("Enabled: No");
  });

  // -----------------------------------------------------------------------
  // 6. Shows Stripe with enabled and additional config fields
  // -----------------------------------------------------------------------
  it("shows Stripe with enabled status and extra config fields", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "stripe")
        return YAML.stringify({
          enabled: true,
          publishableKey: "pk_test_abc123",
          merchantId: "merchant_xyz",
        });
      return null;
    });

    const handler = getHandler("get_in_app_purchases");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Stripe");
    expect(text).toContain("Enabled: Yes");
    expect(text).toContain("publishableKey: pk_test_abc123");
    expect(text).toContain("merchantId: merchant_xyz");
  });

  // -----------------------------------------------------------------------
  // 7. Shows Braintree with enabled status and additional config
  // -----------------------------------------------------------------------
  it("shows Braintree with enabled status and extra config fields", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "braintree")
        return YAML.stringify({
          enabled: true,
          tokenizationKey: "sandbox_abc",
        });
      return null;
    });

    const handler = getHandler("get_in_app_purchases");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Braintree");
    expect(text).toContain("Enabled: Yes");
    expect(text).toContain("tokenizationKey: sandbox_abc");
  });

  // -----------------------------------------------------------------------
  // 8. Shows Razorpay with enabled status
  // -----------------------------------------------------------------------
  it("shows Razorpay with enabled status", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "razorpay")
        return YAML.stringify({
          enabled: true,
          keyId: "rzp_test_123",
        });
      return null;
    });

    const handler = getHandler("get_in_app_purchases");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Razorpay");
    expect(text).toContain("Enabled: Yes");
    expect(text).toContain("keyId: rzp_test_123");
  });

  // -----------------------------------------------------------------------
  // 9. Shows all providers when all are configured
  // -----------------------------------------------------------------------
  it("shows all providers when all are configured", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "stripe") return YAML.stringify({ enabled: true });
      if (key === "braintree") return YAML.stringify({ enabled: false });
      if (key === "revenue-cat") return YAML.stringify({ enabled: true });
      if (key === "razorpay") return YAML.stringify({ enabled: true });
      return null;
    });

    const handler = getHandler("get_in_app_purchases");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("# In-App Purchases & Subscriptions");
    expect(text).toContain("## Stripe");
    expect(text).toContain("## Braintree");
    expect(text).toContain("## RevenueCat");
    expect(text).toContain("## Razorpay");

    // No "(not configured)" should appear since all are present
    expect(text).not.toContain("(not configured)");
  });

  // -----------------------------------------------------------------------
  // 10. Skips complex nested objects in extra config fields
  // -----------------------------------------------------------------------
  it("skips complex nested objects in extra config fields", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "stripe")
        return YAML.stringify({
          enabled: true,
          publishableKey: "pk_test_abc",
          nestedConfig: { deep: { value: "should-not-appear" } },
          simpleField: "visible",
        });
      return null;
    });

    const handler = getHandler("get_in_app_purchases");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("publishableKey: pk_test_abc");
    expect(text).toContain("simpleField: visible");
    // Nested object should be skipped
    expect(text).not.toContain("should-not-appear");
  });

  // -----------------------------------------------------------------------
  // 11. Handles YAML with no enabled field (defaults to showing it's absent)
  // -----------------------------------------------------------------------
  it("handles YAML with no enabled field gracefully", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "stripe")
        return YAML.stringify({ publishableKey: "pk_test_xyz" });
      return null;
    });

    const handler = getHandler("get_in_app_purchases");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Stripe");
    expect(text).toContain("Enabled: No");
    expect(text).toContain("publishableKey: pk_test_xyz");
  });
});

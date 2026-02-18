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

vi.mock("../utils/resolve-data-type.js", () => ({
  resolveDataType: vi.fn(
    (dt: Record<string, unknown>) => (dt.scalarType as string) || "unknown"
  ),
}));

import { createMockServer } from "../__helpers__/mock-server.js";
import { registerGetAppStateTool } from "./get-app-state.js";
import { cacheRead, cacheMeta } from "../utils/cache.js";
import { resolveDataType } from "../utils/resolve-data-type.js";
import YAML from "yaml";

const mockedCacheRead = vi.mocked(cacheRead);
const mockedCacheMeta = vi.mocked(cacheMeta);
const mockedResolveDataType = vi.mocked(resolveDataType);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMeta() {
  return { lastSyncedAt: "2025-01-01", fileCount: 20, syncMethod: "bulk" as const };
}

function makeAppStateYaml(fields: unknown[], securePersistedValues = false) {
  return YAML.stringify({ fields, securePersistedValues });
}

function makeAppConstantsYaml(fields: unknown[]) {
  return YAML.stringify({ fields });
}

function makeEnvSettingsYaml(
  currentEnvironment: Record<string, unknown> | undefined,
  environmentValues: unknown[]
) {
  const doc: Record<string, unknown> = { environmentValues };
  if (currentEnvironment) doc.currentEnvironment = currentEnvironment;
  return YAML.stringify(doc);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("get_app_state handler", () => {
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockServer();
    registerGetAppStateTool(mock.server as any);
    getHandler = mock.getHandler;
  });

  // -----------------------------------------------------------------------
  // 1. Registers with correct tool name
  // -----------------------------------------------------------------------
  it("registers with correct tool name 'get_app_state'", () => {
    expect(() => getHandler("get_app_state")).not.toThrow();
  });

  // -----------------------------------------------------------------------
  // 2. Returns "No cache found" error when cacheMeta returns null
  // -----------------------------------------------------------------------
  it("returns 'No cache found' error when cacheMeta returns null", async () => {
    mockedCacheMeta.mockResolvedValue(null);

    const handler = getHandler("get_app_state");
    const result = await handler({ projectId: "proj-no-cache" });

    expect(result.content[0].text).toContain("No cache found");
    expect(result.content[0].text).toContain("proj-no-cache");
    expect(result.content[0].text).toContain("sync_project");
  });

  // -----------------------------------------------------------------------
  // 3. Returns state variables with name, type, persisted flag, defaults
  // -----------------------------------------------------------------------
  it("returns state variables with name, type, persisted flag, and defaults", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    const yaml = makeAppStateYaml(
      [
        {
          parameter: {
            identifier: { name: "counter" },
            dataType: { scalarType: "Integer" },
          },
          persisted: true,
          serializedDefaultValue: ["0"],
        },
        {
          parameter: {
            identifier: { name: "username" },
            dataType: { scalarType: "String" },
          },
          persisted: false,
          serializedDefaultValue: [],
        },
      ],
      true
    );

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "app-state") return yaml;
      return null;
    });

    const handler = getHandler("get_app_state");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## State Variables");
    expect(text).toContain("- counter: Integer (persisted) [default: \"0\"]");
    expect(text).toContain("- username: String");
    expect(text).not.toContain("username: String (persisted)");
    expect(text).toContain("Secure persisted values: Yes");
  });

  // -----------------------------------------------------------------------
  // 4. Returns constants with name, type, values
  // -----------------------------------------------------------------------
  it("returns constants with name, type, and values", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    const yaml = makeAppConstantsYaml([
      {
        parameter: {
          identifier: { name: "apiBaseUrl" },
          dataType: { scalarType: "String" },
        },
        serializedValue: ["https://api.example.com"],
      },
      {
        parameter: {
          identifier: { name: "maxRetries" },
          dataType: { scalarType: "Integer" },
        },
        serializedValue: ["3"],
      },
    ]);

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "app-constants") return yaml;
      return null;
    });

    const handler = getHandler("get_app_state");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Constants");
    expect(text).toContain('- apiBaseUrl: String = ["https://api.example.com"]');
    expect(text).toContain('- maxRetries: Integer = ["3"]');
  });

  // -----------------------------------------------------------------------
  // 5. Returns environment settings with current env, variable names, types,
  //    values (masked for private)
  // -----------------------------------------------------------------------
  it("returns environment settings with current env and masks private values", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    const yaml = makeEnvSettingsYaml(
      { name: "Production", key: "prod" },
      [
        {
          parameter: {
            identifier: { name: "apiKey" },
            dataType: { scalarType: "String" },
          },
          isPrivate: true,
          valuesMap: {
            prod: { serializedValue: "sk-secret-123" },
            dev: { serializedValue: "sk-dev-456" },
          },
        },
        {
          parameter: {
            identifier: { name: "baseUrl" },
            dataType: { scalarType: "String" },
          },
          isPrivate: false,
          valuesMap: {
            prod: { serializedValue: "https://api.prod.com" },
            dev: { serializedValue: "https://api.dev.com" },
          },
        },
      ]
    );

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "environment-settings") return yaml;
      return null;
    });

    const handler = getHandler("get_app_state");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("## Environment Settings");
    expect(text).toContain("Current: Production (prod)");

    // Private variable: name shown, values masked
    expect(text).toContain("- apiKey: String (private)");
    expect(text).toContain("prod: ****");
    expect(text).toContain("dev: ****");
    expect(text).not.toContain("sk-secret-123");
    expect(text).not.toContain("sk-dev-456");

    // Public variable: values shown
    expect(text).toContain("- baseUrl: String");
    expect(text).toContain("prod: https://api.prod.com");
    expect(text).toContain("dev: https://api.dev.com");
  });

  // -----------------------------------------------------------------------
  // 6. Returns all 3 sections together when all are present
  // -----------------------------------------------------------------------
  it("returns all 3 sections together when all YAML files are present", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    const stateYaml = makeAppStateYaml([
      {
        parameter: {
          identifier: { name: "isLoggedIn" },
          dataType: { scalarType: "Boolean" },
        },
        persisted: true,
        serializedDefaultValue: ["false"],
      },
    ]);

    const constantsYaml = makeAppConstantsYaml([
      {
        parameter: {
          identifier: { name: "appVersion" },
          dataType: { scalarType: "String" },
        },
        serializedValue: ["1.0.0"],
      },
    ]);

    const envYaml = makeEnvSettingsYaml(
      { name: "Development", key: "dev" },
      [
        {
          parameter: {
            identifier: { name: "debugMode" },
            dataType: { scalarType: "Boolean" },
          },
          isPrivate: false,
          valuesMap: {
            dev: { serializedValue: "true" },
          },
        },
      ]
    );

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "app-state") return stateYaml;
      if (key === "app-constants") return constantsYaml;
      if (key === "environment-settings") return envYaml;
      return null;
    });

    const handler = getHandler("get_app_state");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    // All three section headings present
    expect(text).toContain("# App State");
    expect(text).toContain("## State Variables");
    expect(text).toContain("## Constants");
    expect(text).toContain("## Environment Settings");

    // Spot-check content from each section
    expect(text).toContain("isLoggedIn: Boolean (persisted)");
    expect(text).toContain('appVersion: String = ["1.0.0"]');
    expect(text).toContain("Current: Development (dev)");
    expect(text).toContain("debugMode: Boolean");
  });

  // -----------------------------------------------------------------------
  // 7. Handles empty/missing YAML files gracefully
  // -----------------------------------------------------------------------
  it("handles missing YAML files gracefully (returns only header)", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    // All cacheRead calls return null — no YAML files present
    mockedCacheRead.mockResolvedValue(null);

    const handler = getHandler("get_app_state");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    // Should still have the heading
    expect(text).toContain("# App State");

    // Should NOT have any section headings
    expect(text).not.toContain("## State Variables");
    expect(text).not.toContain("## Constants");
    expect(text).not.toContain("## Environment Settings");
  });

  it("handles YAML files with empty fields arrays gracefully", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    const stateYaml = makeAppStateYaml([]);
    const constantsYaml = makeAppConstantsYaml([]);
    const envYaml = makeEnvSettingsYaml(undefined, []);

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "app-state") return stateYaml;
      if (key === "app-constants") return constantsYaml;
      if (key === "environment-settings") return envYaml;
      return null;
    });

    const handler = getHandler("get_app_state");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    // Section headings present, but no list items
    expect(text).toContain("## State Variables");
    expect(text).toContain("## Constants");
    expect(text).toContain("## Environment Settings");
    // No field entries (no leading "- " lines under sections)
    expect(text).toContain("Secure persisted values: No");
  });

  it("uses 'unknown' for fields missing parameter name", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    const yaml = makeAppStateYaml([
      {
        parameter: {
          dataType: { scalarType: "String" },
        },
        persisted: false,
      },
    ]);

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "app-state") return yaml;
      return null;
    });

    const handler = getHandler("get_app_state");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("- unknown: String");
  });
});

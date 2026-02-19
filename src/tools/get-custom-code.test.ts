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

vi.mock("../utils/batch-process.js", () => ({
  batchProcess: vi.fn(async (items: unknown[], _size: number, fn: (item: unknown) => Promise<unknown>) => {
    const results: unknown[] = [];
    for (const item of items) results.push(await fn(item));
    return results;
  }),
}));

vi.mock("../utils/resolve-data-type.js", () => ({
  resolveDataType: vi.fn((dt: Record<string, unknown>) => (dt.scalarType as string) || "unknown"),
}));

import { createMockServer } from "../__helpers__/mock-server.js";
import { registerGetCustomCodeTool } from "./get-custom-code.js";
import { cacheRead, cacheMeta, listCachedKeys } from "../utils/cache.js";

const mockedCacheRead = vi.mocked(cacheRead);
const mockedCacheMeta = vi.mocked(cacheMeta);
const mockedListCachedKeys = vi.mocked(listCachedKeys);

// ---------------------------------------------------------------------------
// YAML fixtures
// ---------------------------------------------------------------------------

const ACTION_YAML = `identifier:
  name: myAction
  key: abc123
arguments:
  - identifier:
      name: arg1
    dataType:
      scalarType: String
      nonNullable: true
returnParameter:
  dataType:
    scalarType: Boolean
includeContext: true`;

const FUNCTION_YAML = `identifier:
  name: myFunc
  key: def456
arguments:
  - identifier:
      name: input
    dataType:
      scalarType: String
returnParameter:
  dataType:
    scalarType: String`;

const WIDGET_YAML = `identifier:
  name: MyWidget
  key: ghi789
parameters:
  - identifier:
      name: title
    dataType:
      scalarType: String
      nonNullable: true
description: A widget`;

const AGENT_YAML = `identifier:
  name: myAgent
name: My Agent
status: ACTIVE
aiModel:
  provider: OPEN_AI
  model: gpt-4
requestOptions:
  requestTypes:
    - TEXT
responseOptions:
  responseType: TEXT
description: A helper`;

const APP_ACTION_YAML = `identifier:
  name: checkUpdateBlock
  key: ld3jo3
actions:
  rootAction:
    key: dmm3dw7g
    action:
      customAction:
        customActionIdentifier:
          name: checkAppUpdateStatus
          key: zjg1l
description: "Checks for app updates"`;

const CUSTOM_FILE_YAML = `type: SOME_TYPE
isUnlocked: false
actions:
  - type: INITIAL_ACTION
    identifier:
      name: doSomething
      key: abc12
  - type: FINAL_ACTION
    identifier:
      name: doOther
      key: def34
  - type: INITIAL_ACTION
    identifier:
      key: ghi56`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("get_custom_code handler", () => {
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockServer();
    registerGetCustomCodeTool(mock.server as any);
    getHandler = mock.getHandler;
  });

  it("registers with the correct tool name", () => {
    expect(() => getHandler("get_custom_code")).not.toThrow();
  });

  it("returns 'No cache found' error when cacheMeta returns null", async () => {
    mockedCacheMeta.mockResolvedValue(null);

    const handler = getHandler("get_custom_code");
    const result = await handler({ projectId: "proj-1" });

    expect(result.content[0].text).toContain("No cache found");
    expect(result.content[0].text).toContain("sync_project");
  });

  it("returns 'No custom code found' when all categories are empty", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });
    mockedListCachedKeys.mockResolvedValue([]);

    const handler = getHandler("get_custom_code");
    const result = await handler({ projectId: "proj-1", type: "all" });

    expect(result.content[0].text).toBe("No custom code found in cache.");
  });

  it("parses custom actions (name, args, returnType, includeContext flag)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedListCachedKeys.mockImplementation(async (_pid, prefix) => {
      if (prefix === "custom-actions/id-") return ["custom-actions/id-abc123"];
      return [];
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "custom-actions/id-abc123") return ACTION_YAML;
      return null;
    });

    const handler = getHandler("get_custom_code");
    const result = await handler({ projectId: "proj-1", type: "actions" });
    const text = result.content[0].text;

    expect(text).toContain("## Custom Actions (1)");
    expect(text).toContain("### myAction");
    expect(text).toContain("arg1: String (required)");
    expect(text).toContain("Returns: Boolean?");
    expect(text).toContain("Context: Yes");
  });

  it("parses custom functions (name, args, returnType)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedListCachedKeys.mockImplementation(async (_pid, prefix) => {
      if (prefix === "custom-functions/id-") return ["custom-functions/id-def456"];
      return [];
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "custom-functions/id-def456") return FUNCTION_YAML;
      return null;
    });

    const handler = getHandler("get_custom_code");
    const result = await handler({ projectId: "proj-1", type: "functions" });
    const text = result.content[0].text;

    expect(text).toContain("## Custom Functions (1)");
    expect(text).toContain("### myFunc");
    expect(text).toContain("input: String");
    expect(text).toContain("Returns: String?");
  });

  it("parses custom widgets (name, params)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedListCachedKeys.mockImplementation(async (_pid, prefix) => {
      if (prefix === "custom-widgets/id-") return ["custom-widgets/id-ghi789"];
      return [];
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "custom-widgets/id-ghi789") return WIDGET_YAML;
      return null;
    });

    const handler = getHandler("get_custom_code");
    const result = await handler({ projectId: "proj-1", type: "widgets" });
    const text = result.content[0].text;

    expect(text).toContain("## Custom Widgets (1)");
    expect(text).toContain("### MyWidget");
    expect(text).toContain("title: String (required)");
  });

  it("parses AI agents (displayName, status, provider, model)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedListCachedKeys.mockImplementation(async (_pid, prefix) => {
      if (prefix === "agent/id-") return ["agent/id-agent1"];
      return [];
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "agent/id-agent1") return AGENT_YAML;
      return null;
    });

    const handler = getHandler("get_custom_code");
    const result = await handler({ projectId: "proj-1", type: "agents" });
    const text = result.content[0].text;

    expect(text).toContain("## AI Agents (1)");
    expect(text).toContain("### My Agent [ACTIVE]");
    expect(text).toContain("Provider: OPEN_AI (gpt-4)");
    expect(text).toContain("Input: TEXT");
    expect(text).toContain("Output: TEXT");
    expect(text).toContain("Description: A helper");
  });

  it("type filter works (type='actions' only shows actions section)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedListCachedKeys.mockImplementation(async (_pid, prefix) => {
      if (prefix === "custom-actions/id-") return ["custom-actions/id-abc123"];
      if (prefix === "custom-functions/id-") return ["custom-functions/id-def456"];
      return [];
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "custom-actions/id-abc123") return ACTION_YAML;
      if (key === "custom-functions/id-def456") return FUNCTION_YAML;
      return null;
    });

    const handler = getHandler("get_custom_code");
    const result = await handler({ projectId: "proj-1", type: "actions" });
    const text = result.content[0].text;

    expect(text).toContain("## Custom Actions (1)");
    expect(text).not.toContain("## Custom Functions");
    expect(text).not.toContain("## Custom Widgets");
    expect(text).not.toContain("## AI Agents");
  });

  it("name filter works (case-insensitive exact match)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedListCachedKeys.mockImplementation(async (_pid, prefix) => {
      if (prefix === "custom-actions/id-") return ["custom-actions/id-abc123"];
      if (prefix === "custom-functions/id-") return ["custom-functions/id-def456"];
      return [];
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "custom-actions/id-abc123") return ACTION_YAML;
      if (key === "custom-functions/id-def456") return FUNCTION_YAML;
      return null;
    });

    const handler = getHandler("get_custom_code");
    // Search for "MYACTION" — should match "myAction" case-insensitively
    const result = await handler({ projectId: "proj-1", type: "all", name: "MYACTION" });
    const text = result.content[0].text;

    expect(text).toContain("### myAction");
    expect(text).not.toContain("### myFunc");
  });

  it("includeCode flag reads Dart code sub-files", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedListCachedKeys.mockImplementation(async (_pid, prefix) => {
      if (prefix === "custom-actions/id-") return ["custom-actions/id-abc123"];
      return [];
    });

    const dartCode = "Future<bool> myAction(String arg1) async {\n  return true;\n}";

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "custom-actions/id-abc123") return ACTION_YAML;
      if (key === "custom-actions/id-abc123/action-code.dart") return dartCode;
      return null;
    });

    const handler = getHandler("get_custom_code");
    const result = await handler({
      projectId: "proj-1",
      type: "actions",
      includeCode: true,
    });
    const text = result.content[0].text;

    expect(text).toContain("```dart");
    expect(text).toContain("Future<bool> myAction");
    expect(text).toContain("```");
  });

  it("parses app action components (name, root action type)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedListCachedKeys.mockImplementation(async (_pid, prefix) => {
      if (prefix === "app-action-components/id-") return ["app-action-components/id-ld3jo3"];
      return [];
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "app-action-components/id-ld3jo3") return APP_ACTION_YAML;
      return null;
    });

    const handler = getHandler("get_custom_code");
    const result = await handler({ projectId: "proj-1", type: "app-actions" });
    const text = result.content[0].text;

    expect(text).toContain("## App Action Components (1)");
    expect(text).toContain("### checkUpdateBlock");
    expect(text).toContain("Key: ld3jo3");
    expect(text).toContain("Root action: customAction(checkAppUpdateStatus)");
    expect(text).toContain('Description: "Checks for app updates"');
  });

  it("parses custom files (type, action counts, excludes MAIN)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedListCachedKeys.mockImplementation(async (_pid, prefix) => {
      if (prefix === "custom-file/id-") return ["custom-file/id-MAIN", "custom-file/id-OTHER"];
      return [];
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "custom-file/id-OTHER") return CUSTOM_FILE_YAML;
      return null;
    });

    const handler = getHandler("get_custom_code");
    const result = await handler({ projectId: "proj-1", type: "custom-files" });
    const text = result.content[0].text;

    expect(text).toContain("## Custom Files (1)");
    expect(text).not.toContain("MAIN");
    expect(text).toContain("Type: SOME_TYPE");
    expect(text).toContain("Actions: 2 initial, 1 final");
  });

  it("type='all' includes app-actions and custom-files categories", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedListCachedKeys.mockImplementation(async (_pid, prefix) => {
      if (prefix === "custom-actions/id-") return ["custom-actions/id-abc123"];
      if (prefix === "app-action-components/id-") return ["app-action-components/id-ld3jo3"];
      if (prefix === "custom-file/id-") return ["custom-file/id-OTHER"];
      return [];
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "custom-actions/id-abc123") return ACTION_YAML;
      if (key === "app-action-components/id-ld3jo3") return APP_ACTION_YAML;
      if (key === "custom-file/id-OTHER") return CUSTOM_FILE_YAML;
      return null;
    });

    const handler = getHandler("get_custom_code");
    const result = await handler({ projectId: "proj-1", type: "all" });
    const text = result.content[0].text;

    expect(text).toContain("## Custom Actions (1)");
    expect(text).toContain("## App Action Components (1)");
    expect(text).toContain("## Custom Files (1)");
  });
});

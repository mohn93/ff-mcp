import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the cache module BEFORE importing the module under test
vi.mock("../cache.js", () => ({
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

import { cacheRead, listCachedKeys } from "../cache.js";
import { summarizeTriggers } from "./action-summarizer.js";

const mockedCacheRead = vi.mocked(cacheRead);
const mockedListCachedKeys = vi.mocked(listCachedKeys);

const PROJECT_ID = "test-project";
const NODE_PREFIX =
  "page/id-Scaffold_abc/page-widget-tree-outline/node/id-Button_xyz";

beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// summarizeTriggers — integration tests using mocked cache
// ---------------------------------------------------------------------------
describe("summarizeTriggers", () => {
  it("returns empty array when no trigger files found", async () => {
    mockedListCachedKeys.mockResolvedValue([]);

    const result = await summarizeTriggers(PROJECT_ID, NODE_PREFIX);
    expect(result).toEqual([]);
    expect(mockedListCachedKeys).toHaveBeenCalledWith(
      PROJECT_ID,
      `${NODE_PREFIX}/trigger_actions/`
    );
  });

  it("reads trigger file, collects action keys, reads action files, and classifies actions", async () => {
    const triggerPrefix = `${NODE_PREFIX}/trigger_actions/`;
    const triggerFileKey = `${triggerPrefix}id-ON_TAP`;
    const actionFileKey = `${triggerFileKey}/action/id-action_001`;

    // listCachedKeys returns both the trigger file and its action sub-files
    mockedListCachedKeys.mockResolvedValue([
      triggerFileKey,
      actionFileKey,
    ]);

    // Trigger file YAML: has trigger type and rootAction referencing action_001
    mockedCacheRead.mockImplementation(async (_pid: string, key: string) => {
      if (key === triggerFileKey) {
        return [
          "trigger:",
          "  triggerType: ON_TAP",
          "rootAction:",
          "  action:",
          "    key: action_001",
        ].join("\n");
      }
      if (key === actionFileKey) {
        return [
          "navigate:",
          "  pageNodeKeyRef:",
          "    key: Scaffold_targetPage",
        ].join("\n");
      }
      return null;
    });

    const result = await summarizeTriggers(PROJECT_ID, NODE_PREFIX);
    expect(result).toHaveLength(1);
    expect(result[0].trigger).toBe("ON_TAP");
    expect(result[0].actions).toHaveLength(1);
    expect(result[0].actions[0]).toEqual({
      type: "navigate",
      detail: "to page",
    });
  });

  it("skips trigger files with no rootAction", async () => {
    const triggerPrefix = `${NODE_PREFIX}/trigger_actions/`;
    const triggerFileKey = `${triggerPrefix}id-ON_TAP`;

    mockedListCachedKeys.mockResolvedValue([triggerFileKey]);

    // Trigger file with no rootAction
    mockedCacheRead.mockImplementation(async (_pid: string, key: string) => {
      if (key === triggerFileKey) {
        return [
          "trigger:",
          "  triggerType: ON_TAP",
        ].join("\n");
      }
      return null;
    });

    const result = await summarizeTriggers(PROJECT_ID, NODE_PREFIX);
    expect(result).toEqual([]);
  });

  it("skips trigger files that cannot be parsed", async () => {
    const triggerPrefix = `${NODE_PREFIX}/trigger_actions/`;
    const triggerFileKey = `${triggerPrefix}id-ON_TAP`;

    mockedListCachedKeys.mockResolvedValue([triggerFileKey]);

    // Return invalid YAML
    mockedCacheRead.mockImplementation(async (_pid: string, key: string) => {
      if (key === triggerFileKey) {
        return ":::invalid yaml{{{";
      }
      return null;
    });

    const result = await summarizeTriggers(PROJECT_ID, NODE_PREFIX);
    expect(result).toEqual([]);
  });

  it("filters out terminate actions from results", async () => {
    const triggerPrefix = `${NODE_PREFIX}/trigger_actions/`;
    const triggerFileKey = `${triggerPrefix}id-ON_TAP`;
    const actionFileKey1 = `${triggerFileKey}/action/id-action_nav`;
    const actionFileKey2 = `${triggerFileKey}/action/id-action_term`;

    mockedListCachedKeys.mockResolvedValue([
      triggerFileKey,
      actionFileKey1,
      actionFileKey2,
    ]);

    mockedCacheRead.mockImplementation(async (_pid: string, key: string) => {
      if (key === triggerFileKey) {
        return [
          "trigger:",
          "  triggerType: ON_TAP",
          "rootAction:",
          "  action:",
          "    key: action_nav",
          "  followUpAction:",
          "    action:",
          "      key: action_term",
        ].join("\n");
      }
      if (key === actionFileKey1) {
        return "navigate:\n  isNavigateBack: true";
      }
      if (key === actionFileKey2) {
        return "terminate: true";
      }
      return null;
    });

    const result = await summarizeTriggers(PROJECT_ID, NODE_PREFIX);
    expect(result).toHaveLength(1);
    expect(result[0].actions).toHaveLength(1);
    expect(result[0].actions[0]).toEqual({
      type: "navigate",
      detail: "back",
    });
  });

  it("handles multiple triggers on the same node", async () => {
    const triggerPrefix = `${NODE_PREFIX}/trigger_actions/`;
    const tapTriggerKey = `${triggerPrefix}id-ON_TAP`;
    const longPressTriggerKey = `${triggerPrefix}id-ON_LONG_PRESS`;
    const tapActionKey = `${tapTriggerKey}/action/id-tap_action`;
    const longPressActionKey = `${longPressTriggerKey}/action/id-lp_action`;

    mockedListCachedKeys.mockResolvedValue([
      tapTriggerKey,
      tapActionKey,
      longPressTriggerKey,
      longPressActionKey,
    ]);

    mockedCacheRead.mockImplementation(async (_pid: string, key: string) => {
      if (key === tapTriggerKey) {
        return [
          "trigger:",
          "  triggerType: ON_TAP",
          "rootAction:",
          "  action:",
          "    key: tap_action",
        ].join("\n");
      }
      if (key === tapActionKey) {
        return "navigate:\n  pageNodeKeyRef:\n    key: Scaffold_page1";
      }
      if (key === longPressTriggerKey) {
        return [
          "trigger:",
          "  triggerType: ON_LONG_PRESS",
          "rootAction:",
          "  action:",
          "    key: lp_action",
        ].join("\n");
      }
      if (key === longPressActionKey) {
        return "copyToClipboard:\n  text: some text";
      }
      return null;
    });

    const result = await summarizeTriggers(PROJECT_ID, NODE_PREFIX);
    expect(result).toHaveLength(2);

    const tapTrigger = result.find((t) => t.trigger === "ON_TAP");
    const lpTrigger = result.find((t) => t.trigger === "ON_LONG_PRESS");

    expect(tapTrigger).toBeDefined();
    expect(tapTrigger!.actions).toEqual([
      { type: "navigate", detail: "to page" },
    ]);

    expect(lpTrigger).toBeDefined();
    expect(lpTrigger!.actions).toEqual([
      { type: "copyToClipboard", detail: "" },
    ]);
  });

  it("deduplicates action keys", async () => {
    const triggerPrefix = `${NODE_PREFIX}/trigger_actions/`;
    const triggerFileKey = `${triggerPrefix}id-ON_TAP`;
    const actionFileKey = `${triggerFileKey}/action/id-action_dup`;

    mockedListCachedKeys.mockResolvedValue([
      triggerFileKey,
      actionFileKey,
    ]);

    // rootAction references action_dup twice via a followUpAction chain
    mockedCacheRead.mockImplementation(async (_pid: string, key: string) => {
      if (key === triggerFileKey) {
        return [
          "trigger:",
          "  triggerType: ON_TAP",
          "rootAction:",
          "  action:",
          "    key: action_dup",
          "  followUpAction:",
          "    action:",
          "      key: action_dup",
        ].join("\n");
      }
      if (key === actionFileKey) {
        return "alertDialog:\n  title: Warning";
      }
      return null;
    });

    const result = await summarizeTriggers(PROJECT_ID, NODE_PREFIX);
    expect(result).toHaveLength(1);
    // Despite the key appearing twice, the action should only appear once
    expect(result[0].actions).toHaveLength(1);
    expect(result[0].actions[0]).toEqual({
      type: "alertDialog",
      detail: "",
    });
  });

  it("returns empty trigger when all actions are terminate", async () => {
    const triggerPrefix = `${NODE_PREFIX}/trigger_actions/`;
    const triggerFileKey = `${triggerPrefix}id-ON_TAP`;
    const actionFileKey = `${triggerFileKey}/action/id-action_only_term`;

    mockedListCachedKeys.mockResolvedValue([
      triggerFileKey,
      actionFileKey,
    ]);

    mockedCacheRead.mockImplementation(async (_pid: string, key: string) => {
      if (key === triggerFileKey) {
        return [
          "trigger:",
          "  triggerType: ON_TAP",
          "rootAction:",
          "  action:",
          "    key: action_only_term",
        ].join("\n");
      }
      if (key === actionFileKey) {
        return "terminate: true";
      }
      return null;
    });

    // When all actions are terminate, the trigger should have zero actions
    // and thus should NOT appear in results (actions.length > 0 guard)
    const result = await summarizeTriggers(PROJECT_ID, NODE_PREFIX);
    expect(result).toEqual([]);
  });

  it("handles trigger file that cacheRead returns null for", async () => {
    const triggerPrefix = `${NODE_PREFIX}/trigger_actions/`;
    const triggerFileKey = `${triggerPrefix}id-ON_TAP`;

    mockedListCachedKeys.mockResolvedValue([triggerFileKey]);

    // cacheRead returns null for the trigger file itself
    mockedCacheRead.mockResolvedValue(null);

    const result = await summarizeTriggers(PROJECT_ID, NODE_PREFIX);
    expect(result).toEqual([]);
  });

  it("handles action file that cacheRead returns null for", async () => {
    const triggerPrefix = `${NODE_PREFIX}/trigger_actions/`;
    const triggerFileKey = `${triggerPrefix}id-ON_TAP`;

    mockedListCachedKeys.mockResolvedValue([triggerFileKey]);

    mockedCacheRead.mockImplementation(async (_pid: string, key: string) => {
      if (key === triggerFileKey) {
        return [
          "trigger:",
          "  triggerType: ON_TAP",
          "rootAction:",
          "  action:",
          "    key: missing_action",
        ].join("\n");
      }
      // Action file not found
      return null;
    });

    // No action files readable -> no actions -> trigger not included
    const result = await summarizeTriggers(PROJECT_ID, NODE_PREFIX);
    expect(result).toEqual([]);
  });

  it("handles action file with invalid YAML by classifying as unknown", async () => {
    const triggerPrefix = `${NODE_PREFIX}/trigger_actions/`;
    const triggerFileKey = `${triggerPrefix}id-ON_TAP`;
    const actionFileKey = `${triggerFileKey}/action/id-bad_yaml_action`;

    mockedListCachedKeys.mockResolvedValue([
      triggerFileKey,
      actionFileKey,
    ]);

    mockedCacheRead.mockImplementation(async (_pid: string, key: string) => {
      if (key === triggerFileKey) {
        return [
          "trigger:",
          "  triggerType: ON_TAP",
          "rootAction:",
          "  action:",
          "    key: bad_yaml_action",
        ].join("\n");
      }
      if (key === actionFileKey) {
        return ":::invalid yaml{{{";
      }
      return null;
    });

    const result = await summarizeTriggers(PROJECT_ID, NODE_PREFIX);
    expect(result).toHaveLength(1);
    expect(result[0].actions).toHaveLength(1);
    expect(result[0].actions[0]).toEqual({
      type: "unknown",
      detail: "bad_yaml_action",
    });
  });

  it("excludes sub-path keys that look like nested dirs, not trigger files", async () => {
    const triggerPrefix = `${NODE_PREFIX}/trigger_actions/`;
    const triggerFileKey = `${triggerPrefix}id-ON_TAP`;
    const actionFileKey = `${triggerFileKey}/action/id-act_001`;
    // A nested path that should NOT be treated as a trigger def file
    const nestedKey = `${triggerPrefix}id-ON_TAP/action/id-act_001`;

    mockedListCachedKeys.mockResolvedValue([
      triggerFileKey,
      actionFileKey,
      nestedKey,
    ]);

    mockedCacheRead.mockImplementation(async (_pid: string, key: string) => {
      if (key === triggerFileKey) {
        return [
          "trigger:",
          "  triggerType: ON_TAP",
          "rootAction:",
          "  action:",
          "    key: act_001",
        ].join("\n");
      }
      if (key === actionFileKey) {
        return "rebuild: {}";
      }
      return null;
    });

    // Should only process the trigger def file (id-ON_TAP), not the nested action key
    const result = await summarizeTriggers(PROJECT_ID, NODE_PREFIX);
    expect(result).toHaveLength(1);
    expect(result[0].trigger).toBe("ON_TAP");
    expect(result[0].actions).toHaveLength(1);
    expect(result[0].actions[0]).toEqual({ type: "rebuild", detail: "" });
  });
});

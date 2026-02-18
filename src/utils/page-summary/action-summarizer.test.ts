import { describe, it, expect } from "vitest";
import {
  classifyAction,
  collectActionKeys,
  findDeepAction,
} from "./action-summarizer.js";

// ---------------------------------------------------------------------------
// classifyAction
// ---------------------------------------------------------------------------
describe("classifyAction", () => {
  it("classifies navigate to page", () => {
    const result = classifyAction({ navigate: { pageNodeKeyRef: { key: "Scaffold_abc" } } });
    expect(result).toEqual({ type: "navigate", detail: "to page" });
  });

  it("classifies navigate back", () => {
    const result = classifyAction({ navigate: { isNavigateBack: true } });
    expect(result).toEqual({ type: "navigate", detail: "back" });
  });

  it("classifies customAction with outputVariableName", () => {
    const result = classifyAction({
      customAction: { customActionIdentifier: { key: "action_abc" } },
      outputVariableName: "myResult",
    });
    expect(result).toEqual({ type: "customAction", detail: "myResult" });
  });

  it("classifies customAction with identifier key fallback", () => {
    const result = classifyAction({
      customAction: { customActionIdentifier: { key: "action_xyz" } },
    });
    expect(result).toEqual({ type: "customAction", detail: "action_xyz" });
  });

  it("classifies customAction with unknown fallback", () => {
    const result = classifyAction({ customAction: {} });
    expect(result).toEqual({ type: "customAction", detail: "unknown" });
  });

  it("classifies database postgres insert", () => {
    const result = classifyAction({
      database: {
        postgresAction: {
          tableIdentifier: { name: "users" },
          insert: {},
        },
      },
    });
    expect(result).toEqual({ type: "database", detail: "insert users" });
  });

  it("classifies database postgres update", () => {
    const result = classifyAction({
      database: {
        postgresAction: {
          tableIdentifier: { name: "orders" },
          update: {},
        },
      },
    });
    expect(result).toEqual({ type: "database", detail: "update orders" });
  });

  it("classifies database postgres query", () => {
    const result = classifyAction({
      database: {
        postgresAction: {
          tableIdentifier: { name: "products" },
          query: {},
        },
      },
    });
    expect(result).toEqual({ type: "database", detail: "query products" });
  });

  it("classifies database postgres delete", () => {
    const result = classifyAction({
      database: {
        postgresAction: {
          tableIdentifier: { name: "sessions" },
          delete: {},
        },
      },
    });
    expect(result).toEqual({ type: "database", detail: "delete sessions" });
  });

  it("classifies database postgres with missing table name", () => {
    const result = classifyAction({
      database: { postgresAction: { insert: {} } },
    });
    expect(result).toEqual({ type: "database", detail: "insert table" });
  });

  it("classifies database firestore", () => {
    const result = classifyAction({
      database: { firestoreAction: { collection: "users" } },
    });
    expect(result).toEqual({ type: "database", detail: "firestore" });
  });

  it("classifies database with no recognized sub-action", () => {
    const result = classifyAction({ database: {} });
    expect(result).toEqual({ type: "database", detail: "" });
  });

  it("classifies localStateUpdate APP_STATE", () => {
    const result = classifyAction({
      localStateUpdate: { stateVariableType: "APP_STATE", updates: [] },
    });
    expect(result).toEqual({ type: "updateAppState", detail: "" });
  });

  it("classifies localStateUpdate increment", () => {
    const result = classifyAction({
      localStateUpdate: { updates: [{ increment: { value: 1 } }] },
    });
    expect(result).toEqual({ type: "updateState", detail: "increment" });
  });

  it("classifies localStateUpdate struct", () => {
    const result = classifyAction({
      localStateUpdate: { updates: [{ dataStructUpdate: { field: "name" } }] },
    });
    expect(result).toEqual({ type: "updateState", detail: "struct" });
  });

  it("classifies localStateUpdate with empty updates", () => {
    const result = classifyAction({ localStateUpdate: { updates: [] } });
    expect(result).toEqual({ type: "updateState", detail: "" });
  });

  it("classifies localStateUpdate with no updates array", () => {
    const result = classifyAction({ localStateUpdate: {} });
    expect(result).toEqual({ type: "updateState", detail: "" });
  });

  it("classifies waitAction with duration", () => {
    const result = classifyAction({
      waitAction: { durationMillisValue: { inputValue: 500 } },
    });
    expect(result).toEqual({ type: "wait", detail: "500ms" });
  });

  it("classifies waitAction without duration", () => {
    const result = classifyAction({ waitAction: {} });
    expect(result).toEqual({ type: "wait", detail: "" });
  });

  it("classifies alertDialog", () => {
    const result = classifyAction({ alertDialog: { title: "Warning" } });
    expect(result).toEqual({ type: "alertDialog", detail: "" });
  });

  it("classifies bottomSheet", () => {
    const result = classifyAction({ bottomSheet: { component: "MySheet" } });
    expect(result).toEqual({ type: "bottomSheet", detail: "" });
  });

  it("classifies revenueCat purchase", () => {
    const result = classifyAction({
      revenueCat: { purchase: { productId: "pro_monthly" } },
    });
    expect(result).toEqual({ type: "revenueCat", detail: "purchase" });
  });

  it("classifies revenueCat restore", () => {
    const result = classifyAction({ revenueCat: { restore: {} } });
    expect(result).toEqual({ type: "revenueCat", detail: "restore" });
  });

  it("classifies revenueCat paywall with entitlement name", () => {
    const result = classifyAction({
      revenueCat: {
        paywall: {
          entitlementId: {
            inputValue: { serializedValue: "premium" },
          },
        },
      },
    });
    expect(result).toEqual({ type: "revenueCat", detail: "paywall (premium)" });
  });

  it("classifies revenueCat paywall without entitlement name", () => {
    const result = classifyAction({
      revenueCat: { paywall: {} },
    });
    expect(result).toEqual({ type: "revenueCat", detail: "paywall" });
  });

  it("classifies revenueCat with no recognized sub-type", () => {
    const result = classifyAction({ revenueCat: {} });
    expect(result).toEqual({ type: "revenueCat", detail: "" });
  });

  it("classifies auth", () => {
    const result = classifyAction({ auth: { signIn: {} } });
    expect(result).toEqual({ type: "auth", detail: "" });
  });

  it("classifies rebuild", () => {
    const result = classifyAction({ rebuild: {} });
    expect(result).toEqual({ type: "rebuild", detail: "" });
  });

  it("classifies scrollTo", () => {
    const result = classifyAction({ scrollTo: { target: "top" } });
    expect(result).toEqual({ type: "scrollTo", detail: "" });
  });

  it("classifies copyToClipboard", () => {
    const result = classifyAction({ copyToClipboard: { text: "hello" } });
    expect(result).toEqual({ type: "copyToClipboard", detail: "" });
  });

  it("classifies share", () => {
    const result = classifyAction({ share: { text: "Check this out" } });
    expect(result).toEqual({ type: "share", detail: "" });
  });

  it("classifies hapticFeedback", () => {
    const result = classifyAction({ hapticFeedback: { type: "light" } });
    expect(result).toEqual({ type: "haptic", detail: "" });
  });

  it("classifies terminate", () => {
    const result = classifyAction({ terminate: true });
    expect(result).toEqual({ type: "terminate", detail: "" });
  });

  it("classifies disabled action wrapping navigate", () => {
    const result = classifyAction({
      disableAction: {
        actionNode: {
          navigate: { pageNodeKeyRef: { key: "Scaffold_abc" } },
        },
      },
    });
    expect(result).toEqual({ type: "[DISABLED] navigate", detail: "to page" });
  });

  it("classifies disabled action with no inner action", () => {
    const result = classifyAction({
      disableAction: { actionNode: {} },
    });
    expect(result).toEqual({ type: "[DISABLED]", detail: "" });
  });

  it("classifies disabled action with no actionNode at all", () => {
    const result = classifyAction({ disableAction: {} });
    expect(result).toEqual({ type: "[DISABLED]", detail: "" });
  });

  it("falls back to first key for unknown action", () => {
    const result = classifyAction({ someNewAction: { data: "test" }, key: "action_123" });
    expect(result).toEqual({ type: "someNewAction", detail: "" });
  });

  it("returns unknown when only key and outputVariableName are present", () => {
    const result = classifyAction({ key: "abc", outputVariableName: "x" });
    expect(result).toEqual({ type: "unknown", detail: "" });
  });
});

// ---------------------------------------------------------------------------
// collectActionKeys
// ---------------------------------------------------------------------------
describe("collectActionKeys", () => {
  it("collects a single action key", () => {
    const node = { action: { key: "abc123" } };
    expect(collectActionKeys(node)).toEqual(["abc123"]);
  });

  it("collects keys from followUpAction chain", () => {
    const node = {
      action: { key: "first" },
      followUpAction: {
        action: { key: "second" },
        followUpAction: {
          action: { key: "third" },
        },
      },
    };
    expect(collectActionKeys(node)).toEqual(["first", "second", "third"]);
  });

  it("collects keys from conditional branches (trueActions and falseAction)", () => {
    const node = {
      conditionActions: {
        trueActions: [
          { trueAction: { action: { key: "trueKey1" } } },
          { trueAction: { action: { key: "trueKey2" } } },
        ],
        falseAction: {
          action: { key: "falseKey" },
        },
      },
    };
    const keys = collectActionKeys(node);
    expect(keys).toContain("trueKey1");
    expect(keys).toContain("trueKey2");
    expect(keys).toContain("falseKey");
  });

  it("skips falseAction with terminate", () => {
    const node = {
      conditionActions: {
        falseAction: { terminate: true },
      },
    };
    expect(collectActionKeys(node)).toEqual([]);
  });

  it("collects keys from conditionActions followUpAction", () => {
    const node = {
      conditionActions: {
        followUpAction: {
          action: { key: "condFollowUp" },
        },
      },
    };
    expect(collectActionKeys(node)).toEqual(["condFollowUp"]);
  });

  it("collects keys from parallel actions", () => {
    const node = {
      parallelActions: {
        actions: [
          { action: { key: "par1" } },
          { action: { key: "par2" } },
          { action: { key: "par3" } },
        ],
      },
    };
    expect(collectActionKeys(node)).toEqual(["par1", "par2", "par3"]);
  });

  it("collects keys from nested follow-ups within parallel actions", () => {
    const node = {
      parallelActions: {
        actions: [
          {
            action: { key: "parA" },
            followUpAction: { action: { key: "parAFollow" } },
          },
        ],
      },
    };
    expect(collectActionKeys(node)).toEqual(["parA", "parAFollow"]);
  });

  it("returns empty array for a node with no actions", () => {
    expect(collectActionKeys({})).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// findDeepAction
// ---------------------------------------------------------------------------
describe("findDeepAction", () => {
  it("finds a navigate action at the top level", () => {
    const obj = { navigate: { isNavigateBack: true } };
    expect(findDeepAction(obj)).toEqual({ type: "navigate", detail: "back" });
  });

  it("finds a deeply nested action", () => {
    const obj = {
      wrapper: {
        inner: {
          deep: {
            customAction: { customActionIdentifier: { key: "myAction" } },
          },
        },
      },
    };
    expect(findDeepAction(obj)).toEqual({ type: "customAction", detail: "myAction" });
  });

  it("returns null for null input", () => {
    expect(findDeepAction(null)).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(findDeepAction("string")).toBeNull();
  });

  it("returns null for an empty object", () => {
    expect(findDeepAction({})).toBeNull();
  });

  it("respects depth limit (returns null at depth > 8)", () => {
    // Build an object 10 levels deep with an action at the bottom
    let obj: Record<string, unknown> = { navigate: {} };
    for (let i = 0; i < 10; i++) {
      obj = { nested: obj };
    }
    // Starting at depth 0, the navigate is at depth 10, which exceeds 8
    expect(findDeepAction(obj)).toBeNull();
  });

  it("finds the first recognizable action among siblings", () => {
    const obj = {
      a: { b: "not an action" },
      c: { database: { firestoreAction: {} } },
    };
    expect(findDeepAction(obj)).toEqual({ type: "database", detail: "firestore" });
  });

  it("returns null for object with no recognizable action keys", () => {
    const obj = { foo: { bar: { baz: 42 } } };
    expect(findDeepAction(obj)).toBeNull();
  });
});

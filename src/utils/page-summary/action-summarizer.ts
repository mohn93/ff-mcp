/**
 * Summarize trigger_actions chains for a widget node.
 *
 * Walks the rootAction→followUpAction→conditionActions chain in the trigger
 * file, reads individual action files, and classifies each action by type.
 */
import YAML from "yaml";
import { cacheRead, listCachedKeys } from "../cache.js";
import { ActionSummary, TriggerSummary } from "./types.js";

/**
 * Collect all action keys referenced in a trigger chain.
 * Flattens followUpAction chains, conditionActions, and parallelActions.
 */
function collectActionKeys(node: Record<string, unknown>): string[] {
  const keys: string[] = [];

  // Direct action reference
  const action = node.action as Record<string, unknown> | undefined;
  if (action?.key) {
    keys.push(action.key as string);
  }

  // Conditional branches
  const cond = node.conditionActions as Record<string, unknown> | undefined;
  if (cond) {
    // True branches
    const trueActions = cond.trueActions as Record<string, unknown>[] | undefined;
    if (Array.isArray(trueActions)) {
      for (const branch of trueActions) {
        const trueAction = branch.trueAction as Record<string, unknown> | undefined;
        if (trueAction) {
          keys.push(...collectActionKeys(trueAction));
        }
      }
    }
    // False branch
    const falseAction = cond.falseAction as Record<string, unknown> | undefined;
    if (falseAction && !("terminate" in falseAction)) {
      keys.push(...collectActionKeys(falseAction));
    }
    // followUpAction after conditionActions
    const condFollowUp = cond.followUpAction as Record<string, unknown> | undefined;
    if (condFollowUp) {
      keys.push(...collectActionKeys(condFollowUp));
    }
  }

  // Parallel actions
  const parallel = node.parallelActions as Record<string, unknown> | undefined;
  if (parallel) {
    const actions = parallel.actions as Record<string, unknown>[] | undefined;
    if (Array.isArray(actions)) {
      for (const branch of actions) {
        keys.push(...collectActionKeys(branch));
      }
    }
  }

  // Follow-up chain
  const followUp = node.followUpAction as Record<string, unknown> | undefined;
  if (followUp) {
    keys.push(...collectActionKeys(followUp));
  }

  return keys;
}

/**
 * Classify an action YAML into a human-readable summary.
 */
function classifyAction(doc: Record<string, unknown>): ActionSummary {
  // Navigate
  if ("navigate" in doc) {
    const nav = doc.navigate as Record<string, unknown>;
    if (nav.isNavigateBack) {
      return { type: "navigate", detail: "back" };
    }
    return { type: "navigate", detail: "to page" };
  }

  // Custom action
  if ("customAction" in doc) {
    const ca = doc.customAction as Record<string, unknown>;
    const id = ca.customActionIdentifier as Record<string, unknown> | undefined;
    const name = doc.outputVariableName as string | undefined;
    return {
      type: "customAction",
      detail: name || (id?.key as string) || "unknown",
    };
  }

  // Database
  if ("database" in doc) {
    const db = doc.database as Record<string, unknown>;
    const pg = db.postgresAction as Record<string, unknown> | undefined;
    if (pg) {
      const table = pg.tableIdentifier as Record<string, unknown> | undefined;
      const tableName = (table?.name as string) || "table";
      const op = "insert" in pg ? "insert" : "update" in pg ? "update" : "query" in pg ? "query" : "delete" in pg ? "delete" : "op";
      return { type: "database", detail: `${op} ${tableName}` };
    }
    const firestore = db.firestoreAction as Record<string, unknown> | undefined;
    if (firestore) {
      return { type: "database", detail: "firestore" };
    }
    return { type: "database", detail: "" };
  }

  // Local state update
  if ("localStateUpdate" in doc) {
    const lsu = doc.localStateUpdate as Record<string, unknown>;
    const stateType = (lsu.stateVariableType as string) || "";
    const updates = lsu.updates as Record<string, unknown>[] | undefined;
    if (stateType === "APP_STATE") {
      return { type: "updateAppState", detail: "" };
    }
    if (updates && updates.length > 0) {
      const first = updates[0];
      if ("increment" in first) return { type: "updateState", detail: "increment" };
      if ("dataStructUpdate" in first) return { type: "updateState", detail: "struct" };
    }
    return { type: "updateState", detail: "" };
  }

  // Wait
  if ("waitAction" in doc) {
    const wa = doc.waitAction as Record<string, unknown>;
    const dur = wa.durationMillisValue as Record<string, unknown> | undefined;
    const ms = dur?.inputValue;
    return { type: "wait", detail: ms ? `${ms}ms` : "" };
  }

  // Alert dialog
  if ("alertDialog" in doc) {
    return { type: "alertDialog", detail: "" };
  }

  // Bottom sheet
  if ("bottomSheet" in doc) {
    return { type: "bottomSheet", detail: "" };
  }

  // RevenueCat
  if ("revenueCat" in doc) {
    const rc = doc.revenueCat as Record<string, unknown>;
    if ("purchase" in rc) return { type: "revenueCat", detail: "purchase" };
    if ("restore" in rc) return { type: "revenueCat", detail: "restore" };
    return { type: "revenueCat", detail: "" };
  }

  // Authentication
  if ("auth" in doc) {
    return { type: "auth", detail: "" };
  }

  // Rebuild (update widget / rebuild)
  if ("rebuild" in doc) {
    return { type: "rebuild", detail: "" };
  }

  // Scroll to
  if ("scrollTo" in doc) {
    return { type: "scrollTo", detail: "" };
  }

  // Copy to clipboard
  if ("copyToClipboard" in doc) {
    return { type: "copyToClipboard", detail: "" };
  }

  // Share
  if ("share" in doc) {
    return { type: "share", detail: "" };
  }

  // Haptic feedback
  if ("hapticFeedback" in doc) {
    return { type: "haptic", detail: "" };
  }

  // Terminate sentinel — skip
  if ("terminate" in doc) {
    return { type: "terminate", detail: "" };
  }

  // Fallback: use first key
  const actionKeys = Object.keys(doc).filter((k) => k !== "key" && k !== "outputVariableName");
  return { type: actionKeys[0] || "unknown", detail: "" };
}

/**
 * Read all trigger_actions for a node and return summaries.
 *
 * @param projectId - FF project ID
 * @param nodeFileKeyPrefix - Cache prefix for the node's trigger actions,
 *   e.g. "page/id-Scaffold_xxx/page-widget-tree-outline/node/id-Button_yyy"
 */
export async function summarizeTriggers(
  projectId: string,
  nodeFileKeyPrefix: string
): Promise<TriggerSummary[]> {
  const triggerPrefix = `${nodeFileKeyPrefix}/trigger_actions/`;
  const allKeys = await listCachedKeys(projectId, triggerPrefix);

  // Find trigger definition files (e.g. trigger_actions/id-ON_TAP)
  // These don't have /action/ in the path
  const triggerDefKeys = allKeys.filter(
    (k) => !k.includes("/action/") && k.startsWith(triggerPrefix + "id-")
  );

  // Deduplicate: a key like "trigger_actions/id-ON_TAP" may also appear as a
  // directory prefix "trigger_actions/id-ON_TAP/action/..." — we only want the
  // file, which is the shortest matching key
  const triggerFiles = triggerDefKeys.filter((k) => {
    const afterPrefix = k.slice(triggerPrefix.length);
    // Should be just "id-ON_TAP" with no further slashes
    return !afterPrefix.includes("/");
  });

  const results: TriggerSummary[] = [];

  for (const triggerFileKey of triggerFiles) {
    const content = await cacheRead(projectId, triggerFileKey);
    if (!content) continue;

    let doc: Record<string, unknown>;
    try {
      doc = YAML.parse(content) as Record<string, unknown>;
    } catch {
      continue;
    }

    // Extract trigger type
    const trigger = doc.trigger as Record<string, unknown> | undefined;
    const triggerType = (trigger?.triggerType as string) || "UNKNOWN";

    // Collect action keys from chain
    const rootAction = doc.rootAction as Record<string, unknown> | undefined;
    if (!rootAction) continue;

    const actionKeys = collectActionKeys(rootAction);
    // Deduplicate while preserving order
    const uniqueKeys = [...new Set(actionKeys)];

    // Read each action file
    const actionPrefix = `${triggerFileKey}/action/`;
    const actions: ActionSummary[] = [];

    for (const actionKey of uniqueKeys) {
      const actionFileKey = `${actionPrefix}id-${actionKey}`;
      const actionContent = await cacheRead(projectId, actionFileKey);
      if (!actionContent) continue;

      try {
        const actionDoc = YAML.parse(actionContent) as Record<string, unknown>;
        const summary = classifyAction(actionDoc);
        if (summary.type !== "terminate") {
          actions.push(summary);
        }
      } catch {
        actions.push({ type: "unknown", detail: actionKey });
      }
    }

    if (actions.length > 0) {
      results.push({ trigger: triggerType, actions });
    }
  }

  return results;
}

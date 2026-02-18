/**
 * Render a PageMeta + SummaryNode tree as a readable text summary
 * with box-drawing characters and inline trigger summaries.
 */
import { ActionSummary, ComponentMeta, PageMeta, SummaryNode, TriggerSummary } from "./types.js";

/** Format a single action into a compact string. */
function fmtAction(a: ActionSummary): string {
  if (a.detail) return `${a.type}: ${a.detail}`;
  return a.type;
}

/** Format a trigger into a compact inline string like "ON_TAP: [navigate to page, customAction: foo]". */
function fmtTrigger(t: TriggerSummary): string {
  const acts = t.actions.map(fmtAction).join(", ");
  return `${t.trigger} → [${acts}]`;
}

/** Format the slot prefix for display. */
function fmtSlot(slot: string): string {
  if (slot === "children" || slot === "root") return "";
  return `[${slot}] `;
}

/** Build a display label for a node. */
function nodeLabel(node: SummaryNode): string {
  const parts: string[] = [];

  parts.push(fmtSlot(node.slot));

  if (node.componentRef) {
    parts.push(`[${node.componentRef}]`);
    if (node.componentId) {
      parts.push(` (${node.componentId})`);
    }
  } else {
    parts.push(node.type);
  }

  if (node.name) {
    parts.push(` (${node.name})`);
  }

  if (node.detail) {
    parts.push(` ${node.detail}`);
  }

  return parts.join("");
}

/**
 * Render the widget tree recursively with box-drawing characters.
 */
function renderTree(
  node: SummaryNode,
  prefix: string,
  isLast: boolean,
  isRoot: boolean,
  lines: string[]
): void {
  // Build connector
  const connector = isRoot ? "" : isLast ? "└── " : "├── ";
  const label = nodeLabel(node);

  // Triggers inline
  const triggerStr =
    node.triggers.length > 0
      ? " → " + node.triggers.map(fmtTrigger).join("; ")
      : "";

  lines.push(`${prefix}${connector}${label}${triggerStr}`);

  // Child prefix
  const childPrefix = isRoot ? prefix : prefix + (isLast ? "    " : "│   ");

  for (let i = 0; i < node.children.length; i++) {
    renderTree(
      node.children[i],
      childPrefix,
      i === node.children.length - 1,
      false,
      lines
    );
  }
}

/**
 * Format a complete page summary as text.
 */
export function formatPageSummary(meta: PageMeta, tree: SummaryNode): string {
  const lines: string[] = [];

  // Header
  lines.push(`${meta.pageName} (${meta.scaffoldId}) — folder: ${meta.folder}`);

  // Params
  if (meta.params.length > 0) {
    const paramStrs = meta.params.map((p) => {
      const def = p.defaultValue ? `, default: ${p.defaultValue}` : "";
      return `${p.name} (${p.dataType}${def})`;
    });
    lines.push(`Params: ${paramStrs.join(", ")}`);
  }

  // State fields
  if (meta.stateFields.length > 0) {
    const stateStrs = meta.stateFields.map((s) => {
      const def = s.defaultValue ? `, default: ${s.defaultValue}` : "";
      return `${s.name} (${s.dataType}${def})`;
    });
    lines.push(`State: ${stateStrs.join(", ")}`);
  }

  // Scaffold-level triggers
  if (tree.triggers.length > 0) {
    lines.push("");
    for (const t of tree.triggers) {
      lines.push(fmtTrigger(t));
    }
  }

  // Widget tree
  lines.push("");
  lines.push("Widget Tree:");
  // Render children directly (skip the Scaffold root itself)
  for (let i = 0; i < tree.children.length; i++) {
    renderTree(
      tree.children[i],
      "",
      i === tree.children.length - 1,
      false,
      lines
    );
  }

  return lines.join("\n");
}

/**
 * Format a complete component summary as text.
 */
export function formatComponentSummary(meta: ComponentMeta, tree: SummaryNode): string {
  const lines: string[] = [];

  // Header
  lines.push(`${meta.componentName} (${meta.containerId})`);

  if (meta.description) {
    lines.push(`Description: ${meta.description}`);
  }

  // Params
  if (meta.params.length > 0) {
    const paramStrs = meta.params.map((p) => {
      const def = p.defaultValue ? `, default: ${p.defaultValue}` : "";
      return `${p.name} (${p.dataType}${def})`;
    });
    lines.push(`Params: ${paramStrs.join(", ")}`);
  }

  // Root-level triggers
  if (tree.triggers.length > 0) {
    lines.push("");
    for (const t of tree.triggers) {
      lines.push(fmtTrigger(t));
    }
  }

  // Widget tree
  lines.push("");
  lines.push("Widget Tree:");
  // Render children directly (skip the Container root itself)
  for (let i = 0; i < tree.children.length; i++) {
    renderTree(
      tree.children[i],
      "",
      i === tree.children.length - 1,
      false,
      lines
    );
  }

  return lines.join("\n");
}

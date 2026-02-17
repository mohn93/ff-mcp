/**
 * Parse a page-widget-tree-outline YAML into a recursive OutlineNode tree.
 *
 * The outline YAML has a `node` root with named slots (body, appBar, header,
 * collapsed, expanded) and `children` arrays. Each entry has a `key` field.
 */
import YAML from "yaml";
import { OutlineNode } from "./types.js";

/** Named slots that can appear on a node alongside `children`. */
const SLOT_KEYS = [
  "body",
  "appBar",
  "title",
  "header",
  "collapsed",
  "expanded",
  "floatingActionButton",
  "drawer",
  "endDrawer",
  "bottomNavigationBar",
] as const;

/**
 * Parse a raw outline node (from YAML) into an OutlineNode.
 * `slot` indicates how this node was referenced by its parent.
 */
function parseNode(raw: Record<string, unknown>, slot: string): OutlineNode {
  const key = (raw.key as string) ?? "unknown";
  const children: OutlineNode[] = [];

  // Named slots
  for (const s of SLOT_KEYS) {
    const child = raw[s] as Record<string, unknown> | undefined;
    if (child && typeof child === "object" && child.key) {
      children.push(parseNode(child, s));
    }
  }

  // Explicit children array
  const rawChildren = raw.children as Record<string, unknown>[] | undefined;
  if (Array.isArray(rawChildren)) {
    for (const child of rawChildren) {
      children.push(parseNode(child, "children"));
    }
  }

  return { key, slot, children };
}

/**
 * Parse the page-widget-tree-outline YAML string into an OutlineNode tree.
 * Returns the root node (typically the Scaffold).
 */
export function parseTreeOutline(yamlContent: string): OutlineNode {
  const doc = YAML.parse(yamlContent) as Record<string, unknown>;

  const root = doc.node as Record<string, unknown> | undefined;
  if (!root || !root.key) {
    throw new Error("Invalid tree outline: missing root node");
  }

  return parseNode(root, "root");
}

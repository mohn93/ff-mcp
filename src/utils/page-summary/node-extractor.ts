/**
 * Read a node's cached YAML and extract human-readable details
 * based on widget type (text value, button label, image path, etc.).
 */
import YAML from "yaml";
import { cacheRead } from "../cache.js";

export interface NodeInfo {
  type: string;
  name: string;
  detail: string;
  componentRef?: string;  // resolved component name if this node is a component instance
  componentId?: string;   // component container ID for retrieval
}

/**
 * Resolve the inputValue from a FF value object.
 * Returns the literal string, or "[dynamic]" for variable references.
 */
export function resolveValue(obj: unknown): string {
  if (obj == null) return "";
  if (typeof obj === "string" || typeof obj === "number") return String(obj);
  if (typeof obj !== "object") return "";

  const o = obj as Record<string, unknown>;

  // Direct inputValue
  if ("inputValue" in o) {
    const iv = o.inputValue;
    if (typeof iv === "string" || typeof iv === "number") return String(iv);
    if (iv && typeof iv === "object") {
      const ivo = iv as Record<string, unknown>;
      // serializedValue pattern
      if ("serializedValue" in ivo) return String(ivo.serializedValue);
      // themeColor pattern
      if ("themeColor" in ivo) return `[theme:${ivo.themeColor}]`;
      // color value pattern
      if ("value" in ivo) return String(ivo.value);
    }
    return "";
  }

  // Variable reference
  if ("variable" in o) return "[dynamic]";

  return "";
}

/** Extract text value from a text widget's props. */
function extractText(props: Record<string, unknown>): string {
  const text = props.text as Record<string, unknown> | undefined;
  if (!text) return "";
  const textValue = text.textValue as Record<string, unknown> | undefined;
  if (!textValue) return "";
  const val = resolveValue(textValue);
  return val ? `"${val}"` : "";
}

/** Extract button label from a button widget's props. */
function extractButton(props: Record<string, unknown>): string {
  const button = props.button as Record<string, unknown> | undefined;
  if (!button) return "";
  const text = button.text as Record<string, unknown> | undefined;
  if (!text) return "";
  const textValue = text.textValue as Record<string, unknown> | undefined;
  if (!textValue) return "";
  const val = resolveValue(textValue);
  return val ? `"${val}"` : "";
}

/** Extract image info from an image widget's props. */
function extractImage(props: Record<string, unknown>): string {
  const image = props.image as Record<string, unknown> | undefined;
  if (!image) return "";

  const parts: string[] = [];

  // Path
  const pathValue = image.pathValue as Record<string, unknown> | undefined;
  if (pathValue) {
    const path = resolveValue(pathValue);
    if (path && path !== "[dynamic]") {
      // Extract just the filename from the full asset path
      const filename = path.split("/").pop() || path;
      parts.push(filename);
    } else if (path === "[dynamic]") {
      parts.push("[dynamic]");
    }
  }

  // Dimensions
  const dims = image.dimensions as Record<string, unknown> | undefined;
  if (dims) {
    const w = dims.width as Record<string, unknown> | undefined;
    const h = dims.height as Record<string, unknown> | undefined;
    const wVal = w?.pixelsValue ? resolveValue(w.pixelsValue) : "";
    const hVal = h?.pixelsValue ? resolveValue(h.pixelsValue) : "";
    if (wVal && hVal && wVal !== "Infinity" && hVal !== "Infinity") {
      parts.push(`[${wVal}x${hVal}]`);
    }
  }

  return parts.join(" ");
}

/** Extract icon info. */
function extractIcon(props: Record<string, unknown>): string {
  const icon = props.icon as Record<string, unknown> | undefined;
  if (!icon) return "";
  const iconData = icon.iconDataValue as Record<string, unknown> | undefined;
  if (!iconData) return "";
  const iv = iconData.inputValue as Record<string, unknown> | undefined;
  if (!iv) return "";
  return (iv.name as string) || "";
}

/** Extract text field hint. */
function extractTextField(props: Record<string, unknown>): string {
  const tf = props.textField as Record<string, unknown> | undefined;
  if (!tf) return "";
  const decoration = tf.inputDecoration as Record<string, unknown> | undefined;
  if (!decoration) return "";
  const hintText = decoration.hintText as Record<string, unknown> | undefined;
  if (!hintText) return "";
  const textValue = hintText.textValue as Record<string, unknown> | undefined;
  if (!textValue) return "";
  const val = resolveValue(textValue);
  return val ? `hint: "${val}"` : "";
}

/** Extract checkbox/toggle/switch label. */
function extractCheckbox(props: Record<string, unknown>): string {
  const cb = (props.checkbox || props.toggle || props.switchWidget) as
    | Record<string, unknown>
    | undefined;
  if (!cb) return "";
  const label = cb.labelValue as Record<string, unknown> | undefined;
  if (!label) return "";
  return resolveValue(label);
}

/** Type-specific detail extraction. */
function extractDetail(type: string, props: Record<string, unknown>): string {
  switch (type) {
    case "Text":
    case "RichText":
    case "AutoSizeText":
      return extractText(props);
    case "Button":
    case "IconButton":
    case "FFButtonWidget":
      return extractButton(props);
    case "Image":
    case "CachedNetworkImage":
      return extractImage(props);
    case "Icon":
      return extractIcon(props);
    case "TextField":
    case "TextFormField":
      return extractTextField(props);
    case "Checkbox":
    case "CheckboxListTile":
    case "Switch":
    case "ToggleIcon":
      return extractCheckbox(props);
    default:
      return "";
  }
}

/**
 * Infer widget type from the key prefix (e.g. "Text_abc123" → "Text").
 */
export function inferTypeFromKey(key: string): string {
  const match = key.match(/^([A-Z][a-zA-Z]*)_/);
  return match ? match[1] : "Unknown";
}

/**
 * Resolve a component reference to its human-readable name.
 * Reads the component definition file from cache (e.g. "component/id-Container_xxx").
 */
async function resolveComponentName(
  projectId: string,
  componentKey: string
): Promise<string | undefined> {
  const compFileKey = `component/id-${componentKey}`;
  const content = await cacheRead(projectId, compFileKey);
  if (!content) return undefined;

  const nameMatch = content.match(/^name:\s*(.+)$/m);
  return nameMatch ? nameMatch[1].trim() : undefined;
}

/**
 * Read a node's cached file and extract type, name, and detail.
 *
 * @param projectId - The FF project ID
 * @param pagePrefix - Cache key prefix for the page, e.g. "page/id-Scaffold_xxx/page-widget-tree-outline"
 * @param nodeKey - The node key, e.g. "Button_uaqbabys"
 */
export async function extractNodeInfo(
  projectId: string,
  pagePrefix: string,
  nodeKey: string
): Promise<NodeInfo> {
  const fileKey = `${pagePrefix}/node/id-${nodeKey}`;
  const content = await cacheRead(projectId, fileKey);

  if (!content) {
    return {
      type: inferTypeFromKey(nodeKey),
      name: "",
      detail: "",
    };
  }

  try {
    const doc = YAML.parse(content) as Record<string, unknown>;
    const type = (doc.type as string) || inferTypeFromKey(nodeKey);
    const name = (doc.name as string) || "";
    const props = (doc.props as Record<string, unknown>) || {};
    const detail = extractDetail(type, props);

    // Check for component reference
    const compRef = doc.componentClassKeyRef as Record<string, unknown> | undefined;
    let componentRef: string | undefined;
    let componentId: string | undefined;
    if (compRef?.key && typeof compRef.key === "string") {
      componentId = compRef.key;
      componentRef = await resolveComponentName(projectId, componentId);
    }

    return { type, name, detail, componentRef, componentId };
  } catch {
    return {
      type: inferTypeFromKey(nodeKey),
      name: "",
      detail: "",
    };
  }
}

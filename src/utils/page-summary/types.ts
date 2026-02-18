/**
 * Types for the page summary tool.
 */

/** Summary of a single action in a trigger chain. */
export interface ActionSummary {
  type: string;       // e.g. "navigate", "customAction", "stateUpdate", "database", "wait"
  detail: string;     // e.g. "navigate to Main", "call checkSubscription", "set loadingIndex=0"
}

/** Summary of a trigger (event handler) on a widget. */
export interface TriggerSummary {
  trigger: string;          // e.g. "ON_TAP", "ON_INIT_STATE"
  actions: ActionSummary[];
}

/** A node in the summarized widget tree. */
export interface SummaryNode {
  key: string;              // e.g. "Button_uaqbabys"
  type: string;             // e.g. "Button"
  name: string;             // human-readable name from node file, or ""
  slot: string;             // e.g. "body", "appBar", "children", "header"
  detail: string;           // extracted info: text value, image path, hint, etc.
  componentRef?: string;    // resolved component name if this node is a component instance
  componentId?: string;     // component container ID (e.g. "Container_ur4ml9qw") for retrieval
  triggers: TriggerSummary[];
  children: SummaryNode[];
}

/** Parameter metadata from the top-level page YAML. */
export interface ParamInfo {
  name: string;
  dataType: string;
  defaultValue?: string;
}

/** State field metadata from the top-level page YAML. */
export interface StateFieldInfo {
  name: string;
  dataType: string;
  defaultValue?: string;
}

/** Top-level page metadata. */
export interface PageMeta {
  pageName: string;
  scaffoldId: string;
  folder: string;
  params: ParamInfo[];
  stateFields: StateFieldInfo[];
}

/** Top-level component metadata. */
export interface ComponentMeta {
  componentName: string;
  containerId: string;
  description: string;
  params: ParamInfo[];
}

/** Raw tree node from the widget tree outline YAML. */
export interface OutlineNode {
  key: string;
  slot: string;
  children: OutlineNode[];
}

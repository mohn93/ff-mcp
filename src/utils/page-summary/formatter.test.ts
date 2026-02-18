import { describe, it, expect } from "vitest";
import { formatPageSummary, formatComponentSummary } from "./formatter.js";
import type {
  PageMeta,
  ComponentMeta,
  SummaryNode,
} from "./types.js";

/** Helper: create a minimal SummaryNode. */
function node(
  overrides: Partial<SummaryNode> & { key: string; type: string }
): SummaryNode {
  return {
    key: overrides.key,
    type: overrides.type,
    name: overrides.name ?? "",
    slot: overrides.slot ?? "children",
    detail: overrides.detail ?? "",
    componentRef: overrides.componentRef,
    componentId: overrides.componentId,
    triggers: overrides.triggers ?? [],
    children: overrides.children ?? [],
  };
}

/** Helper: create a minimal PageMeta. */
function pageMeta(overrides: Partial<PageMeta> = {}): PageMeta {
  return {
    pageName: overrides.pageName ?? "TestPage",
    scaffoldId: overrides.scaffoldId ?? "Scaffold_test",
    folder: overrides.folder ?? "TestFolder",
    params: overrides.params ?? [],
    stateFields: overrides.stateFields ?? [],
  };
}

/** Helper: create a minimal ComponentMeta. */
function componentMeta(overrides: Partial<ComponentMeta> = {}): ComponentMeta {
  return {
    componentName: overrides.componentName ?? "TestComponent",
    containerId: overrides.containerId ?? "Container_test",
    description: overrides.description ?? "",
    params: overrides.params ?? [],
  };
}

/** Helper: create a root SummaryNode (typically Scaffold or Container). */
function rootNode(overrides: Partial<SummaryNode> = {}): SummaryNode {
  return {
    key: overrides.key ?? "Scaffold_root",
    type: overrides.type ?? "Scaffold",
    name: overrides.name ?? "",
    slot: overrides.slot ?? "root",
    detail: overrides.detail ?? "",
    componentRef: overrides.componentRef,
    componentId: overrides.componentId,
    triggers: overrides.triggers ?? [],
    children: overrides.children ?? [],
  };
}

describe("formatPageSummary", () => {
  describe("header", () => {
    it("renders page name, scaffold ID, and folder", () => {
      const meta = pageMeta({
        pageName: "LoginPage",
        scaffoldId: "Scaffold_login",
        folder: "Authentication",
      });
      const tree = rootNode();
      const output = formatPageSummary(meta, tree);
      const firstLine = output.split("\n")[0];
      expect(firstLine).toBe(
        "LoginPage (Scaffold_login) — folder: Authentication"
      );
    });
  });

  describe("params", () => {
    it("renders params with type", () => {
      const meta = pageMeta({
        params: [{ name: "userId", dataType: "String" }],
      });
      const tree = rootNode();
      const output = formatPageSummary(meta, tree);
      expect(output).toContain("Params: userId (String)");
    });

    it("renders params with default values", () => {
      const meta = pageMeta({
        params: [
          { name: "count", dataType: "int", defaultValue: "0" },
          { name: "label", dataType: "String", defaultValue: "hello" },
        ],
      });
      const tree = rootNode();
      const output = formatPageSummary(meta, tree);
      expect(output).toContain(
        "Params: count (int, default: 0), label (String, default: hello)"
      );
    });

    it("omits params line when there are no params", () => {
      const meta = pageMeta({ params: [] });
      const tree = rootNode();
      const output = formatPageSummary(meta, tree);
      expect(output).not.toContain("Params:");
    });
  });

  describe("state fields", () => {
    it("renders state fields", () => {
      const meta = pageMeta({
        stateFields: [{ name: "isLoading", dataType: "bool" }],
      });
      const tree = rootNode();
      const output = formatPageSummary(meta, tree);
      expect(output).toContain("State: isLoading (bool)");
    });

    it("renders state fields with default values", () => {
      const meta = pageMeta({
        stateFields: [
          { name: "counter", dataType: "int", defaultValue: "0" },
        ],
      });
      const tree = rootNode();
      const output = formatPageSummary(meta, tree);
      expect(output).toContain("State: counter (int, default: 0)");
    });

    it("omits state line when there are no state fields", () => {
      const meta = pageMeta({ stateFields: [] });
      const tree = rootNode();
      const output = formatPageSummary(meta, tree);
      expect(output).not.toContain("State:");
    });
  });

  describe("scaffold-level triggers", () => {
    it("renders triggers on the root node", () => {
      const tree = rootNode({
        triggers: [
          {
            trigger: "ON_INIT_STATE",
            actions: [
              { type: "customAction", detail: "call loadData" },
            ],
          },
        ],
      });
      const output = formatPageSummary(pageMeta(), tree);
      expect(output).toContain(
        "ON_INIT_STATE \u2192 [customAction: call loadData]"
      );
    });

    it("renders multiple triggers", () => {
      const tree = rootNode({
        triggers: [
          {
            trigger: "ON_INIT_STATE",
            actions: [{ type: "navigate", detail: "to Home" }],
          },
          {
            trigger: "ON_DISPOSE",
            actions: [{ type: "customAction", detail: "cleanup" }],
          },
        ],
      });
      const output = formatPageSummary(pageMeta(), tree);
      expect(output).toContain("ON_INIT_STATE \u2192 [navigate: to Home]");
      expect(output).toContain("ON_DISPOSE \u2192 [customAction: cleanup]");
    });
  });

  describe("widget tree rendering", () => {
    it("renders 'Widget Tree:' section header", () => {
      const tree = rootNode();
      const output = formatPageSummary(pageMeta(), tree);
      expect(output).toContain("Widget Tree:");
    });

    it("renders a single child with box-drawing", () => {
      const tree = rootNode({
        children: [
          node({ key: "Column_a", type: "Column" }),
        ],
      });
      const output = formatPageSummary(pageMeta(), tree);
      const lines = output.split("\n");
      const treeLine = lines.find((l) => l.includes("Column"));
      expect(treeLine).toBe("\u2514\u2500\u2500 Column");
    });

    it("renders multiple children with correct box-drawing connectors", () => {
      const tree = rootNode({
        children: [
          node({ key: "Column_a", type: "Column" }),
          node({ key: "Button_b", type: "Button" }),
        ],
      });
      const output = formatPageSummary(pageMeta(), tree);
      const lines = output.split("\n");
      const columnLine = lines.find((l) => l.includes("Column"));
      const buttonLine = lines.find((l) => l.includes("Button"));
      expect(columnLine).toBe("\u251C\u2500\u2500 Column");
      expect(buttonLine).toBe("\u2514\u2500\u2500 Button");
    });

    it("renders slot prefix for named slots", () => {
      const tree = rootNode({
        children: [
          node({ key: "AppBar_a", type: "AppBar", slot: "appBar" }),
          node({ key: "Column_b", type: "Column", slot: "body" }),
        ],
      });
      const output = formatPageSummary(pageMeta(), tree);
      expect(output).toContain("[appBar] AppBar");
      expect(output).toContain("[body] Column");
    });

    it("does not render slot prefix for children or root slots", () => {
      const tree = rootNode({
        children: [
          node({ key: "Column_a", type: "Column", slot: "children" }),
        ],
      });
      const output = formatPageSummary(pageMeta(), tree);
      const treeLine = output
        .split("\n")
        .find((l) => l.includes("Column"));
      expect(treeLine).not.toContain("[children]");
    });

    it("renders node name in parentheses", () => {
      const tree = rootNode({
        children: [
          node({
            key: "Button_a",
            type: "Button",
            name: "Submit",
          }),
        ],
      });
      const output = formatPageSummary(pageMeta(), tree);
      expect(output).toContain("Button (Submit)");
    });

    it("renders node detail inline", () => {
      const tree = rootNode({
        children: [
          node({
            key: "Text_a",
            type: "Text",
            detail: '"Hello World"',
          }),
        ],
      });
      const output = formatPageSummary(pageMeta(), tree);
      expect(output).toContain('Text "Hello World"');
    });

    it("renders triggers on child nodes inline", () => {
      const tree = rootNode({
        children: [
          node({
            key: "Button_a",
            type: "Button",
            name: "Login",
            triggers: [
              {
                trigger: "ON_TAP",
                actions: [
                  { type: "navigate", detail: "to Home" },
                  { type: "customAction", detail: "logEvent" },
                ],
              },
            ],
          }),
        ],
      });
      const output = formatPageSummary(pageMeta(), tree);
      expect(output).toContain(
        "Button (Login) \u2192 ON_TAP \u2192 [navigate: to Home, customAction: logEvent]"
      );
    });

    it("renders actions without detail", () => {
      const tree = rootNode({
        children: [
          node({
            key: "Button_a",
            type: "Button",
            triggers: [
              {
                trigger: "ON_TAP",
                actions: [{ type: "navigate", detail: "" }],
              },
            ],
          }),
        ],
      });
      const output = formatPageSummary(pageMeta(), tree);
      expect(output).toContain("ON_TAP \u2192 [navigate]");
    });

    it("renders deep nesting with correct box-drawing indentation", () => {
      const tree = rootNode({
        children: [
          node({
            key: "Column_a",
            type: "Column",
            children: [
              node({
                key: "Row_b",
                type: "Row",
                children: [
                  node({ key: "Text_c", type: "Text" }),
                ],
              }),
            ],
          }),
        ],
      });
      const output = formatPageSummary(pageMeta(), tree);
      const lines = output.split("\n");

      // Find tree lines
      const columnLine = lines.find((l) => l.includes("Column"));
      const rowLine = lines.find((l) => l.includes("Row"));
      const textLine = lines.find((l) => l.includes("Text"));

      expect(columnLine).toBe("\u2514\u2500\u2500 Column");
      expect(rowLine).toBe("    \u2514\u2500\u2500 Row");
      expect(textLine).toBe("        \u2514\u2500\u2500 Text");
    });

    it("renders sibling branches with vertical line connector", () => {
      const tree = rootNode({
        children: [
          node({
            key: "Column_a",
            type: "Column",
            children: [
              node({ key: "Text_1", type: "Text" }),
            ],
          }),
          node({ key: "Button_b", type: "Button" }),
        ],
      });
      const output = formatPageSummary(pageMeta(), tree);
      const lines = output.split("\n");

      // Column is not last, so its child line prefix should use vertical bar
      const textLine = lines.find((l) => l.includes("Text"));
      expect(textLine).toBe("\u2502   \u2514\u2500\u2500 Text");
    });

    it("renders multiple triggers on a single node separated by semicolons", () => {
      const tree = rootNode({
        children: [
          node({
            key: "Button_a",
            type: "Button",
            triggers: [
              {
                trigger: "ON_TAP",
                actions: [{ type: "navigate", detail: "to Home" }],
              },
              {
                trigger: "ON_LONG_PRESS",
                actions: [{ type: "customAction", detail: "showMenu" }],
              },
            ],
          }),
        ],
      });
      const output = formatPageSummary(pageMeta(), tree);
      expect(output).toContain(
        "ON_TAP \u2192 [navigate: to Home]; ON_LONG_PRESS \u2192 [customAction: showMenu]"
      );
    });
  });

  describe("component references", () => {
    it("renders component name in brackets with ID in parentheses", () => {
      const tree = rootNode({
        children: [
          node({
            key: "Container_host1",
            type: "Container",
            componentRef: "Header",
            componentId: "Container_ur4ml9qw",
          }),
        ],
      });
      const output = formatPageSummary(pageMeta(), tree);
      expect(output).toContain("[Header] (Container_ur4ml9qw)");
    });

    it("renders regular Container when no componentRef", () => {
      const tree = rootNode({
        children: [
          node({ key: "Container_plain", type: "Container" }),
        ],
      });
      const output = formatPageSummary(pageMeta(), tree);
      expect(output).toContain("Container");
      expect(output).not.toContain("[Container]");
    });

    it("renders component ref without ID when componentId is undefined", () => {
      const tree = rootNode({
        children: [
          node({
            key: "Container_host2",
            type: "Container",
            componentRef: "SearchBar",
          }),
        ],
      });
      const output = formatPageSummary(pageMeta(), tree);
      expect(output).toContain("[SearchBar]");
      expect(output).not.toContain("(Container_");
    });

    it("renders component ref with triggers inline", () => {
      const tree = rootNode({
        children: [
          node({
            key: "Container_host3",
            type: "Container",
            componentRef: "PostsList",
            componentId: "Container_pgvko7fz",
            triggers: [
              {
                trigger: "CALLBACK",
                actions: [{ type: "updateState", detail: "" }],
              },
            ],
          }),
        ],
      });
      const output = formatPageSummary(pageMeta(), tree);
      expect(output).toContain(
        "[PostsList] (Container_pgvko7fz) \u2192 CALLBACK \u2192 [updateState]"
      );
    });

    it("renders multiple component refs as siblings", () => {
      const tree = rootNode({
        children: [
          node({
            key: "Container_h1",
            type: "Container",
            componentRef: "Header",
            componentId: "Container_aaa",
          }),
          node({
            key: "Container_h2",
            type: "Container",
            componentRef: "SearchBar",
            componentId: "Container_bbb",
          }),
          node({
            key: "Container_h3",
            type: "Container",
            componentRef: "PostsList",
            componentId: "Container_ccc",
          }),
        ],
      });
      const output = formatPageSummary(pageMeta(), tree);
      expect(output).toContain("[Header] (Container_aaa)");
      expect(output).toContain("[SearchBar] (Container_bbb)");
      expect(output).toContain("[PostsList] (Container_ccc)");
    });

    it("renders component ref with slot prefix", () => {
      const tree = rootNode({
        children: [
          node({
            key: "Container_slot",
            type: "Container",
            slot: "body",
            componentRef: "MainContent",
            componentId: "Container_mc",
          }),
        ],
      });
      const output = formatPageSummary(pageMeta(), tree);
      expect(output).toContain("[body] [MainContent] (Container_mc)");
    });

    it("renders nested component refs at any depth", () => {
      const tree = rootNode({
        children: [
          node({
            key: "Column_a",
            type: "Column",
            children: [
              node({
                key: "Container_nested",
                type: "Container",
                componentRef: "NestedWidget",
                componentId: "Container_nw",
              }),
            ],
          }),
        ],
      });
      const output = formatPageSummary(pageMeta(), tree);
      expect(output).toContain("[NestedWidget] (Container_nw)");
    });
  });

  describe("full output structure", () => {
    it("produces correct complete output for a typical page", () => {
      const meta = pageMeta({
        pageName: "HomePage",
        scaffoldId: "Scaffold_home",
        folder: "Main",
        params: [{ name: "userId", dataType: "String" }],
        stateFields: [
          { name: "isLoading", dataType: "bool", defaultValue: "false" },
        ],
      });
      const tree = rootNode({
        triggers: [
          {
            trigger: "ON_INIT_STATE",
            actions: [{ type: "customAction", detail: "loadProfile" }],
          },
        ],
        children: [
          node({
            key: "AppBar_a",
            type: "AppBar",
            slot: "appBar",
          }),
          node({
            key: "Column_b",
            type: "Column",
            slot: "body",
            children: [
              node({ key: "Text_c", type: "Text", detail: '"Welcome"' }),
              node({
                key: "Button_d",
                type: "Button",
                name: "Continue",
                triggers: [
                  {
                    trigger: "ON_TAP",
                    actions: [
                      { type: "navigate", detail: "to Dashboard" },
                    ],
                  },
                ],
              }),
            ],
          }),
        ],
      });

      const output = formatPageSummary(meta, tree);
      const lines = output.split("\n");

      expect(lines[0]).toBe("HomePage (Scaffold_home) \u2014 folder: Main");
      expect(lines[1]).toBe("Params: userId (String)");
      expect(lines[2]).toBe("State: isLoading (bool, default: false)");
      expect(lines[3]).toBe(""); // blank line before triggers
      expect(lines[4]).toBe(
        "ON_INIT_STATE \u2192 [customAction: loadProfile]"
      );
      expect(lines[5]).toBe(""); // blank line before widget tree
      expect(lines[6]).toBe("Widget Tree:");
      expect(lines[7]).toBe("\u251C\u2500\u2500 [appBar] AppBar");
      expect(lines[8]).toBe(
        '\u2514\u2500\u2500 [body] Column'
      );
      expect(lines[9]).toBe('    \u251C\u2500\u2500 Text "Welcome"');
      expect(lines[10]).toBe(
        "    \u2514\u2500\u2500 Button (Continue) \u2192 ON_TAP \u2192 [navigate: to Dashboard]"
      );
    });
  });
});

describe("formatComponentSummary", () => {
  describe("header", () => {
    it("renders component name and container ID", () => {
      const meta = componentMeta({
        componentName: "UserCard",
        containerId: "Container_uc",
      });
      const tree = rootNode({ key: "Container_uc", type: "Container" });
      const output = formatComponentSummary(meta, tree);
      const firstLine = output.split("\n")[0];
      expect(firstLine).toBe("UserCard (Container_uc)");
    });

    it("renders description when present", () => {
      const meta = componentMeta({
        description: "Displays a user profile card",
      });
      const tree = rootNode();
      const output = formatComponentSummary(meta, tree);
      expect(output).toContain(
        "Description: Displays a user profile card"
      );
    });

    it("omits description when empty", () => {
      const meta = componentMeta({ description: "" });
      const tree = rootNode();
      const output = formatComponentSummary(meta, tree);
      expect(output).not.toContain("Description:");
    });
  });

  describe("params", () => {
    it("renders params with type", () => {
      const meta = componentMeta({
        params: [{ name: "title", dataType: "String" }],
      });
      const tree = rootNode();
      const output = formatComponentSummary(meta, tree);
      expect(output).toContain("Params: title (String)");
    });

    it("renders params with default values", () => {
      const meta = componentMeta({
        params: [
          { name: "count", dataType: "int", defaultValue: "1" },
        ],
      });
      const tree = rootNode();
      const output = formatComponentSummary(meta, tree);
      expect(output).toContain("Params: count (int, default: 1)");
    });

    it("omits params line when there are no params", () => {
      const meta = componentMeta({ params: [] });
      const tree = rootNode();
      const output = formatComponentSummary(meta, tree);
      expect(output).not.toContain("Params:");
    });
  });

  describe("triggers", () => {
    it("renders root-level triggers", () => {
      const tree = rootNode({
        triggers: [
          {
            trigger: "ON_INIT_STATE",
            actions: [{ type: "stateUpdate", detail: "set loading=true" }],
          },
        ],
      });
      const output = formatComponentSummary(componentMeta(), tree);
      expect(output).toContain(
        "ON_INIT_STATE \u2192 [stateUpdate: set loading=true]"
      );
    });
  });

  describe("widget tree", () => {
    it("renders widget tree section", () => {
      const tree = rootNode({
        children: [
          node({ key: "Row_a", type: "Row" }),
        ],
      });
      const output = formatComponentSummary(componentMeta(), tree);
      expect(output).toContain("Widget Tree:");
      expect(output).toContain("\u2514\u2500\u2500 Row");
    });
  });

  describe("nested component references", () => {
    it("renders nested component ref inside a component", () => {
      const tree = rootNode({
        key: "Container_outer",
        type: "Container",
        children: [
          node({
            key: "Container_inner",
            type: "Container",
            componentRef: "InnerWidget",
            componentId: "Container_iw123",
          }),
        ],
      });
      const output = formatComponentSummary(componentMeta(), tree);
      expect(output).toContain("[InnerWidget] (Container_iw123)");
    });
  });

  describe("full output structure", () => {
    it("produces correct complete output for a typical component", () => {
      const meta = componentMeta({
        componentName: "PremiumBadge",
        containerId: "Container_pb",
        description: "Shows gold badge for premium users",
        params: [
          { name: "isPremium", dataType: "bool", defaultValue: "false" },
        ],
      });
      const tree = rootNode({
        key: "Container_pb",
        type: "Container",
        triggers: [
          {
            trigger: "ON_INIT_STATE",
            actions: [{ type: "customAction", detail: "checkPremium" }],
          },
        ],
        children: [
          node({
            key: "Stack_a",
            type: "Stack",
            children: [
              node({ key: "Image_badge", type: "Image", detail: "badge.png" }),
              node({
                key: "Text_label",
                type: "Text",
                detail: '"Premium"',
              }),
            ],
          }),
        ],
      });

      const output = formatComponentSummary(meta, tree);
      const lines = output.split("\n");

      expect(lines[0]).toBe("PremiumBadge (Container_pb)");
      expect(lines[1]).toBe(
        "Description: Shows gold badge for premium users"
      );
      expect(lines[2]).toBe("Params: isPremium (bool, default: false)");
      expect(lines[3]).toBe(""); // blank line before triggers
      expect(lines[4]).toBe(
        "ON_INIT_STATE \u2192 [customAction: checkPremium]"
      );
      expect(lines[5]).toBe(""); // blank line before widget tree
      expect(lines[6]).toBe("Widget Tree:");
      expect(lines[7]).toBe("\u2514\u2500\u2500 Stack");
      expect(lines[8]).toBe("    \u251C\u2500\u2500 Image badge.png");
      expect(lines[9]).toBe('    \u2514\u2500\u2500 Text "Premium"');
    });
  });
});

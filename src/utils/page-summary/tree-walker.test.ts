import { describe, it, expect } from "vitest";
import { parseTreeOutline } from "./tree-walker.js";

describe("parseTreeOutline", () => {
  it("parses a minimal tree with just a root node", () => {
    const yaml = `
node:
  key: Scaffold_abc
`;
    const result = parseTreeOutline(yaml);
    expect(result).toEqual({
      key: "Scaffold_abc",
      slot: "root",
      children: [],
    });
  });

  it("throws on missing root node", () => {
    const yaml = `
something:
  key: Scaffold_abc
`;
    expect(() => parseTreeOutline(yaml)).toThrow(
      "Invalid tree outline: missing root node"
    );
  });

  it("throws on root node without key", () => {
    const yaml = `
node:
  name: No key here
`;
    expect(() => parseTreeOutline(yaml)).toThrow(
      "Invalid tree outline: missing root node"
    );
  });

  it("throws on empty YAML", () => {
    expect(() => parseTreeOutline("")).toThrow();
  });

  it("parses children array", () => {
    const yaml = `
node:
  key: Scaffold_root
  children:
    - key: Column_a
    - key: Button_b
`;
    const result = parseTreeOutline(yaml);
    expect(result.children).toHaveLength(2);
    expect(result.children[0]).toEqual({
      key: "Column_a",
      slot: "children",
      children: [],
    });
    expect(result.children[1]).toEqual({
      key: "Button_b",
      slot: "children",
      children: [],
    });
  });

  it("parses the body named slot", () => {
    const yaml = `
node:
  key: Scaffold_root
  body:
    key: Column_body
`;
    const result = parseTreeOutline(yaml);
    expect(result.children).toHaveLength(1);
    expect(result.children[0]).toEqual({
      key: "Column_body",
      slot: "body",
      children: [],
    });
  });

  it("parses the appBar named slot", () => {
    const yaml = `
node:
  key: Scaffold_root
  appBar:
    key: AppBar_top
`;
    const result = parseTreeOutline(yaml);
    expect(result.children).toHaveLength(1);
    expect(result.children[0]).toEqual({
      key: "AppBar_top",
      slot: "appBar",
      children: [],
    });
  });

  it("parses the title named slot", () => {
    const yaml = `
node:
  key: AppBar_top
  title:
    key: Text_title
`;
    const result = parseTreeOutline(yaml);
    expect(result.children).toHaveLength(1);
    expect(result.children[0]).toEqual({
      key: "Text_title",
      slot: "title",
      children: [],
    });
  });

  it("parses the header named slot", () => {
    const yaml = `
node:
  key: Expandable_root
  header:
    key: Row_header
`;
    const result = parseTreeOutline(yaml);
    expect(result.children).toHaveLength(1);
    expect(result.children[0]).toEqual({
      key: "Row_header",
      slot: "header",
      children: [],
    });
  });

  it("parses the collapsed named slot", () => {
    const yaml = `
node:
  key: Expandable_root
  collapsed:
    key: Container_collapsed
`;
    const result = parseTreeOutline(yaml);
    expect(result.children).toHaveLength(1);
    expect(result.children[0]).toEqual({
      key: "Container_collapsed",
      slot: "collapsed",
      children: [],
    });
  });

  it("parses the expanded named slot", () => {
    const yaml = `
node:
  key: Expandable_root
  expanded:
    key: Container_expanded
`;
    const result = parseTreeOutline(yaml);
    expect(result.children).toHaveLength(1);
    expect(result.children[0]).toEqual({
      key: "Container_expanded",
      slot: "expanded",
      children: [],
    });
  });

  it("parses the floatingActionButton named slot", () => {
    const yaml = `
node:
  key: Scaffold_root
  floatingActionButton:
    key: FAB_main
`;
    const result = parseTreeOutline(yaml);
    expect(result.children).toHaveLength(1);
    expect(result.children[0]).toEqual({
      key: "FAB_main",
      slot: "floatingActionButton",
      children: [],
    });
  });

  it("parses the drawer named slot", () => {
    const yaml = `
node:
  key: Scaffold_root
  drawer:
    key: Drawer_side
`;
    const result = parseTreeOutline(yaml);
    expect(result.children).toHaveLength(1);
    expect(result.children[0]).toEqual({
      key: "Drawer_side",
      slot: "drawer",
      children: [],
    });
  });

  it("parses the endDrawer named slot", () => {
    const yaml = `
node:
  key: Scaffold_root
  endDrawer:
    key: Drawer_end
`;
    const result = parseTreeOutline(yaml);
    expect(result.children).toHaveLength(1);
    expect(result.children[0]).toEqual({
      key: "Drawer_end",
      slot: "endDrawer",
      children: [],
    });
  });

  it("parses the bottomNavigationBar named slot", () => {
    const yaml = `
node:
  key: Scaffold_root
  bottomNavigationBar:
    key: BottomNav_bar
`;
    const result = parseTreeOutline(yaml);
    expect(result.children).toHaveLength(1);
    expect(result.children[0]).toEqual({
      key: "BottomNav_bar",
      slot: "bottomNavigationBar",
      children: [],
    });
  });

  it("parses all 10 named slots simultaneously", () => {
    const yaml = `
node:
  key: Scaffold_root
  body:
    key: Column_body
  appBar:
    key: AppBar_top
  title:
    key: Text_title
  header:
    key: Row_header
  collapsed:
    key: Container_collapsed
  expanded:
    key: Container_expanded
  floatingActionButton:
    key: FAB_main
  drawer:
    key: Drawer_side
  endDrawer:
    key: Drawer_end
  bottomNavigationBar:
    key: BottomNav_bar
`;
    const result = parseTreeOutline(yaml);
    expect(result.children).toHaveLength(10);
    const slots = result.children.map((c) => c.slot);
    expect(slots).toEqual([
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
    ]);
  });

  it("named slots come before children array in order", () => {
    const yaml = `
node:
  key: Scaffold_root
  body:
    key: Column_body
  children:
    - key: Widget_x
`;
    const result = parseTreeOutline(yaml);
    expect(result.children).toHaveLength(2);
    expect(result.children[0].slot).toBe("body");
    expect(result.children[1].slot).toBe("children");
  });

  it("handles deep nesting (3 levels)", () => {
    const yaml = `
node:
  key: Scaffold_root
  body:
    key: Column_level1
    children:
      - key: Row_level2
        children:
          - key: Text_level3
`;
    const result = parseTreeOutline(yaml);
    const body = result.children[0];
    expect(body.key).toBe("Column_level1");
    expect(body.children).toHaveLength(1);

    const row = body.children[0];
    expect(row.key).toBe("Row_level2");
    expect(row.children).toHaveLength(1);

    const text = row.children[0];
    expect(text.key).toBe("Text_level3");
    expect(text.children).toHaveLength(0);
  });

  it("ignores slots with no key", () => {
    const yaml = `
node:
  key: Scaffold_root
  body:
    noKey: true
  appBar:
    key: AppBar_valid
`;
    const result = parseTreeOutline(yaml);
    // body should be skipped because it has no key
    expect(result.children).toHaveLength(1);
    expect(result.children[0].slot).toBe("appBar");
  });

  it("uses 'unknown' for nodes missing key field", () => {
    const yaml = `
node:
  key: Scaffold_root
  children:
    - notKey: something
`;
    const result = parseTreeOutline(yaml);
    expect(result.children).toHaveLength(1);
    expect(result.children[0].key).toBe("unknown");
  });

  it("handles mixed slots and children with deep nesting", () => {
    const yaml = `
node:
  key: Scaffold_root
  appBar:
    key: AppBar_top
    title:
      key: Text_appTitle
  body:
    key: Column_main
    children:
      - key: Button_action
      - key: Container_wrapper
        children:
          - key: Image_logo
  floatingActionButton:
    key: FAB_add
`;
    const result = parseTreeOutline(yaml);

    // Root should have body, appBar, floatingActionButton (in SLOT_KEYS order)
    expect(result.children).toHaveLength(3);
    expect(result.children[0].slot).toBe("body");
    expect(result.children[1].slot).toBe("appBar");
    expect(result.children[2].slot).toBe("floatingActionButton");

    // appBar should have title child
    const appBar = result.children[1];
    expect(appBar.children).toHaveLength(1);
    expect(appBar.children[0].key).toBe("Text_appTitle");
    expect(appBar.children[0].slot).toBe("title");

    // body should have two children
    const body = result.children[0];
    expect(body.children).toHaveLength(2);
    expect(body.children[0].key).toBe("Button_action");
    expect(body.children[1].key).toBe("Container_wrapper");

    // Container_wrapper should have one child
    expect(body.children[1].children).toHaveLength(1);
    expect(body.children[1].children[0].key).toBe("Image_logo");
  });
});

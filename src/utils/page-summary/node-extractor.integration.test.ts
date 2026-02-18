import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the cache module BEFORE importing the module under test
vi.mock("../cache.js", () => ({
  cacheRead: vi.fn(),
  cacheWrite: vi.fn(),
  cacheWriteBulk: vi.fn(),
  cacheMeta: vi.fn(),
  cacheWriteMeta: vi.fn(),
  cacheInvalidate: vi.fn(),
  listCachedKeys: vi.fn(),
  cacheDir: vi.fn(),
}));

import { cacheRead } from "../cache.js";
import { extractNodeInfo } from "./node-extractor.js";

const mockedCacheRead = vi.mocked(cacheRead);

const PROJECT_ID = "test-project";
const PAGE_PREFIX = "page/id-Scaffold_abc/page-widget-tree-outline";

beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// extractNodeInfo — integration tests using mocked cache
// ---------------------------------------------------------------------------
describe("extractNodeInfo", () => {
  it("returns type from doc.type, name from doc.name, and detail from extractDetail", async () => {
    mockedCacheRead.mockResolvedValue(
      `type: Text\nname: greeting\nprops:\n  text:\n    textValue:\n      inputValue: Hello World`
    );

    const info = await extractNodeInfo(PROJECT_ID, PAGE_PREFIX, "Text_abc123");

    expect(info.type).toBe("Text");
    expect(info.name).toBe("greeting");
    expect(info.detail).toBe('"Hello World"');
    expect(mockedCacheRead).toHaveBeenCalledWith(
      PROJECT_ID,
      `${PAGE_PREFIX}/node/id-Text_abc123`
    );
  });

  it("when cache returns null, uses inferTypeFromKey for type, empty name and detail", async () => {
    mockedCacheRead.mockResolvedValue(null);

    const info = await extractNodeInfo(PROJECT_ID, PAGE_PREFIX, "Button_xyz");

    expect(info.type).toBe("Button");
    expect(info.name).toBe("");
    expect(info.detail).toBe("");
  });

  it("extracts text value as quoted string for Text widget", async () => {
    mockedCacheRead.mockResolvedValue(
      [
        "type: Text",
        "name: subtitle",
        "props:",
        "  text:",
        "    textValue:",
        "      inputValue: Welcome back",
      ].join("\n")
    );

    const info = await extractNodeInfo(PROJECT_ID, PAGE_PREFIX, "Text_sub1");
    expect(info.type).toBe("Text");
    expect(info.detail).toBe('"Welcome back"');
  });

  it("extracts button label as quoted string for Button widget", async () => {
    mockedCacheRead.mockResolvedValue(
      [
        "type: Button",
        "name: submitBtn",
        "props:",
        "  button:",
        "    text:",
        "      textValue:",
        "        inputValue: Submit",
      ].join("\n")
    );

    const info = await extractNodeInfo(PROJECT_ID, PAGE_PREFIX, "Button_s1");
    expect(info.type).toBe("Button");
    expect(info.name).toBe("submitBtn");
    expect(info.detail).toBe('"Submit"');
  });

  it("extracts filename from path and dimensions for Image widget", async () => {
    mockedCacheRead.mockResolvedValue(
      [
        "type: Image",
        "name: logo",
        "props:",
        "  image:",
        "    pathValue:",
        "      inputValue: assets/images/logo.png",
        "    dimensions:",
        "      width:",
        "        pixelsValue:",
        "          inputValue: 200",
        "      height:",
        "        pixelsValue:",
        "          inputValue: 100",
      ].join("\n")
    );

    const info = await extractNodeInfo(PROJECT_ID, PAGE_PREFIX, "Image_img1");
    expect(info.type).toBe("Image");
    expect(info.name).toBe("logo");
    expect(info.detail).toBe("logo.png [200x100]");
  });

  it("extracts icon name for Icon widget", async () => {
    mockedCacheRead.mockResolvedValue(
      [
        "type: Icon",
        "name: menuIcon",
        "props:",
        "  icon:",
        "    iconDataValue:",
        "      inputValue:",
        "        name: Icons.menu",
      ].join("\n")
    );

    const info = await extractNodeInfo(PROJECT_ID, PAGE_PREFIX, "Icon_i1");
    expect(info.type).toBe("Icon");
    expect(info.name).toBe("menuIcon");
    expect(info.detail).toBe("Icons.menu");
  });

  it("extracts hint text for TextField widget", async () => {
    mockedCacheRead.mockResolvedValue(
      [
        "type: TextField",
        "name: emailField",
        "props:",
        "  textField:",
        "    inputDecoration:",
        "      hintText:",
        "        textValue:",
        "          inputValue: Enter your email",
      ].join("\n")
    );

    const info = await extractNodeInfo(PROJECT_ID, PAGE_PREFIX, "TextField_tf1");
    expect(info.type).toBe("TextField");
    expect(info.name).toBe("emailField");
    expect(info.detail).toBe('hint: "Enter your email"');
  });

  it("falls back to inferTypeFromKey when YAML parse fails", async () => {
    // Return invalid YAML that will cause YAML.parse to throw
    mockedCacheRead.mockResolvedValue(":::invalid yaml{{{");

    const info = await extractNodeInfo(PROJECT_ID, PAGE_PREFIX, "Column_col1");
    expect(info.type).toBe("Column");
    expect(info.name).toBe("");
    expect(info.detail).toBe("");
  });

  it("uses inferTypeFromKey when doc.type is missing", async () => {
    mockedCacheRead.mockResolvedValue("name: myWidget\nprops: {}");

    const info = await extractNodeInfo(PROJECT_ID, PAGE_PREFIX, "Container_c1");
    expect(info.type).toBe("Container");
    expect(info.name).toBe("myWidget");
  });

  it("returns empty detail when text widget has no text prop", async () => {
    mockedCacheRead.mockResolvedValue(
      [
        "type: Text",
        "name: emptyText",
        "props: {}",
      ].join("\n")
    );

    const info = await extractNodeInfo(PROJECT_ID, PAGE_PREFIX, "Text_empty");
    expect(info.type).toBe("Text");
    expect(info.detail).toBe("");
  });

  it("handles dynamic variable reference in text value", async () => {
    mockedCacheRead.mockResolvedValue(
      [
        "type: Text",
        "name: dynamicText",
        "props:",
        "  text:",
        "    textValue:",
        "      variable:",
        "        source: PAGE_STATE",
        "        name: userName",
      ].join("\n")
    );

    const info = await extractNodeInfo(PROJECT_ID, PAGE_PREFIX, "Text_dyn1");
    expect(info.type).toBe("Text");
    expect(info.detail).toBe('"[dynamic]"');
  });

  it("extracts Image with dynamic path", async () => {
    mockedCacheRead.mockResolvedValue(
      [
        "type: Image",
        "name: avatar",
        "props:",
        "  image:",
        "    pathValue:",
        "      variable:",
        "        source: APP_STATE",
        "        name: avatarUrl",
      ].join("\n")
    );

    const info = await extractNodeInfo(PROJECT_ID, PAGE_PREFIX, "Image_dyn");
    expect(info.type).toBe("Image");
    expect(info.detail).toBe("[dynamic]");
  });

  // -------------------------------------------------------------------------
  // Component reference resolution
  // -------------------------------------------------------------------------

  it("resolves componentRef and componentId when componentClassKeyRef is present", async () => {
    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === `${PAGE_PREFIX}/node/id-Container_host1`) {
        return [
          "key: Container_host1",
          "type: Container",
          "props: {}",
          "parameterValues:",
          "  widgetClassNodeKeyRef:",
          "    key: Container_ur4ml9qw",
          "componentClassKeyRef:",
          "  key: Container_ur4ml9qw",
        ].join("\n");
      }
      if (key === "component/id-Container_ur4ml9qw") {
        return "name: Header\ndescription: Top navigation bar";
      }
      return null;
    });

    const info = await extractNodeInfo(PROJECT_ID, PAGE_PREFIX, "Container_host1");
    expect(info.type).toBe("Container");
    expect(info.componentRef).toBe("Header");
    expect(info.componentId).toBe("Container_ur4ml9qw");
  });

  it("returns componentId but undefined componentRef when component definition not found", async () => {
    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === `${PAGE_PREFIX}/node/id-Container_orphan`) {
        return [
          "key: Container_orphan",
          "type: Container",
          "props: {}",
          "componentClassKeyRef:",
          "  key: Container_missing",
        ].join("\n");
      }
      // component definition not in cache
      return null;
    });

    const info = await extractNodeInfo(PROJECT_ID, PAGE_PREFIX, "Container_orphan");
    expect(info.type).toBe("Container");
    expect(info.componentId).toBe("Container_missing");
    expect(info.componentRef).toBeUndefined();
  });

  it("returns no componentRef or componentId for regular widgets without componentClassKeyRef", async () => {
    mockedCacheRead.mockResolvedValue(
      [
        "key: Column_plain",
        "type: Column",
        "props:",
        "  column:",
        "    crossAxisAlignmentValue:",
        "      inputValue: START",
      ].join("\n")
    );

    const info = await extractNodeInfo(PROJECT_ID, PAGE_PREFIX, "Column_plain");
    expect(info.type).toBe("Column");
    expect(info.componentRef).toBeUndefined();
    expect(info.componentId).toBeUndefined();
  });

  it("returns no componentRef when cache returns null (fallback path)", async () => {
    mockedCacheRead.mockResolvedValue(null);

    const info = await extractNodeInfo(PROJECT_ID, PAGE_PREFIX, "Container_gone");
    expect(info.type).toBe("Container");
    expect(info.componentRef).toBeUndefined();
    expect(info.componentId).toBeUndefined();
  });

  it("resolves componentRef with parameter passes present", async () => {
    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === `${PAGE_PREFIX}/node/id-Container_withparams`) {
        return [
          "key: Container_withparams",
          "type: Container",
          "props: {}",
          "parameterValues:",
          "  parameterPasses:",
          "    cqmxop:",
          "      paramIdentifier:",
          "        name: isSearch",
          "        key: cqmxop",
          "      inputValue:",
          '        serializedValue: "false"',
          "  widgetClassNodeKeyRef:",
          "    key: Container_pgvko7fz",
          "componentClassKeyRef:",
          "  key: Container_pgvko7fz",
        ].join("\n");
      }
      if (key === "component/id-Container_pgvko7fz") {
        return "name: PostsList\ndescription: Feed list";
      }
      return null;
    });

    const info = await extractNodeInfo(PROJECT_ID, PAGE_PREFIX, "Container_withparams");
    expect(info.componentRef).toBe("PostsList");
    expect(info.componentId).toBe("Container_pgvko7fz");
  });
});

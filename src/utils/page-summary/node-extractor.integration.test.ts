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
});

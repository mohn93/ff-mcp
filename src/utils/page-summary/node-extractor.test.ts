import { describe, it, expect } from "vitest";
import { inferTypeFromKey, resolveValue } from "./node-extractor.js";

// ---------------------------------------------------------------------------
// inferTypeFromKey
// ---------------------------------------------------------------------------
describe("inferTypeFromKey", () => {
  it("extracts type from 'Text_abc123'", () => {
    expect(inferTypeFromKey("Text_abc123")).toBe("Text");
  });

  it("extracts type from 'Button_xyz'", () => {
    expect(inferTypeFromKey("Button_xyz")).toBe("Button");
  });

  it("extracts type from 'CachedNetworkImage_abc'", () => {
    expect(inferTypeFromKey("CachedNetworkImage_abc")).toBe("CachedNetworkImage");
  });

  it("extracts type from 'Column_12ab'", () => {
    expect(inferTypeFromKey("Column_12ab")).toBe("Column");
  });

  it("extracts type from 'FFButtonWidget_qwerty'", () => {
    expect(inferTypeFromKey("FFButtonWidget_qwerty")).toBe("FFButtonWidget");
  });

  it("extracts type from 'Icon_a1b2c3'", () => {
    expect(inferTypeFromKey("Icon_a1b2c3")).toBe("Icon");
  });

  it("returns 'Unknown' for keys with no underscore", () => {
    expect(inferTypeFromKey("unknown")).toBe("Unknown");
  });

  it("returns 'Unknown' for keys starting with lowercase", () => {
    expect(inferTypeFromKey("lowercase_abc")).toBe("Unknown");
  });

  it("returns 'Unknown' for an empty string", () => {
    expect(inferTypeFromKey("")).toBe("Unknown");
  });

  it("returns 'Unknown' for keys starting with a number", () => {
    expect(inferTypeFromKey("123_abc")).toBe("Unknown");
  });
});

// ---------------------------------------------------------------------------
// resolveValue
// ---------------------------------------------------------------------------
describe("resolveValue", () => {
  it("returns empty string for null", () => {
    expect(resolveValue(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(resolveValue(undefined)).toBe("");
  });

  it("returns the string itself for a plain string", () => {
    expect(resolveValue("hello")).toBe("hello");
  });

  it("returns stringified number for a plain number", () => {
    expect(resolveValue(42)).toBe("42");
  });

  it("returns stringified number for zero", () => {
    expect(resolveValue(0)).toBe("0");
  });

  it("returns empty string for boolean input", () => {
    expect(resolveValue(true)).toBe("");
  });

  it("resolves inputValue when it is a string", () => {
    expect(resolveValue({ inputValue: "myValue" })).toBe("myValue");
  });

  it("resolves inputValue when it is a number", () => {
    expect(resolveValue({ inputValue: 99 })).toBe("99");
  });

  it("resolves inputValue with serializedValue", () => {
    expect(
      resolveValue({ inputValue: { serializedValue: "serialized_data" } })
    ).toBe("serialized_data");
  });

  it("resolves inputValue with themeColor", () => {
    expect(
      resolveValue({ inputValue: { themeColor: "primaryColor" } })
    ).toBe("[theme:primaryColor]");
  });

  it("resolves inputValue with value", () => {
    expect(
      resolveValue({ inputValue: { value: "#FF0000" } })
    ).toBe("#FF0000");
  });

  it("resolves inputValue object with no recognized inner key as empty string", () => {
    expect(resolveValue({ inputValue: { unknownKey: true } })).toBe("");
  });

  it("resolves variable reference as '[dynamic]'", () => {
    expect(resolveValue({ variable: { source: "PAGE_STATE" } })).toBe("[dynamic]");
  });

  it("returns empty string for object with no recognized keys", () => {
    expect(resolveValue({ someOtherKey: "data" })).toBe("");
  });

  it("returns empty string for empty object", () => {
    expect(resolveValue({})).toBe("");
  });

  it("prefers inputValue over variable when both present", () => {
    expect(
      resolveValue({ inputValue: "preferred", variable: { source: "APP_STATE" } })
    ).toBe("preferred");
  });

  it("resolves inputValue number 0 correctly", () => {
    expect(resolveValue({ inputValue: 0 })).toBe("0");
  });
});

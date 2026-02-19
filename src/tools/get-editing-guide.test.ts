import { describe, it, expect, beforeEach } from "vitest";
import { createMockServer } from "../__helpers__/mock-server.js";
import { registerGetEditingGuideTool } from "./get-editing-guide.js";

describe("get_editing_guide tool", () => {
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    const mock = createMockServer();
    registerGetEditingGuideTool(mock.server as any);
    getHandler = mock.getHandler;
  });

  it("registers with the correct tool name", () => {
    expect(() => getHandler("get_editing_guide")).not.toThrow();
  });

  it("returns edit-existing workflow for 'change button color'", async () => {
    const handler = getHandler("get_editing_guide");
    const result = await handler({ task: "change button color" });
    const text = result.content[0].text;

    expect(text).toContain("Editing Existing");
    expect(text.toLowerCase()).toContain("button");
    expect(text).toContain("inputValue");
  });

  it("returns add-widget workflow for 'add a TextField to the login page'", async () => {
    const handler = getHandler("get_editing_guide");
    const result = await handler({ task: "add a TextField to the login page" });
    const text = result.content[0].text;

    expect(text).toContain("Adding New Widgets");
    // Should match text-field doc via TOPIC_MAP
    expect(text.toLowerCase()).toContain("text");
  });

  it("returns create-component workflow for 'create a reusable header component'", async () => {
    const handler = getHandler("get_editing_guide");
    const result = await handler({
      task: "create a reusable header component",
    });
    const text = result.content[0].text;

    expect(text).toContain("Component");
    expect(text.toLowerCase()).toContain("component");
  });

  it("includes projectId in workflow when provided", async () => {
    const handler = getHandler("get_editing_guide");
    const result = await handler({
      task: "change button color",
      projectId: "abc-123",
    });
    const text = result.content[0].text;

    expect(text).toContain("abc-123");
  });

  it("returns general guide when no keywords match — still has universal rules", async () => {
    const handler = getHandler("get_editing_guide");
    const result = await handler({ task: "do something with xyz" });
    const text = result.content[0].text;

    // Should still contain universal rules
    expect(text).toContain("inputValue");
    expect(text).toContain("validate_yaml");
  });

  it("matches multiple widget topics from a single task", async () => {
    const handler = getHandler("get_editing_guide");
    const result = await handler({ task: "add a Button and TextField" });
    const text = result.content[0].text;

    // Both button and text-field docs should be referenced
    expect(text.toLowerCase()).toContain("button");
    expect(text.toLowerCase()).toContain("text");
  });

  it("returns configure-project workflow for 'change theme colors'", async () => {
    const handler = getHandler("get_editing_guide");
    const result = await handler({ task: "change theme colors" });
    const text = result.content[0].text;

    expect(text).toContain("Configuring");
    // Should match theming doc
    expect(text.toLowerCase()).toContain("theming");
  });

  it("returns add-widget workflow when 'insert' keyword is used", async () => {
    const handler = getHandler("get_editing_guide");
    const result = await handler({ task: "insert an image widget" });
    const text = result.content[0].text;

    expect(text).toContain("Adding New Widgets");
  });

  it("component keywords take priority over add keywords", async () => {
    const handler = getHandler("get_editing_guide");
    const result = await handler({ task: "add a reusable component" });
    const text = result.content[0].text;

    // component + add → create-component, not add-widget
    expect(text).toContain("Component");
  });

  it("returns fallback message when no docs match task words", async () => {
    const handler = getHandler("get_editing_guide");
    const result = await handler({ task: "fix zzzznonexistent" });
    const text = result.content[0].text;

    expect(text).toContain("get_yaml_docs");
  });
});

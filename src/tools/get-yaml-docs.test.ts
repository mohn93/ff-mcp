import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockServer } from "../__helpers__/mock-server.js";
import { registerGetYamlDocsTool } from "./get-yaml-docs.js";

/**
 * This tool reads from the bundled docs/ff-yaml/ directory on disk.
 * Tests here use the actual filesystem since the docs are committed to the repo.
 * No mocking needed — we verify the tool reads and returns content correctly.
 */
describe("get_yaml_docs tool", () => {
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    const mock = createMockServer();
    registerGetYamlDocsTool(mock.server as any);
    getHandler = mock.getHandler;
  });

  it("registers with the correct tool name", () => {
    expect(() => getHandler("get_yaml_docs")).not.toThrow();
  });

  it("returns README content when no params provided", async () => {
    const handler = getHandler("get_yaml_docs");
    const result = await handler({});

    // Should return the README or a file listing
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text.length).toBeGreaterThan(0);
  });

  it("returns doc by file path", async () => {
    const handler = getHandler("get_yaml_docs");
    const result = await handler({ file: "05-actions" });

    expect(result.content[0].text.length).toBeGreaterThan(100);
    // The actions doc should contain action-related content
    expect(result.content[0].text.toLowerCase()).toContain("action");
  });

  it("returns error for non-existent file with available files list", async () => {
    const handler = getHandler("get_yaml_docs");
    const result = await handler({ file: "non-existent-doc" });

    expect(result.content[0].text).toContain("Doc file not found");
    expect(result.content[0].text).toContain("Available files");
  });

  it("returns doc by topic keyword (mapped)", async () => {
    const handler = getHandler("get_yaml_docs");
    const result = await handler({ topic: "Button" });

    expect(result.content[0].text).toContain("Matched:");
    expect(result.content[0].text.toLowerCase()).toContain("button");
  });

  it("returns doc by topic keyword (actions)", async () => {
    const handler = getHandler("get_yaml_docs");
    const result = await handler({ topic: "actions" });

    expect(result.content[0].text).toContain("Matched:");
  });

  it("handles case-insensitive topic search", async () => {
    const handler = getHandler("get_yaml_docs");
    const result = await handler({ topic: "THEMING" });

    expect(result.content[0].text).toContain("Matched:");
  });

  it("returns no docs found message for unknown topic", async () => {
    const handler = getHandler("get_yaml_docs");
    const result = await handler({ topic: "zzzznonexistenttopiczzz" });

    expect(result.content[0].text).toContain("No docs found for topic");
    expect(result.content[0].text).toContain("Available docs");
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { createMockServer } from "../__helpers__/mock-server.js";
import { createMockClient, asClient } from "../__helpers__/mock-client.js";
import { registerValidateYamlTool } from "./validate-yaml.js";

describe("validate_yaml tool", () => {
  let mockClient: ReturnType<typeof createMockClient>;
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    mockClient = createMockClient();
    const mock = createMockServer();
    registerValidateYamlTool(mock.server as any, asClient(mockClient));
    getHandler = mock.getHandler;
  });

  it("registers with the correct tool name", () => {
    expect(() => getHandler("validate_yaml")).not.toThrow();
  });

  it("passes projectId, fileKey, and fileContent to client", async () => {
    const fakeResult = { valid: true };
    mockClient.validateProjectYaml.mockResolvedValue(fakeResult);

    const handler = getHandler("validate_yaml");
    const result = await handler({
      projectId: "proj-123",
      fileKey: "page/id-Scaffold_abc",
      fileContent: "name: TestPage",
    });

    expect(mockClient.validateProjectYaml).toHaveBeenCalledWith(
      "proj-123",
      "page/id-Scaffold_abc",
      "name: TestPage"
    );
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual(fakeResult);
  });

  it("returns validation errors from the API", async () => {
    const errorResult = { valid: false, errors: ["Missing required field: name"] };
    mockClient.validateProjectYaml.mockResolvedValue(errorResult);

    const handler = getHandler("validate_yaml");
    const result = await handler({
      projectId: "proj-123",
      fileKey: "app-details",
      fileContent: "invalid: yaml",
    });

    const text = result.content[0].text;
    // Text now contains JSON + hint suffix; extract JSON portion
    const jsonPart = text.substring(0, text.indexOf("\n\nHint:"));
    const parsed = JSON.parse(jsonPart);
    expect(parsed.valid).toBe(false);
    expect(parsed.errors).toContain("Missing required field: name");
  });

  it("includes widget-specific doc hint when validation fails with a widget fileKey", async () => {
    const errorResult = { valid: false, errors: ["Unknown field name 'badField'"] };
    mockClient.validateProjectYaml.mockResolvedValue(errorResult);

    const handler = getHandler("validate_yaml");
    const result = await handler({
      projectId: "proj-123",
      fileKey: "page/id-Scaffold_abc/page-widget-tree-outline/node/id-Button_xyz",
      fileContent: "badField: true",
    });

    const text = result.content[0].text;
    expect(text).toContain("get_yaml_docs");
    expect(text).toContain("Button");
  });

  it("includes generic doc hint when validation fails with a non-widget fileKey", async () => {
    const errorResult = { valid: false, errors: ["Missing required field"] };
    mockClient.validateProjectYaml.mockResolvedValue(errorResult);

    const handler = getHandler("validate_yaml");
    const result = await handler({
      projectId: "proj-123",
      fileKey: "app-details",
      fileContent: "invalid: yaml",
    });

    const text = result.content[0].text;
    expect(text).toContain("get_yaml_docs");
    expect(text).not.toContain("Button");
  });

  it("does not include doc hint when validation succeeds", async () => {
    const okResult = { valid: true };
    mockClient.validateProjectYaml.mockResolvedValue(okResult);

    const handler = getHandler("validate_yaml");
    const result = await handler({
      projectId: "proj-123",
      fileKey: "page/id-Scaffold_abc/page-widget-tree-outline/node/id-Button_xyz",
      fileContent: "key: Button_xyz",
    });

    const text = result.content[0].text;
    expect(text).not.toContain("Hint");
  });
});

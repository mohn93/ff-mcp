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

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.valid).toBe(false);
    expect(parsed.errors).toContain("Missing required field: name");
  });
});

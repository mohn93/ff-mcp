import { describe, it, expect, beforeEach } from "vitest";
import { createMockServer } from "../__helpers__/mock-server.js";
import { createMockClient, asClient } from "../__helpers__/mock-client.js";
import { registerListProjectsTool } from "./list-projects.js";

describe("list_projects tool", () => {
  let mockClient: ReturnType<typeof createMockClient>;
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    mockClient = createMockClient();
    const mock = createMockServer();
    registerListProjectsTool(mock.server as any, asClient(mockClient));
    getHandler = mock.getHandler;
  });

  it("registers with the correct tool name", () => {
    // getHandler would throw if not registered
    expect(() => getHandler("list_projects")).not.toThrow();
  });

  it("calls client.listProjects without project_type when omitted", async () => {
    const fakeResult = [{ id: "proj-1", name: "My App" }];
    mockClient.listProjects.mockResolvedValue(fakeResult);

    const handler = getHandler("list_projects");
    const result = await handler({});

    expect(mockClient.listProjects).toHaveBeenCalledWith(undefined);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual(fakeResult);
  });

  it("passes project_type filter to client.listProjects", async () => {
    const fakeResult = [{ id: "proj-2", name: "Flutter App" }];
    mockClient.listProjects.mockResolvedValue(fakeResult);

    const handler = getHandler("list_projects");
    const result = await handler({ project_type: "flutterflow" });

    expect(mockClient.listProjects).toHaveBeenCalledWith("flutterflow");
    expect(JSON.parse(result.content[0].text)).toEqual(fakeResult);
  });

  it("returns JSON.stringify with 2-space indentation", async () => {
    mockClient.listProjects.mockResolvedValue({ key: "value" });

    const handler = getHandler("list_projects");
    const result = await handler({});

    expect(result.content[0].text).toBe(JSON.stringify({ key: "value" }, null, 2));
  });
});

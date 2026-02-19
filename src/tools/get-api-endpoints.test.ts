import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock all dependencies BEFORE imports
vi.mock("../utils/cache.js", () => ({
  cacheRead: vi.fn(),
  cacheWrite: vi.fn(),
  cacheWriteBulk: vi.fn(),
  cacheMeta: vi.fn(),
  cacheAgeFooter: vi.fn(() => ""),
  cacheWriteMeta: vi.fn(),
  cacheInvalidate: vi.fn(),
  listCachedKeys: vi.fn(),
  cacheDir: vi.fn(),
}));

vi.mock("../utils/batch-process.js", () => ({
  batchProcess: vi.fn(async (items: unknown[], _size: number, fn: (item: unknown) => Promise<unknown>) => {
    const results: unknown[] = [];
    for (const item of items) results.push(await fn(item));
    return results;
  }),
}));

import { createMockServer } from "../__helpers__/mock-server.js";
import { registerGetApiEndpointsTool } from "./get-api-endpoints.js";
import { cacheRead, cacheMeta, listCachedKeys } from "../utils/cache.js";

const mockedCacheRead = vi.mocked(cacheRead);
const mockedCacheMeta = vi.mocked(cacheMeta);
const mockedListCachedKeys = vi.mocked(listCachedKeys);

// ---------------------------------------------------------------------------
// Sample YAML helpers
// ---------------------------------------------------------------------------

const ENDPOINT_YAML_GET_USERS = `
identifier:
  name: GetUsers
callType: GET
url: https://api.example.com/users
bodyType: JSON
variables:
  - identifier: { name: userId }
    type: String
headers:
  - "Authorization: Bearer {{token}}"
jsonPathDefinitions:
  - identifier: { name: items }
    jsonPath:
      jsonPath: "$.data"
      returnParameter:
        dataType:
          scalarType: String
`;

const ENDPOINT_YAML_CREATE_ORDER = `
identifier:
  name: CreateOrder
callType: POST
url: https://api.example.com/orders
bodyType: JSON
variables:
  - identifier: { name: productId }
    type: Integer
  - identifier: { name: quantity }
    type: Integer
headers:
  - "Content-Type: application/json"
  - "Authorization: Bearer {{token}}"
jsonPathDefinitions:
  - identifier: { name: orderId }
    jsonPath:
      jsonPath: "$.id"
      returnParameter:
        dataType:
          scalarType: Integer
  - identifier: { name: status }
    jsonPath:
      jsonPath: "$.status"
      returnParameter:
        dataType:
          scalarType: String
`;

// ---------------------------------------------------------------------------
// get_api_endpoints handler
// ---------------------------------------------------------------------------
describe("get_api_endpoints handler", () => {
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockServer();
    registerGetApiEndpointsTool(mock.server as any);
    getHandler = mock.getHandler;
  });

  it("registers with the correct tool name", () => {
    expect(() => getHandler("get_api_endpoints")).not.toThrow();
  });

  it("returns 'No cache found' error when cacheMeta returns null", async () => {
    mockedCacheMeta.mockResolvedValue(null);

    const handler = getHandler("get_api_endpoints");
    const result = await handler({ projectId: "proj-no-cache" });

    expect(result.content[0].text).toContain("No cache found");
    expect(result.content[0].text).toContain("proj-no-cache");
    expect(result.content[0].text).toContain("sync_project");
  });

  it("returns 'No API endpoints found' when no api-endpoint keys exist", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 5,
      syncMethod: "bulk",
    });
    mockedListCachedKeys.mockResolvedValue([]);

    const handler = getHandler("get_api_endpoints");
    const result = await handler({ projectId: "proj-1" });

    expect(result.content[0].text).toContain("No API endpoints found");
  });

  it("parses and formats a single endpoint with all fields", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });
    mockedListCachedKeys.mockResolvedValue(["api-endpoint/id-abc123"]);
    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "api-endpoint/id-abc123") return ENDPOINT_YAML_GET_USERS;
      return null;
    });

    const handler = getHandler("get_api_endpoints");
    const result = await handler({ projectId: "proj-1" });

    const text = result.content[0].text;
    expect(text).toContain("# API Endpoints (1)");
    expect(text).toContain("## GetUsers");
    expect(text).toContain("Method: GET");
    expect(text).toContain("URL: https://api.example.com/users");
    expect(text).toContain("Body type: JSON");
    expect(text).toContain("Variables:");
    expect(text).toContain("- userId: String");
    expect(text).toContain("Headers:");
    expect(text).toContain("- Authorization: Bearer {{token}}");
    expect(text).toContain("Response fields:");
    expect(text).toContain("- items: String ($.data)");
  });

  it("name filter works (case-insensitive match)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });
    mockedListCachedKeys.mockResolvedValue([
      "api-endpoint/id-abc123",
      "api-endpoint/id-def456",
    ]);
    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "api-endpoint/id-abc123") return ENDPOINT_YAML_GET_USERS;
      if (key === "api-endpoint/id-def456") return ENDPOINT_YAML_CREATE_ORDER;
      return null;
    });

    const handler = getHandler("get_api_endpoints");
    const result = await handler({ projectId: "proj-1", name: "getusers" });

    const text = result.content[0].text;
    expect(text).toContain("# API Endpoints (1)");
    expect(text).toContain("## GetUsers");
    expect(text).not.toContain("CreateOrder");
  });

  it("name filter returns 'No API endpoints matching' when no match", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });
    mockedListCachedKeys.mockResolvedValue(["api-endpoint/id-abc123"]);
    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "api-endpoint/id-abc123") return ENDPOINT_YAML_GET_USERS;
      return null;
    });

    const handler = getHandler("get_api_endpoints");
    const result = await handler({ projectId: "proj-1", name: "NonExistent" });

    const text = result.content[0].text;
    expect(text).toContain("No API endpoints matching");
    expect(text).toContain("NonExistent");
    expect(text).toContain("GetUsers");
  });

  it("handles multiple endpoints", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });
    mockedListCachedKeys.mockResolvedValue([
      "api-endpoint/id-abc123",
      "api-endpoint/id-def456",
    ]);
    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "api-endpoint/id-abc123") return ENDPOINT_YAML_GET_USERS;
      if (key === "api-endpoint/id-def456") return ENDPOINT_YAML_CREATE_ORDER;
      return null;
    });

    const handler = getHandler("get_api_endpoints");
    const result = await handler({ projectId: "proj-1" });

    const text = result.content[0].text;
    expect(text).toContain("# API Endpoints (2)");
    expect(text).toContain("## GetUsers");
    expect(text).toContain("Method: GET");
    expect(text).toContain("## CreateOrder");
    expect(text).toContain("Method: POST");
    expect(text).toContain("URL: https://api.example.com/orders");
    expect(text).toContain("- productId: Integer");
    expect(text).toContain("- quantity: Integer");
    expect(text).toContain("- orderId: Integer ($.id)");
    expect(text).toContain("- status: String ($.status)");
  });
});

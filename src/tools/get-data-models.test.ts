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

vi.mock("../utils/resolve-data-type.js", () => ({
  resolveDataType: vi.fn((dt: Record<string, unknown>) => (dt.scalarType as string) || "unknown"),
}));

import { createMockServer } from "../__helpers__/mock-server.js";
import { registerGetDataModelsTool } from "./get-data-models.js";
import { cacheRead, cacheMeta, listCachedKeys } from "../utils/cache.js";

const mockedCacheRead = vi.mocked(cacheRead);
const mockedCacheMeta = vi.mocked(cacheMeta);
const mockedListCachedKeys = vi.mocked(listCachedKeys);

// ---------------------------------------------------------------------------
// get_data_models handler
// ---------------------------------------------------------------------------
describe("get_data_models handler", () => {
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockServer();
    registerGetDataModelsTool(mock.server as any);
    getHandler = mock.getHandler;
  });

  it("registers with the correct tool name", () => {
    expect(() => getHandler("get_data_models")).not.toThrow();
  });

  it("returns 'No cache found' error when cacheMeta returns null", async () => {
    mockedCacheMeta.mockResolvedValue(null);

    const handler = getHandler("get_data_models");
    const result = await handler({ projectId: "proj-no-cache" });

    expect(result.content[0].text).toContain("No cache found");
    expect(result.content[0].text).toContain("sync_project");
  });

  it("parses data structs (fields with types)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedListCachedKeys.mockImplementation(async (_pid, prefix) => {
      if (prefix === "data-structs/id-") return ["data-structs/id-abc123"];
      return [];
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "data-structs/id-abc123") {
        return [
          "identifier: { name: MyStruct }",
          "fields:",
          "  - identifier: { name: field1 }",
          "    dataType: { scalarType: String }",
          "  - identifier: { name: field2 }",
          "    dataType: { scalarType: Integer }",
        ].join("\n");
      }
      return null;
    });

    const handler = getHandler("get_data_models");
    const result = await handler({ projectId: "proj-1", type: "structs" });

    const text = result.content[0].text;
    expect(text).toContain("Data Structs (1)");
    expect(text).toContain("### MyStruct");
    expect(text).toContain("- field1: String");
    expect(text).toContain("- field2: Integer");
  });

  it("parses enums (name + values)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedListCachedKeys.mockImplementation(async (_pid, prefix) => {
      if (prefix === "enums/id-") return ["enums/id-def456"];
      return [];
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "enums/id-def456") {
        return [
          "identifier: { name: Status }",
          "elements:",
          "  - identifier: { name: ACTIVE }",
          "  - identifier: { name: INACTIVE }",
        ].join("\n");
      }
      return null;
    });

    const handler = getHandler("get_data_models");
    const result = await handler({ projectId: "proj-1", type: "enums" });

    const text = result.content[0].text;
    expect(text).toContain("Enums (1)");
    expect(text).toContain("### Status");
    expect(text).toContain("Values: ACTIVE, INACTIVE");
  });

  it("parses collections (fields, sub-collection parent)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedListCachedKeys.mockImplementation(async (_pid, prefix) => {
      if (prefix === "collections/id-") return ["collections/id-ghi789"];
      return [];
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "collections/id-ghi789") {
        return [
          "identifier: { name: messages }",
          "parentCollectionIdentifier: { name: users }",
          "fields:",
          "  fieldKey1:",
          "    identifier: { name: email }",
          "    dataType: { scalarType: String }",
          "  fieldKey2:",
          "    identifier: { name: age }",
          "    dataType: { scalarType: Integer }",
        ].join("\n");
      }
      return null;
    });

    const handler = getHandler("get_data_models");
    const result = await handler({ projectId: "proj-1", type: "collections" });

    const text = result.content[0].text;
    expect(text).toContain("Collections (1)");
    expect(text).toContain("### messages (sub-collection of users)");
    expect(text).toContain("- email: String");
    expect(text).toContain("- age: Integer");
  });

  it("parses supabase tables (PK, required, FK flags)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedListCachedKeys.mockResolvedValue([]);

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "supabase") {
        return [
          "databaseConfig:",
          "  tables:",
          "    - identifier: { name: profiles }",
          "      fields:",
          "        - identifier: { name: id }",
          "          type:",
          "            dataType: { scalarType: Integer }",
          "          postgresType: int4",
          "          isPrimaryKey: true",
          "          isRequired: true",
          "          hasDefault: true",
          "          foreignKey: null",
          "        - identifier: { name: user_id }",
          "          type:",
          "            dataType: { scalarType: String }",
          "          postgresType: uuid",
          "          isPrimaryKey: false",
          "          isRequired: true",
          "          hasDefault: false",
          "          foreignKey: auth.users.id",
        ].join("\n");
      }
      return null;
    });

    const handler = getHandler("get_data_models");
    const result = await handler({ projectId: "proj-1", type: "supabase" });

    const text = result.content[0].text;
    expect(text).toContain("Supabase Tables (1)");
    expect(text).toContain("### profiles");
    expect(text).toContain("- id: Integer [int4] (PK, required, has default)");
    expect(text).toContain("- user_id: String [uuid] (required, FK");
    expect(text).toContain("auth.users.id");
  });

  it("type filter works (e.g. type='structs' only returns structs)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    // Set up both structs and enums in the cache
    mockedListCachedKeys.mockImplementation(async (_pid, prefix) => {
      if (prefix === "data-structs/id-") return ["data-structs/id-s1"];
      if (prefix === "enums/id-") return ["enums/id-e1"];
      return [];
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "data-structs/id-s1") {
        return "identifier: { name: StructOne }\nfields:\n  - identifier: { name: x }\n    dataType: { scalarType: String }";
      }
      if (key === "enums/id-e1") {
        return "identifier: { name: EnumOne }\nelements:\n  - identifier: { name: A }";
      }
      return null;
    });

    const handler = getHandler("get_data_models");
    const result = await handler({ projectId: "proj-1", type: "structs" });

    const text = result.content[0].text;
    expect(text).toContain("Data Structs");
    expect(text).toContain("StructOne");
    // Enums should NOT appear when filtered to structs only
    expect(text).not.toContain("EnumOne");
    expect(text).not.toContain("Enums");
  });

  it("name filter works (case-insensitive exact match)", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedListCachedKeys.mockImplementation(async (_pid, prefix) => {
      if (prefix === "data-structs/id-") return ["data-structs/id-s1", "data-structs/id-s2"];
      if (prefix === "enums/id-") return [];
      if (prefix === "collections/id-") return [];
      return [];
    });

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "data-structs/id-s1") {
        return "identifier: { name: UserProfile }\nfields:\n  - identifier: { name: name }\n    dataType: { scalarType: String }";
      }
      if (key === "data-structs/id-s2") {
        return "identifier: { name: OrderItem }\nfields:\n  - identifier: { name: qty }\n    dataType: { scalarType: Integer }";
      }
      return null;
    });

    const handler = getHandler("get_data_models");
    // Use mixed case to verify case-insensitive matching
    const result = await handler({ projectId: "proj-1", name: "userprofile" });

    const text = result.content[0].text;
    expect(text).toContain("UserProfile");
    expect(text).not.toContain("OrderItem");
  });

  it("returns 'No data models found' when empty", async () => {
    mockedCacheMeta.mockResolvedValue({
      lastSyncedAt: "2025-01-01",
      fileCount: 10,
      syncMethod: "bulk",
    });

    mockedListCachedKeys.mockResolvedValue([]);
    mockedCacheRead.mockResolvedValue(null);

    const handler = getHandler("get_data_models");
    const result = await handler({ projectId: "proj-1" });

    expect(result.content[0].text).toContain("No data models found");
  });
});

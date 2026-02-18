import { describe, it, expect, afterAll } from "vitest";
import { rm } from "node:fs/promises";
import {
  cacheRead,
  cacheWrite,
  cacheWriteBulk,
  cacheMeta,
  cacheWriteMeta,
  cacheInvalidate,
  listCachedKeys,
  cacheDir,
} from "./cache.js";
import type { CacheMeta } from "./cache.js";

// Use a unique project ID so this test does not collide with real data
const TEST_PROJECT_ID = `test-cache-${Date.now()}`;

// Clean up the temp cache dir after all tests
afterAll(async () => {
  const dir = cacheDir(TEST_PROJECT_ID);
  await rm(dir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// cacheWrite + cacheRead
// ---------------------------------------------------------------------------
describe("cacheWrite + cacheRead", () => {
  it("writes then reads a file", async () => {
    await cacheWrite(TEST_PROJECT_ID, "simple-file", "hello: world");
    const content = await cacheRead(TEST_PROJECT_ID, "simple-file");
    expect(content).toBe("hello: world");
  });

  it("returns null for a non-existent file", async () => {
    const content = await cacheRead(TEST_PROJECT_ID, "does-not-exist");
    expect(content).toBeNull();
  });

  it("creates nested directories for deeply nested file keys", async () => {
    const fileKey = "page/id-Scaffold_abc/page-widget-tree-outline/node/id-Text_xyz";
    const yamlContent = "type: Text\nname: myText";
    await cacheWrite(TEST_PROJECT_ID, fileKey, yamlContent);
    const content = await cacheRead(TEST_PROJECT_ID, fileKey);
    expect(content).toBe(yamlContent);
  });

  it("overwrites an existing file", async () => {
    await cacheWrite(TEST_PROJECT_ID, "overwrite-me", "version: 1");
    await cacheWrite(TEST_PROJECT_ID, "overwrite-me", "version: 2");
    const content = await cacheRead(TEST_PROJECT_ID, "overwrite-me");
    expect(content).toBe("version: 2");
  });
});

// ---------------------------------------------------------------------------
// cacheWriteBulk
// ---------------------------------------------------------------------------
describe("cacheWriteBulk", () => {
  it("writes multiple entries and returns the count", async () => {
    const entries: Record<string, string> = {
      "bulk/file-a": "content-a",
      "bulk/file-b": "content-b",
      "bulk/file-c": "content-c",
    };
    const count = await cacheWriteBulk(TEST_PROJECT_ID, entries);
    expect(count).toBe(3);
  });

  it("all bulk-written entries are readable", async () => {
    const a = await cacheRead(TEST_PROJECT_ID, "bulk/file-a");
    const b = await cacheRead(TEST_PROJECT_ID, "bulk/file-b");
    const c = await cacheRead(TEST_PROJECT_ID, "bulk/file-c");
    expect(a).toBe("content-a");
    expect(b).toBe("content-b");
    expect(c).toBe("content-c");
  });

  it("returns 0 for an empty entries object", async () => {
    const count = await cacheWriteBulk(TEST_PROJECT_ID, {});
    expect(count).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// cacheWriteMeta + cacheMeta
// ---------------------------------------------------------------------------
describe("cacheWriteMeta + cacheMeta", () => {
  it("writes and reads _meta.json", async () => {
    const meta: CacheMeta = {
      lastSyncedAt: "2026-02-18T12:00:00Z",
      fileCount: 42,
      syncMethod: "bulk",
    };
    await cacheWriteMeta(TEST_PROJECT_ID, meta);
    const read = await cacheMeta(TEST_PROJECT_ID);
    expect(read).toEqual(meta);
  });

  it("returns null when no _meta.json exists", async () => {
    const read = await cacheMeta(`nonexistent-project-${Date.now()}`);
    expect(read).toBeNull();
  });

  it("overwrites existing meta", async () => {
    const metaV2: CacheMeta = {
      lastSyncedAt: "2026-02-18T13:00:00Z",
      fileCount: 99,
      syncMethod: "batched",
    };
    await cacheWriteMeta(TEST_PROJECT_ID, metaV2);
    const read = await cacheMeta(TEST_PROJECT_ID);
    expect(read).toEqual(metaV2);
  });
});

// ---------------------------------------------------------------------------
// cacheInvalidate
// ---------------------------------------------------------------------------
describe("cacheInvalidate", () => {
  it("deletes an existing file", async () => {
    await cacheWrite(TEST_PROJECT_ID, "to-delete", "goodbye");
    // Confirm it exists
    expect(await cacheRead(TEST_PROJECT_ID, "to-delete")).toBe("goodbye");
    // Invalidate it
    await cacheInvalidate(TEST_PROJECT_ID, "to-delete");
    // Confirm it is gone
    expect(await cacheRead(TEST_PROJECT_ID, "to-delete")).toBeNull();
  });

  it("is a no-op when the file does not exist (no error)", async () => {
    // Should not throw
    await expect(
      cacheInvalidate(TEST_PROJECT_ID, "never-existed")
    ).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// listCachedKeys
// ---------------------------------------------------------------------------
describe("listCachedKeys", () => {
  it("returns all keys without .yaml extension", async () => {
    // We already wrote: simple-file, page/id-Scaffold_abc/.../id-Text_xyz,
    // overwrite-me, bulk/file-a, bulk/file-b, bulk/file-c
    // (to-delete was invalidated)
    const keys = await listCachedKeys(TEST_PROJECT_ID);
    expect(keys).toContain("simple-file");
    expect(keys).toContain("overwrite-me");
    expect(keys).toContain("bulk/file-a");
    expect(keys).toContain("bulk/file-b");
    expect(keys).toContain("bulk/file-c");
    expect(keys).toContain(
      "page/id-Scaffold_abc/page-widget-tree-outline/node/id-Text_xyz"
    );
    // Deleted file should NOT be present
    expect(keys).not.toContain("to-delete");
  });

  it("filters by prefix", async () => {
    const keys = await listCachedKeys(TEST_PROJECT_ID, "bulk/");
    expect(keys).toEqual(
      expect.arrayContaining(["bulk/file-a", "bulk/file-b", "bulk/file-c"])
    );
    // Should NOT include non-bulk keys
    expect(keys).not.toContain("simple-file");
    expect(keys).not.toContain("overwrite-me");
  });

  it("returns empty array when the cache dir does not exist", async () => {
    const keys = await listCachedKeys(`nonexistent-project-${Date.now()}`);
    expect(keys).toEqual([]);
  });

  it("returns empty array when prefix matches nothing", async () => {
    const keys = await listCachedKeys(TEST_PROJECT_ID, "no-match/");
    expect(keys).toEqual([]);
  });
});

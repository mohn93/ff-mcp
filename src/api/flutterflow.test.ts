import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FlutterFlowClient, createClient } from "./flutterflow.js";

const BASE_URL = "https://api.flutterflow.io/v2";
const TEST_TOKEN = "test-api-token-abc123";

/** Helper: build a successful fetch Response mock. */
function mockOkResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

/** Helper: build a failed fetch Response mock. */
function mockErrorResponse(status: number, errorText: string): Response {
  return {
    ok: false,
    status,
    json: () => Promise.reject(new Error("should not call json on error")),
    text: () => Promise.resolve(errorText),
  } as unknown as Response;
}

describe("FlutterFlowClient", () => {
  let client: FlutterFlowClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    client = new FlutterFlowClient(TEST_TOKEN);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Shared header assertions ──────────────────────────────────────

  function expectAuthHeaders(callIndex = 0) {
    const [, init] = fetchMock.mock.calls[callIndex];
    expect(init.headers).toMatchObject({
      Authorization: `Bearer ${TEST_TOKEN}`,
      "Content-Type": "application/json",
    });
  }

  // ── listProjects ──────────────────────────────────────────────────

  describe("listProjects", () => {
    it("POSTs to /l/listProjects with default deserialize_response=true", async () => {
      const responseBody = { projects: [{ id: "p1" }] };
      fetchMock.mockResolvedValueOnce(mockOkResponse(responseBody));

      const result = await client.listProjects();

      expect(fetchMock).toHaveBeenCalledOnce();
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/l/listProjects`);
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body)).toEqual({
        project_type: undefined,
        deserialize_response: true,
      });
      expectAuthHeaders();
      expect(result).toEqual(responseBody);
    });

    it("passes projectType and deserializeResponse when provided", async () => {
      fetchMock.mockResolvedValueOnce(mockOkResponse({ projects: [] }));

      await client.listProjects("FLUTTER", false);

      const [, init] = fetchMock.mock.calls[0];
      expect(JSON.parse(init.body)).toEqual({
        project_type: "FLUTTER",
        deserialize_response: false,
      });
    });
  });

  // ── listPartitionedFileNames ──────────────────────────────────────

  describe("listPartitionedFileNames", () => {
    it("GETs with encoded projectId in query string", async () => {
      const responseBody = { value: { file_names: ["page/id-abc"] } };
      fetchMock.mockResolvedValueOnce(mockOkResponse(responseBody));

      const result = await client.listPartitionedFileNames("my/project+id");

      expect(fetchMock).toHaveBeenCalledOnce();
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(
        `${BASE_URL}/listPartitionedFileNames?projectId=${encodeURIComponent("my/project+id")}`
      );
      expect(init.method).toBe("GET");
      expect(init.body).toBeUndefined();
      expectAuthHeaders();
      expect(result).toEqual(responseBody);
    });
  });

  // ── getProjectYamls ───────────────────────────────────────────────

  describe("getProjectYamls", () => {
    it("GETs with only projectId when fileName is omitted", async () => {
      const responseBody = { yaml: "base64zip" };
      fetchMock.mockResolvedValueOnce(mockOkResponse(responseBody));

      const result = await client.getProjectYamls("proj-123");

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(
        `${BASE_URL}/projectYamls?projectId=${encodeURIComponent("proj-123")}`
      );
      expect(init.method).toBe("GET");
      expect(init.body).toBeUndefined();
      expectAuthHeaders();
      expect(result).toEqual(responseBody);
    });

    it("GETs with both projectId and fileName when fileName is provided", async () => {
      const responseBody = { yaml: "base64zip" };
      fetchMock.mockResolvedValueOnce(mockOkResponse(responseBody));

      await client.getProjectYamls("proj-123", "page/id-Scaffold_abc");

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(
        `${BASE_URL}/projectYamls?projectId=${encodeURIComponent("proj-123")}&fileName=${encodeURIComponent("page/id-Scaffold_abc")}`
      );
    });

    it("encodes special characters in fileName", async () => {
      fetchMock.mockResolvedValueOnce(mockOkResponse({}));

      await client.getProjectYamls("proj", "page/id-Scaffold_abc/node/id-Widget xyz");

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain(
        `fileName=${encodeURIComponent("page/id-Scaffold_abc/node/id-Widget xyz")}`
      );
    });
  });

  // ── validateProjectYaml ───────────────────────────────────────────

  describe("validateProjectYaml", () => {
    it("POSTs with projectId, fileKey, and fileContent", async () => {
      const responseBody = { valid: true };
      fetchMock.mockResolvedValueOnce(mockOkResponse(responseBody));

      const yamlContent = "name: MyWidget\ntype: Button";
      const result = await client.validateProjectYaml(
        "proj-123",
        "page/id-Scaffold_abc",
        yamlContent
      );

      expect(fetchMock).toHaveBeenCalledOnce();
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/validateProjectYaml`);
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body)).toEqual({
        projectId: "proj-123",
        fileKey: "page/id-Scaffold_abc",
        fileContent: yamlContent,
      });
      expectAuthHeaders();
      expect(result).toEqual(responseBody);
    });
  });

  // ── updateProjectByYaml ───────────────────────────────────────────

  describe("updateProjectByYaml", () => {
    it("POSTs with projectId and fileKeyToContent map", async () => {
      const responseBody = { success: true };
      fetchMock.mockResolvedValueOnce(mockOkResponse(responseBody));

      const fileKeyToContent = {
        "page/id-Scaffold_abc": "name: Updated",
        "page/id-Scaffold_def": "name: Another",
      };
      const result = await client.updateProjectByYaml("proj-123", fileKeyToContent);

      expect(fetchMock).toHaveBeenCalledOnce();
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/updateProjectByYaml`);
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body)).toEqual({
        projectId: "proj-123",
        fileKeyToContent,
      });
      expectAuthHeaders();
      expect(result).toEqual(responseBody);
    });
  });

  // ── Error handling ────────────────────────────────────────────────

  describe("error handling", () => {
    it("throws with status and error text on 403 response", async () => {
      fetchMock.mockResolvedValueOnce(
        mockErrorResponse(403, "Forbidden: invalid token")
      );

      await expect(client.listProjects()).rejects.toThrow(
        "FlutterFlow API error 403: Forbidden: invalid token"
      );
    });

    it("throws with status and error text on 500 response", async () => {
      fetchMock.mockResolvedValueOnce(
        mockErrorResponse(500, "Internal Server Error")
      );

      await expect(
        client.getProjectYamls("proj-123")
      ).rejects.toThrow("FlutterFlow API error 500: Internal Server Error");
    });

    it("throws on non-ok response for POST methods", async () => {
      fetchMock.mockResolvedValueOnce(
        mockErrorResponse(422, "Validation failed: bad YAML")
      );

      await expect(
        client.validateProjectYaml("proj", "key", "bad content")
      ).rejects.toThrow("FlutterFlow API error 422: Validation failed: bad YAML");
    });

    it("propagates network errors from fetch", async () => {
      fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

      await expect(client.listProjects()).rejects.toThrow("fetch failed");
    });
  });
});

// ── createClient ──────────────────────────────────────────────────

describe("createClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("throws when FLUTTERFLOW_API_TOKEN is not set", () => {
    vi.stubEnv("FLUTTERFLOW_API_TOKEN", "");

    expect(() => createClient()).toThrow(
      "FLUTTERFLOW_API_TOKEN environment variable is required"
    );
  });

  it("throws when FLUTTERFLOW_API_TOKEN is undefined", () => {
    delete process.env.FLUTTERFLOW_API_TOKEN;

    expect(() => createClient()).toThrow(
      "FLUTTERFLOW_API_TOKEN environment variable is required"
    );
  });

  it("returns a FlutterFlowClient when token is set", () => {
    vi.stubEnv("FLUTTERFLOW_API_TOKEN", "my-real-token");

    const client = createClient();

    expect(client).toBeInstanceOf(FlutterFlowClient);
  });
});

/**
 * Factory for creating a mock FlutterFlowClient with vi.fn() stubs.
 */
import { vi } from "vitest";
import type { FlutterFlowClient } from "../api/flutterflow.js";

export interface MockFlutterFlowClient {
  listProjects: ReturnType<typeof vi.fn>;
  listPartitionedFileNames: ReturnType<typeof vi.fn>;
  getProjectYamls: ReturnType<typeof vi.fn>;
  validateProjectYaml: ReturnType<typeof vi.fn>;
  updateProjectByYaml: ReturnType<typeof vi.fn>;
}

export function createMockClient(): MockFlutterFlowClient {
  return {
    listProjects: vi.fn(),
    listPartitionedFileNames: vi.fn(),
    getProjectYamls: vi.fn(),
    validateProjectYaml: vi.fn(),
    updateProjectByYaml: vi.fn(),
  };
}

/**
 * Cast the mock to the real client type for use in register functions.
 */
export function asClient(mock: MockFlutterFlowClient): FlutterFlowClient {
  return mock as unknown as FlutterFlowClient;
}

const FF_API_BASE = "https://api.flutterflow.io/v2";

export class FlutterFlowClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<unknown> {
    const url = `${FF_API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `FlutterFlow API error ${res.status}: ${errorText}`
      );
    }

    return res.json();
  }

  async listProjects(
    projectType?: string,
    deserializeResponse?: boolean
  ): Promise<unknown> {
    return this.request("POST", "/l/listProjects", {
      project_type: projectType,
      deserialize_response: deserializeResponse ?? false,
    });
  }

  async listPartitionedFileNames(projectId: string): Promise<unknown> {
    return this.request(
      "GET",
      `/listPartitionedFileNames?projectId=${encodeURIComponent(projectId)}`
    );
  }

  async getProjectYamls(
    projectId: string,
    fileName?: string
  ): Promise<unknown> {
    let endpoint = `/projectYamls?projectId=${encodeURIComponent(projectId)}`;
    if (fileName) {
      endpoint += `&fileName=${encodeURIComponent(fileName)}`;
    }
    return this.request("GET", endpoint);
  }

  async validateProjectYaml(
    projectId: string,
    fileKey: string,
    fileContent: string
  ): Promise<unknown> {
    return this.request("POST", "/validateProjectYaml", {
      projectId,
      fileKey,
      fileContent,
    });
  }

  async updateProjectByYaml(
    projectId: string,
    fileKeyToContent: Record<string, string>
  ): Promise<unknown> {
    return this.request("POST", "/updateProjectByYaml", {
      projectId,
      fileKeyToContent,
    });
  }
}

export function createClient(): FlutterFlowClient {
  const token = process.env.FLUTTERFLOW_API_TOKEN;
  if (!token) {
    throw new Error(
      "FLUTTERFLOW_API_TOKEN environment variable is required. " +
        "Get your token from FlutterFlow > Account Settings > API Token."
    );
  }
  return new FlutterFlowClient(token);
}

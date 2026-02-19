import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import YAML from "yaml";
import { cacheRead, cacheMeta, cacheAgeFooter, listCachedKeys } from "../utils/cache.js";
import { batchProcess } from "../utils/batch-process.js";

interface ApiEndpoint {
  name: string;
  method: string;
  url: string;
  bodyType?: string;
  body?: string;
  variables: { name: string; type: string }[];
  headers: string[];
  responseFields: { name: string; type: string; jsonPath: string }[];
}

function parseEndpoint(content: string): ApiEndpoint | null {
  const doc = YAML.parse(content) as Record<string, unknown>;
  if (!doc) return null;

  const identifier = doc.identifier as Record<string, unknown> | undefined;
  const name = (identifier?.name as string) || "Unknown";
  const method = (doc.callType as string) || "GET";
  const url = (doc.url as string) || "";
  const bodyType = doc.bodyType as string | undefined;
  const body = doc.body as string | undefined;

  const variables: { name: string; type: string }[] = [];
  const rawVars = doc.variables as Record<string, unknown>[] | undefined;
  if (Array.isArray(rawVars)) {
    for (const v of rawVars) {
      const vid = v.identifier as Record<string, unknown> | undefined;
      const vName = (vid?.name as string) || "unknown";
      const vType = (v.type as string) || "String";
      variables.push({ name: vName, type: vType });
    }
  }

  const headers: string[] = [];
  const rawHeaders = doc.headers as string[] | undefined;
  if (Array.isArray(rawHeaders)) {
    headers.push(...rawHeaders);
  }

  const responseFields: { name: string; type: string; jsonPath: string }[] = [];
  const rawJsonPaths = doc.jsonPathDefinitions as Record<string, unknown>[] | undefined;
  if (Array.isArray(rawJsonPaths)) {
    for (const jp of rawJsonPaths) {
      const jpId = jp.identifier as Record<string, unknown> | undefined;
      const jpName = (jpId?.name as string) || "unknown";
      const jpDef = jp.jsonPath as Record<string, unknown> | undefined;
      const path = (jpDef?.jsonPath as string) || "";
      const returnParam = jpDef?.returnParameter as Record<string, unknown> | undefined;
      const dt = returnParam?.dataType as Record<string, unknown> | undefined;
      const scalarType = (dt?.scalarType as string) || "String";
      responseFields.push({ name: jpName, type: scalarType, jsonPath: path });
    }
  }

  return { name, method, url, bodyType, body, variables, headers, responseFields };
}

function formatEndpoints(endpoints: ApiEndpoint[]): string {
  if (endpoints.length === 0) return "No API endpoints found in cache.";

  const lines: string[] = [`# API Endpoints (${endpoints.length})`];

  for (const ep of endpoints) {
    lines.push("");
    lines.push(`## ${ep.name}`);
    lines.push(`Method: ${ep.method}`);
    lines.push(`URL: ${ep.url}`);
    if (ep.bodyType) lines.push(`Body type: ${ep.bodyType}`);
    if (ep.variables.length > 0) {
      lines.push("Variables:");
      for (const v of ep.variables) {
        lines.push(`  - ${v.name}: ${v.type}`);
      }
    }
    if (ep.headers.length > 0) {
      lines.push("Headers:");
      for (const h of ep.headers) {
        lines.push(`  - ${h}`);
      }
    }
    if (ep.responseFields.length > 0) {
      lines.push("Response fields:");
      for (const rf of ep.responseFields) {
        lines.push(`  - ${rf.name}: ${rf.type} (${rf.jsonPath})`);
      }
    }
  }

  return lines.join("\n");
}

export function registerGetApiEndpointsTool(server: McpServer) {
  server.tool(
    "get_api_endpoints",
    "Get API endpoint definitions from local cache — method, URL, variables, headers, response fields. No API calls. Run sync_project first if not cached.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      name: z
        .string()
        .optional()
        .describe(
          "Case-insensitive filter on endpoint name"
        ),
    },
    async ({ projectId, name }) => {
      const meta = await cacheMeta(projectId);
      if (!meta) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No cache found for project "${projectId}". Run sync_project first to download the project YAML files.`,
            },
          ],
        };
      }

      const allKeys = await listCachedKeys(projectId, "api-endpoint/id-");
      const topLevelKeys = allKeys.filter((k) =>
        /^api-endpoint\/id-[a-z0-9]+$/i.test(k)
      );

      const parsed = await batchProcess(topLevelKeys, 10, async (key) => {
        const content = await cacheRead(projectId, key);
        if (!content) return null;
        return parseEndpoint(content);
      });

      let endpoints = parsed.filter((ep): ep is ApiEndpoint => ep !== null);

      if (name) {
        const lower = name.toLowerCase();
        const filtered = endpoints.filter(
          (ep) => ep.name.toLowerCase().includes(lower)
        );
        if (filtered.length === 0) {
          const available = endpoints.map((ep) => ep.name).join(", ");
          return {
            content: [
              {
                type: "text" as const,
                text: `No API endpoints matching '${name}' found. Available: ${available}`,
              },
            ],
          };
        }
        endpoints = filtered;
      }

      return {
        content: [{ type: "text" as const, text: formatEndpoints(endpoints) + cacheAgeFooter(meta) }],
      };
    }
  );
}

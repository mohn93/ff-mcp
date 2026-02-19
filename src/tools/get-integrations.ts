import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import YAML from "yaml";
import { cacheRead, cacheMeta } from "../utils/cache.js";

/**
 * Fields that should never be output — API keys, secrets, tokens, etc.
 * Only IDs and non-sensitive configuration are shown.
 */
const SENSITIVE_KEYS = new Set([
  "searchApiKey",
  "supabaseAnonKey",
  "supabaseServiceRoleKey",
  "apiKey",
  "secretKey",
  "secret",
  "token",
  "accessToken",
  "refreshToken",
  "privateKey",
]);

/**
 * Integration definition: file key in cache, display name, and optional
 * custom formatter. If no custom formatter is provided, the generic
 * formatter shows `enabled` + all non-sensitive top-level string/boolean fields.
 */
interface IntegrationDef {
  fileKey: string;
  displayName: string;
  format?: (doc: Record<string, unknown>) => string[];
}

// ---------------------------------------------------------------------------
// Custom formatters for specific integrations
// ---------------------------------------------------------------------------

function formatAlgolia(doc: Record<string, unknown>): string[] {
  const lines: string[] = [];
  const enabled = doc.enabled === true;
  lines.push(`Enabled: ${enabled ? "Yes" : "No"}`);

  const appId = (doc.applicationId as string) || "not set";
  lines.push(`Application ID: ${appId}`);

  const collections = doc.indexedCollections as Array<{ name?: string }> | undefined;
  if (collections && collections.length > 0) {
    lines.push(`Indexed collections:`);
    for (const col of collections) {
      lines.push(`  - ${col.name || "unnamed"}`);
    }
  } else {
    lines.push(`Indexed collections: none`);
  }

  return lines;
}

function formatGoogleMaps(doc: Record<string, unknown>): string[] {
  const androidKey = (doc.androidKey as string) || "not set";
  const iosKey = (doc.iosKey as string) || "not set";
  const webKey = (doc.webKey as string) || "not set";

  return [
    `Android key: ${androidKey}`,
    `iOS key: ${iosKey}`,
    `Web key: ${webKey}`,
  ];
}

function formatFirebaseAnalytics(doc: Record<string, unknown>): string[] {
  const lines: string[] = [];
  const enabled = doc.enabled === true;
  lines.push(`Enabled: ${enabled ? "Yes" : "No"}`);

  const settings = doc.automaticEventSettings as Record<string, unknown> | undefined;
  if (settings) {
    lines.push(`Automatic event settings:`);
    lines.push(`  onPageLoad: ${settings.onPageLoad === true ? "Yes" : "No"}`);
    lines.push(`  onActionsStart: ${settings.onActionsStart === true ? "Yes" : "No"}`);
    lines.push(`  onAuth: ${settings.onAuth === true ? "Yes" : "No"}`);
  }

  return lines;
}

/**
 * Generic formatter: shows `enabled` status and all non-sensitive
 * top-level string/boolean fields.
 */
function formatGeneric(doc: Record<string, unknown>): string[] {
  const lines: string[] = [];

  if ("enabled" in doc) {
    lines.push(`Enabled: ${doc.enabled === true ? "Yes" : "No"}`);
  }

  for (const [key, value] of Object.entries(doc)) {
    if (key === "enabled") continue;
    if (SENSITIVE_KEYS.has(key)) continue;
    if (typeof value === "string" || typeof value === "boolean") {
      lines.push(`${key}: ${typeof value === "boolean" ? (value ? "Yes" : "No") : value}`);
    }
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Integration list — order matches the spec
// ---------------------------------------------------------------------------

const INTEGRATIONS: IntegrationDef[] = [
  { fileKey: "supabase", displayName: "Supabase" },
  { fileKey: "sqlite", displayName: "SQLite" },
  { fileKey: "github", displayName: "GitHub" },
  { fileKey: "algolia", displayName: "Algolia", format: formatAlgolia },
  { fileKey: "firebase-analytics", displayName: "Google Analytics", format: formatFirebaseAnalytics },
  { fileKey: "google-maps", displayName: "Google Maps", format: formatGoogleMaps },
  { fileKey: "admob", displayName: "AdMob" },
  { fileKey: "mux", displayName: "Mux Livestream" },
  { fileKey: "onesignal", displayName: "OneSignal" },
  { fileKey: "gemini", displayName: "Gemini" },
];

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerGetIntegrationsTool(server: McpServer) {
  server.tool(
    "get_integrations",
    "Get Integrations settings — Supabase, SQLite, GitHub, Algolia, Google Analytics, Google Maps, AdMob, Mux Livestream, OneSignal, Gemini. Mirrors the FlutterFlow 'Integrations' section. Cache-based, no API calls. Run sync_project first.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
    },
    async ({ projectId }) => {
      const meta = await cacheMeta(projectId);
      if (!meta) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No cache found for project "${projectId}". Run sync_project first.`,
            },
          ],
        };
      }

      // Read all integration files in parallel
      const rawResults = await Promise.all(
        INTEGRATIONS.map((def) => cacheRead(projectId, def.fileKey))
      );

      const sections: string[] = ["# Integrations"];

      for (let i = 0; i < INTEGRATIONS.length; i++) {
        const def = INTEGRATIONS[i];
        const raw = rawResults[i];

        sections.push(`\n## ${def.displayName}`);

        if (!raw) {
          sections.push("(not configured)");
          continue;
        }

        const doc = YAML.parse(raw) as Record<string, unknown>;
        const formatter = def.format || formatGeneric;
        const lines = formatter(doc);
        sections.push(lines.join("\n"));
      }

      return {
        content: [{ type: "text" as const, text: sections.join("\n") }],
      };
    }
  );
}

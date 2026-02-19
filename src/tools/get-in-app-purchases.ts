import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import YAML from "yaml";
import { cacheRead, cacheMeta, cacheAgeFooter } from "../utils/cache.js";

const PROVIDERS = [
  { key: "stripe", label: "Stripe" },
  { key: "braintree", label: "Braintree" },
  { key: "revenue-cat", label: "RevenueCat" },
  { key: "razorpay", label: "Razorpay" },
] as const;

export function registerGetInAppPurchasesTool(server: McpServer) {
  server.tool(
    "get_in_app_purchases",
    "Get In-App Purchases & Subscriptions settings — Stripe, Braintree, RevenueCat, Razorpay. Mirrors the FlutterFlow 'In App Purchases & Subscriptions' section. Cache-based, no API calls. Run sync_project first.",
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

      const sections: string[] = ["# In-App Purchases & Subscriptions"];

      for (const provider of PROVIDERS) {
        const raw = await cacheRead(projectId, provider.key);
        sections.push(`\n## ${provider.label}`);

        if (!raw) {
          sections.push("(not configured)");
          continue;
        }

        const doc = YAML.parse(raw) as Record<string, unknown>;
        const enabled = doc.enabled === true;
        sections.push(`Enabled: ${enabled ? "Yes" : "No"}`);

        // Show any additional top-level scalar fields (skip 'enabled' itself and complex objects)
        for (const [key, value] of Object.entries(doc)) {
          if (key === "enabled") continue;
          if (value === null || value === undefined) continue;
          if (typeof value === "object") continue;
          sections.push(`${key}: ${String(value)}`);
        }
      }

      return {
        content: [{ type: "text" as const, text: sections.join("\n") + cacheAgeFooter(meta) }],
      };
    }
  );
}

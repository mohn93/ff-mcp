import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import YAML from "yaml";
import { cacheRead, cacheMeta, cacheAgeFooter } from "../utils/cache.js";

async function resolvePageName(
  projectId: string,
  scaffoldId: string
): Promise<string> {
  const content = await cacheRead(projectId, `page/id-${scaffoldId}`);
  if (!content) return scaffoldId;
  const nameMatch = content.match(/^name:\s*(.+)$/m);
  return nameMatch ? nameMatch[1].trim() : scaffoldId;
}

export function registerGetGeneralSettingsTool(server: McpServer) {
  server.tool(
    "get_general_settings",
    "Get General settings — App Details (name, package, initial page, routing), App Assets (icon, splash, error image), Nav Bar & App Bar. Mirrors the FlutterFlow 'General' settings section. Cache-based, no API calls. Run sync_project first.",
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

      const [appDetailsRaw, appAssetsRaw, navBarRaw] = await Promise.all([
        cacheRead(projectId, "app-details"),
        cacheRead(projectId, "app-assets"),
        cacheRead(projectId, "nav-bar"),
      ]);

      const sections: string[] = ["# General Settings"];

      // --- App Details ---
      if (appDetailsRaw) {
        const appDetails = YAML.parse(appDetailsRaw) as Record<string, unknown>;
        const appName = (appDetails.name as string) || "Unknown";

        // Package name: take first env's packageName
        let packageName = "not set";
        const allAppNames = appDetails.allAppNames as Record<string, unknown> | undefined;
        const appNames = allAppNames?.appNames as Record<string, Record<string, unknown>> | undefined;
        if (appNames) {
          const firstEnvKey = Object.keys(appNames)[0];
          if (firstEnvKey) {
            packageName = (appNames[firstEnvKey].packageName as string) || "not set";
          }
        }

        // Initial page
        const initialPageKey = (
          appDetails.initialPageKeyRef as Record<string, unknown> | undefined
        )?.key as string | undefined;

        let initialPageLine = "not set";
        if (initialPageKey) {
          const name = await resolvePageName(projectId, initialPageKey);
          initialPageLine = `${name} (${initialPageKey})`;
        }

        // Routing
        const routing = appDetails.routingSettings as Record<string, unknown> | undefined;
        const routingEnabled = routing?.enableRouting === true;
        const subroutes = routing?.pagesAreSubroutesOfRoot === true;

        sections.push(
          `\n## App Details`,
          `Name: ${appName}`,
          `Package name: ${packageName}`,
          `Initial page: ${initialPageLine}`,
          `Routing: ${routingEnabled ? "enabled" : "disabled"}, pages are subroutes: ${subroutes ? "yes" : "no"}`
        );
      } else {
        sections.push(`\n## App Details`, `(not configured)`);
      }

      // --- App Assets ---
      if (appAssetsRaw) {
        const appAssets = YAML.parse(appAssetsRaw) as Record<string, unknown>;
        const appIconPath = (appAssets.appIconPath as string) || "not set";
        const splashImage = appAssets.splashImage as Record<string, unknown> | undefined;
        const errorImagePath = (appAssets.errorImagePath as string) || "not set";

        sections.push(`\n## App Assets`);
        sections.push(`App icon: ${appIconPath}`);

        if (splashImage) {
          const splashPath = (splashImage.path as string) || "not set";
          const splashFit = (splashImage.fit as string) || "not set";
          const splashDuration = splashImage.minSplashScreenDuration as number | undefined;
          sections.push(`Splash image: ${splashPath} (fit: ${splashFit})`);
          if (splashDuration) sections.push(`Splash duration: ${splashDuration}ms`);
        } else {
          sections.push(`Splash image: not set`);
        }

        sections.push(`Error image: ${errorImagePath}`);
      } else {
        sections.push(`\n## App Assets`, `(not configured)`);
      }

      // --- Nav Bar & App Bar ---
      if (navBarRaw) {
        const navBar = YAML.parse(navBarRaw) as Record<string, unknown>;
        const visible = navBar.show === true;

        if (visible) {
          const navType = (navBar.navBarType as string) || "UNKNOWN";
          const labels = navBar.labels === true;
          const pageRefs = navBar.pageKeyRefOrder as Array<Record<string, string>> | undefined;

          sections.push(
            `\n## Nav Bar & App Bar`,
            `Visible: Yes`,
            `Type: ${navType}`,
            `Labels: ${labels ? "Yes" : "No"}`
          );

          if (pageRefs && pageRefs.length > 0) {
            const tabs: string[] = [];
            for (let i = 0; i < pageRefs.length; i++) {
              const scaffoldId = pageRefs[i].key;
              const name = await resolvePageName(projectId, scaffoldId);
              tabs.push(`  ${i + 1}. ${name} (${scaffoldId})`);
            }
            sections.push(`Tabs:`, ...tabs);
          }
        } else {
          sections.push(`\n## Nav Bar & App Bar`, `Visible: No`);
        }
      } else {
        sections.push(`\n## Nav Bar & App Bar`, `(not configured)`);
      }

      return {
        content: [{ type: "text" as const, text: sections.join("\n") + cacheAgeFooter(meta) }],
      };
    }
  );
}

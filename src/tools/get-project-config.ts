import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import YAML from "yaml";
import { cacheRead, cacheMeta, listCachedKeys } from "../utils/cache.js";

async function resolvePageName(
  projectId: string,
  scaffoldId: string
): Promise<string> {
  const content = await cacheRead(projectId, `page/id-${scaffoldId}`);
  if (!content) return scaffoldId;
  const nameMatch = content.match(/^name:\s*(.+)$/m);
  return nameMatch ? nameMatch[1].trim() : scaffoldId;
}

export function registerGetProjectConfigTool(server: McpServer) {
  server.tool(
    "get_project_config",
    "Get core project configuration — app name, entry pages, routing, nav bar, auth, permissions, and services. No API calls. Run sync_project first if not cached.",
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
              text: `No cache found for project "${projectId}". Run sync_project first to download the project YAML files.`,
            },
          ],
        };
      }

      const [appDetailsRaw, navBarRaw, authRaw, permissionsRaw, revenueCatRaw] =
        await Promise.all([
          cacheRead(projectId, "app-details"),
          cacheRead(projectId, "nav-bar"),
          cacheRead(projectId, "authentication"),
          cacheRead(projectId, "permissions"),
          cacheRead(projectId, "revenue-cat"),
        ]);

      const sections: string[] = ["# Project Configuration"];

      // --- App Details ---
      if (appDetailsRaw) {
        const appDetails = YAML.parse(appDetailsRaw) as Record<string, unknown>;
        const appName = (appDetails.name as string) || "Unknown";

        const initialPageKey = (
          appDetails.initialPageKeyRef as Record<string, unknown> | undefined
        )?.key as string | undefined;

        const routing = appDetails.routingSettings as Record<string, unknown> | undefined;
        const routingEnabled = routing?.enableRouting === true;
        const subroutes = routing?.pagesAreSubroutesOfRoot === true;

        let initialPageLine = "not set";
        if (initialPageKey) {
          const name = await resolvePageName(projectId, initialPageKey);
          initialPageLine = `${name} (${initialPageKey})`;
        }

        sections.push(
          `\n## App Details`,
          `Name: ${appName}`,
          `Initial page: ${initialPageLine}`,
          `Routing: ${routingEnabled ? "enabled" : "disabled"}, pages are subroutes: ${subroutes ? "yes" : "no"}`
        );
      } else {
        sections.push(`\n## App Details`, `(not cached)`);
      }

      // --- Authentication ---
      if (authRaw) {
        const auth = YAML.parse(authRaw) as Record<string, unknown>;
        const active = auth.active === true;

        if (active) {
          let provider = "Unknown";
          const firebaseConfigs = auth.firebaseConfigFileInfos as unknown[] | undefined;
          const supabase = auth.supabase as Record<string, unknown> | undefined;
          if (firebaseConfigs && firebaseConfigs.length > 0) {
            provider = "Firebase";
          } else if (supabase && Object.keys(supabase).length > 0) {
            provider = "Supabase";
          }

          sections.push(`\n## Authentication`, `Status: Active`, `Provider: ${provider}`);
        } else {
          sections.push(`\n## Authentication`, `Status: Inactive`);
        }
      } else {
        sections.push(`\n## Authentication`, `Status: Inactive`);
      }

      // Auth page info comes from app-details
      if (appDetailsRaw) {
        const appDetails = YAML.parse(appDetailsRaw) as Record<string, unknown>;
        const authPageInfo = appDetails.authPageInfo as Record<string, unknown> | undefined;
        if (authPageInfo) {
          const homeRef = (
            authPageInfo.homePageNodeKeyRef as Record<string, unknown> | undefined
          )?.key as string | undefined;
          const signInRef = (
            authPageInfo.signInPageNodeKeyRef as Record<string, unknown> | undefined
          )?.key as string | undefined;

          if (homeRef) {
            const name = await resolvePageName(projectId, homeRef);
            sections.push(`Home page: ${name} (${homeRef})`);
          }
          if (signInRef) {
            const name = await resolvePageName(projectId, signInRef);
            sections.push(`Sign-in page: ${name} (${signInRef})`);
          }
        }
      }

      // --- Nav Bar ---
      if (navBarRaw) {
        const navBar = YAML.parse(navBarRaw) as Record<string, unknown>;
        const visible = navBar.show === true;

        if (visible) {
          const navType = (navBar.navBarType as string) || "UNKNOWN";
          const labels = navBar.labels === true;
          const pageRefs = navBar.pageKeyRefOrder as Array<Record<string, string>> | undefined;

          sections.push(
            `\n## Nav Bar`,
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
          sections.push(`\n## Nav Bar`, `Visible: No`);
        }
      } else {
        sections.push(`\n## Nav Bar`, `Visible: No`);
      }

      // --- Permissions ---
      if (permissionsRaw) {
        const permissions = YAML.parse(permissionsRaw) as Record<string, unknown>;
        const builtIn = permissions.permissionMessages as Array<Record<string, unknown>> | undefined;
        const custom = permissions.userDefinedPermissions as Array<Record<string, unknown>> | undefined;

        const hasBuiltIn = builtIn && builtIn.length > 0;
        const hasCustom = custom && custom.length > 0;

        if (hasBuiltIn || hasCustom) {
          sections.push(`\n## Permissions`);

          if (hasBuiltIn) {
            sections.push(`Built-in:`);
            for (const perm of builtIn!) {
              const permType = (perm.permissionType as string) || "UNKNOWN";
              const msg = (
                (perm.message as Record<string, unknown>)?.textValue as Record<string, unknown>
              )?.inputValue as string | undefined;
              sections.push(`  - ${permType}: ${msg ? `"${msg}"` : "(no message)"}`);
            }
          }

          if (hasCustom) {
            sections.push(`Custom:`);
            for (const perm of custom!) {
              const names = perm.names as Record<string, string> | undefined;
              const iosName = names?.iosName || "?";
              const androidName = names?.androidName || "?";
              const msg = (
                (perm.message as Record<string, unknown>)?.textValue as Record<string, unknown>
              )?.inputValue as string | undefined;
              sections.push(
                `  - ${iosName} / ${androidName}: ${msg ? `"${msg}"` : "(no message)"}`
              );
            }
          }
        }
      }

      // --- Services ---
      sections.push(`\n## Services`);
      if (revenueCatRaw) {
        const revenueCat = YAML.parse(revenueCatRaw) as Record<string, unknown>;
        sections.push(`RevenueCat: ${revenueCat.enabled === true ? "enabled" : "disabled"}`);
      } else {
        sections.push(`RevenueCat: disabled`);
      }

      return {
        content: [{ type: "text" as const, text: sections.join("\n") }],
      };
    }
  );
}

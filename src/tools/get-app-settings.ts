import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import YAML from "yaml";
import { cacheRead, cacheMeta } from "../utils/cache.js";

async function resolvePageName(
  projectId: string,
  scaffoldId: string
): Promise<string> {
  const content = await cacheRead(projectId, `page/id-${scaffoldId}`);
  if (!content) return scaffoldId;
  const nameMatch = content.match(/^name:\s*(.+)$/m);
  return nameMatch ? nameMatch[1].trim() : scaffoldId;
}

export function registerGetAppSettingsTool(server: McpServer) {
  server.tool(
    "get_app_settings",
    "Get App Settings — Authentication, Push Notifications, Mobile Deployment (version, build, stores), Web Deployment (SEO, title). Mirrors the FlutterFlow 'App Settings' section. Cache-based, no API calls. Run sync_project first.",
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

      const [authRaw, appDetailsRaw, pushRaw, mobileRaw, webRaw] =
        await Promise.all([
          cacheRead(projectId, "authentication"),
          cacheRead(projectId, "app-details"),
          cacheRead(projectId, "push-notifications"),
          cacheRead(projectId, "mobile-deployment"),
          cacheRead(projectId, "web-publishing"),
        ]);

      const sections: string[] = ["# App Settings"];

      // --- Authentication ---
      sections.push(`\n## Authentication`);
      if (authRaw) {
        const auth = YAML.parse(authRaw) as Record<string, unknown>;
        const active = auth.active === true;

        if (active) {
          let provider = "Unknown";
          const firebaseConfigs = auth.firebaseConfigFileInfos as
            | unknown[]
            | undefined;
          const supabase = auth.supabase as
            | Record<string, unknown>
            | undefined;
          if (firebaseConfigs && firebaseConfigs.length > 0) {
            provider = "Firebase";
          } else if (supabase && Object.keys(supabase).length > 0) {
            provider = "Supabase";
          }

          sections.push(`Status: Active`, `Provider: ${provider}`);
        } else {
          sections.push(`Status: Inactive`);
        }
      } else {
        sections.push(`Status: Inactive`);
      }

      // Auth page info from app-details
      if (appDetailsRaw) {
        const appDetails = YAML.parse(appDetailsRaw) as Record<
          string,
          unknown
        >;
        const authPageInfo = appDetails.authPageInfo as
          | Record<string, unknown>
          | undefined;
        if (authPageInfo) {
          const homeRef = (
            authPageInfo.homePageNodeKeyRef as
              | Record<string, unknown>
              | undefined
          )?.key as string | undefined;
          const signInRef = (
            authPageInfo.signInPageNodeKeyRef as
              | Record<string, unknown>
              | undefined
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

      // --- Push Notifications ---
      sections.push(`\n## Push Notifications`);
      if (pushRaw) {
        const push = YAML.parse(pushRaw) as Record<string, unknown>;
        const enabled = push.enabled === true;
        const allowScheduled = push.allowScheduledNotifications === true;
        const autoPrompt =
          push.autoPromptUsersForNotificationsPermission === true;

        sections.push(
          `Enabled: ${enabled ? "Yes" : "No"}`,
          `Scheduled notifications: ${allowScheduled ? "Yes" : "No"}`,
          `Auto-prompt permission: ${autoPrompt ? "Yes" : "No"}`
        );

        const lastNotif = push.lastNotificationSent as
          | Record<string, unknown>
          | undefined;
        if (lastNotif) {
          const title =
            (lastNotif.notificationTitle as string) || "(untitled)";
          const status = (lastNotif.status as string) || "unknown";
          sections.push(`Last notification: "${title}" (${status})`);
        }
      } else {
        sections.push(`(not configured)`);
      }

      // --- Mobile Deployment ---
      sections.push(`\n## Mobile Deployment`);
      if (mobileRaw) {
        const mobile = YAML.parse(mobileRaw) as Record<string, unknown>;
        const settingsMap = mobile.codemagicSettingsMap as
          | Record<string, Record<string, unknown>>
          | undefined;

        if (settingsMap && Object.keys(settingsMap).length > 0) {
          // Prefer PROD, fall back to first key
          const envKey = settingsMap.PROD
            ? "PROD"
            : Object.keys(settingsMap)[0];
          const envSettings = settingsMap[envKey];

          sections.push(`Environment: ${envKey}`);

          // Build version
          const buildVersion = envSettings.buildVersion as
            | Record<string, unknown>
            | undefined;
          if (buildVersion) {
            if (buildVersion.buildVersion) {
              sections.push(`Version: ${buildVersion.buildVersion}`);
            }
            if (buildVersion.buildNumber != null) {
              sections.push(`Build number: ${buildVersion.buildNumber}`);
            }
            if (buildVersion.lastSubmitted) {
              sections.push(`Last submitted: ${buildVersion.lastSubmitted}`);
            }
          }

          // Play Store
          const playStore = envSettings.playStoreSettings as
            | Record<string, unknown>
            | undefined;
          if (playStore?.playTrack) {
            sections.push(`Play Store track: ${playStore.playTrack}`);
          }

          // App Store — NEVER output private keys
          const appStore = envSettings.appStoreSettings as
            | Record<string, unknown>
            | undefined;
          if (appStore?.ascAppId) {
            sections.push(`App Store ID: ${appStore.ascAppId}`);
          }
        } else {
          sections.push(`(not configured)`);
        }
      } else {
        sections.push(`(not configured)`);
      }

      // --- Web Deployment ---
      sections.push(`\n## Web Deployment`);
      if (webRaw) {
        const web = YAML.parse(webRaw) as Record<string, unknown>;
        const webSettings = web.webSettings as
          | Record<string, Record<string, unknown>>
          | undefined;

        if (webSettings && Object.keys(webSettings).length > 0) {
          // Prefer PROD, fall back to first key
          const envKey = webSettings.PROD
            ? "PROD"
            : Object.keys(webSettings)[0];
          const envData = webSettings[envKey];

          sections.push(`Environment: ${envKey}`);

          if (envData.pageTitle) {
            sections.push(`Page title: ${envData.pageTitle}`);
          }
          if (envData.seoDescription) {
            sections.push(`SEO description: ${envData.seoDescription}`);
          }
          if (envData.orientation) {
            sections.push(`Orientation: ${envData.orientation}`);
          }
        } else {
          sections.push(`(not configured)`);
        }
      } else {
        sections.push(`(not configured)`);
      }

      return {
        content: [{ type: "text" as const, text: sections.join("\n") }],
      };
    }
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import YAML from "yaml";
import { cacheRead, cacheMeta, cacheAgeFooter } from "../utils/cache.js";
import { resolveDataType } from "../utils/resolve-data-type.js";

interface RemoteConfigField {
  parameter?: {
    identifier?: { name?: string };
    dataType?: Record<string, unknown>;
  };
  serializedDefaultValue?: string;
}

interface EnvValue {
  parameter?: {
    identifier?: { name?: string };
    dataType?: Record<string, unknown>;
  };
  valuesMap?: Record<string, { serializedValue?: string }>;
  isPrivate?: boolean;
}

export function registerGetProjectSetupTool(server: McpServer) {
  server.tool(
    "get_project_setup",
    "Get Project Setup settings — Firebase services, Languages, Platforms, Permissions, Project Dependencies, Dev Environments. Mirrors the FlutterFlow 'Project Setup' settings section. Cache-based, no API calls. Run sync_project first.",
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

      const [
        analyticsRaw,
        appCheckRaw,
        crashlyticsRaw,
        perfMonRaw,
        remoteConfigRaw,
        languagesRaw,
        platformsRaw,
        permissionsRaw,
        dependenciesRaw,
        customCodeDepsRaw,
        envSettingsRaw,
      ] = await Promise.all([
        cacheRead(projectId, "firebase-analytics"),
        cacheRead(projectId, "firebase-app-check"),
        cacheRead(projectId, "firebase-crashlytics"),
        cacheRead(projectId, "firebase-performance-monitoring"),
        cacheRead(projectId, "firebase-remote-config"),
        cacheRead(projectId, "languages"),
        cacheRead(projectId, "platforms"),
        cacheRead(projectId, "permissions"),
        cacheRead(projectId, "dependencies"),
        cacheRead(projectId, "custom-code-dependencies"),
        cacheRead(projectId, "environment-settings"),
      ]);

      const sections: string[] = ["# Project Setup"];

      // --- Firebase ---
      sections.push(`\n## Firebase`);
      const anyFirebase =
        analyticsRaw || appCheckRaw || crashlyticsRaw || perfMonRaw || remoteConfigRaw;

      if (anyFirebase) {
        // Analytics
        if (analyticsRaw) {
          const analytics = YAML.parse(analyticsRaw) as Record<string, unknown>;
          const enabled = analytics.enabled === true;
          sections.push(`Analytics: ${enabled ? "enabled" : "disabled"}`);

          if (enabled) {
            const eventSettings = analytics.automaticEventSettings as
              | Record<string, unknown>
              | undefined;
            if (eventSettings) {
              sections.push(
                `  onPageLoad: ${eventSettings.onPageLoad === true ? "Yes" : "No"}`,
                `  onActionsStart: ${eventSettings.onActionsStart === true ? "Yes" : "No"}`,
                `  onAuth: ${eventSettings.onAuth === true ? "Yes" : "No"}`
              );
            }
          }
        }

        // App Check
        if (appCheckRaw) {
          const appCheck = YAML.parse(appCheckRaw) as Record<string, unknown>;
          sections.push(`App Check: ${appCheck.enabled === true ? "enabled" : "disabled"}`);
        }

        // Crashlytics
        if (crashlyticsRaw) {
          const crashlytics = YAML.parse(crashlyticsRaw) as Record<string, unknown>;
          sections.push(`Crashlytics: ${crashlytics.enabled === true ? "enabled" : "disabled"}`);
        }

        // Performance Monitoring
        if (perfMonRaw) {
          const perfMon = YAML.parse(perfMonRaw) as Record<string, unknown>;
          sections.push(
            `Performance Monitoring: ${perfMon.enabled === true ? "enabled" : "disabled"}`
          );
        }

        // Remote Config
        if (remoteConfigRaw) {
          const remoteConfig = YAML.parse(remoteConfigRaw) as Record<string, unknown>;
          const enabled = remoteConfig.enabled === true;
          sections.push(`Remote Config: ${enabled ? "enabled" : "disabled"}`);

          if (enabled) {
            const fields = (remoteConfig.fields as RemoteConfigField[]) || [];
            if (fields.length > 0) {
              sections.push(`  Fields:`);
              for (const field of fields) {
                const name = field.parameter?.identifier?.name || "unknown";
                const dt = resolveDataType(field.parameter?.dataType || {});
                const defaultVal = field.serializedDefaultValue ?? "";
                sections.push(`    - ${name}: ${dt} (default: "${defaultVal}")`);
              }
            }
          }
        }
      } else {
        sections.push(`(not configured)`);
      }

      // --- Languages ---
      sections.push(`\n## Languages`);
      if (languagesRaw) {
        const langs = YAML.parse(languagesRaw) as Record<string, unknown>;
        const primaryLang = (langs.primaryLanguage as Record<string, string> | undefined)
          ?.language;
        const displayLang = (langs.displayLanguage as Record<string, string> | undefined)
          ?.language;
        const allLangs = (langs.languages as Array<Record<string, string>> | undefined) || [];

        sections.push(`Primary: ${primaryLang || "not set"}`);
        sections.push(`Display: ${displayLang || "not set"}`);

        if (allLangs.length > 0) {
          const langCodes = allLangs.map((l) => l.language).join(", ");
          sections.push(`Available: ${langCodes}`);
        }
      } else {
        sections.push(`(not configured)`);
      }

      // --- Platforms ---
      sections.push(`\n## Platforms`);
      if (platformsRaw) {
        const platforms = YAML.parse(platformsRaw) as Record<string, unknown>;
        sections.push(`Web: ${platforms.enableWeb === true ? "enabled" : "disabled"}`);
      } else {
        sections.push(`(not configured)`);
      }

      // --- Permissions ---
      sections.push(`\n## Permissions`);
      if (permissionsRaw) {
        const permissions = YAML.parse(permissionsRaw) as Record<string, unknown>;
        const builtIn = permissions.permissionMessages as
          | Array<Record<string, unknown>>
          | undefined;
        const custom = permissions.userDefinedPermissions as
          | Array<Record<string, unknown>>
          | undefined;

        const hasBuiltIn = builtIn && builtIn.length > 0;
        const hasCustom = custom && custom.length > 0;

        if (hasBuiltIn || hasCustom) {
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
        } else {
          sections.push(`(not configured)`);
        }
      } else {
        sections.push(`(not configured)`);
      }

      // --- Project Dependencies ---
      sections.push(`\n## Project Dependencies`);
      const hasDeps = dependenciesRaw || customCodeDepsRaw;

      if (hasDeps) {
        // FF library dependencies
        if (dependenciesRaw) {
          const deps = YAML.parse(dependenciesRaw) as Record<string, unknown>;
          const libDeps = (deps.dependencies as Array<Record<string, string>> | undefined) || [];

          if (libDeps.length > 0) {
            sections.push(`FF Libraries:`);
            for (const dep of libDeps) {
              sections.push(
                `  - ${dep.name || "unnamed"} (${dep.projectId || "?"}, version: ${dep.version || "?"})`
              );
            }
          }
        }

        // Pubspec dependencies
        if (customCodeDepsRaw) {
          const customDeps = YAML.parse(customCodeDepsRaw) as Record<string, unknown>;
          const pubspecDeps =
            (customDeps.pubspecDependencies as Array<Record<string, string>> | undefined) || [];

          if (pubspecDeps.length > 0) {
            sections.push(`Pubspec Dependencies:`);
            for (const dep of pubspecDeps) {
              sections.push(`  - ${dep.name || "unnamed"}: ${dep.version || "any"}`);
            }
          }
        }
      } else {
        sections.push(`(not configured)`);
      }

      // --- Dev Environments ---
      sections.push(`\n## Dev Environments`);
      if (envSettingsRaw) {
        const doc = YAML.parse(envSettingsRaw) as Record<string, unknown>;
        const currentEnv = doc.currentEnvironment as
          | { name?: string; key?: string }
          | undefined;
        const envValues = (doc.environmentValues as EnvValue[]) || [];

        if (currentEnv) {
          sections.push(`Current: ${currentEnv.name || "unknown"} (${currentEnv.key || "?"})`);
        }

        const lines: string[] = [];
        for (const ev of envValues) {
          const name = ev.parameter?.identifier?.name || "unknown";
          const dt = resolveDataType(ev.parameter?.dataType || {});
          const privateTag = ev.isPrivate ? " (private)" : "";
          lines.push(`- ${name}: ${dt}${privateTag}`);

          const valuesMap = ev.valuesMap || {};
          for (const [envKey, envVal] of Object.entries(valuesMap)) {
            const display = ev.isPrivate ? "****" : (envVal.serializedValue ?? "");
            lines.push(`  ${envKey}: ${display}`);
          }
        }

        if (lines.length > 0) {
          sections.push(lines.join("\n"));
        }
      } else {
        sections.push(`(not configured)`);
      }

      return {
        content: [{ type: "text" as const, text: sections.join("\n") + cacheAgeFooter(meta) }],
      };
    }
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import YAML from "yaml";
import { cacheRead, cacheMeta } from "../utils/cache.js";

function argbToHex(argbStr: string): string {
  const n = parseInt(argbStr, 10);
  if (isNaN(n)) return argbStr;
  const a = (n >>> 24) & 0xff;
  const r = (n >>> 16) & 0xff;
  const g = (n >>> 8) & 0xff;
  const b = n & 0xff;
  if (a === 255) {
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
  }
  return `#${a.toString(16).padStart(2, "0")}${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
}

type Section = "colors" | "typography" | "breakpoints" | "widgets" | "all";

export function registerGetThemeTool(server: McpServer) {
  server.tool(
    "get_theme",
    "Get theme colors, typography, breakpoints, and widget defaults from local cache. No API calls. Run sync_project first if not cached.",
    {
      projectId: z.string().describe("The FlutterFlow project ID"),
      section: z
        .enum(["colors", "typography", "breakpoints", "widgets", "all"])
        .default("all")
        .describe(
          "Which theme section to return. Defaults to 'all'."
        ),
    },
    async ({ projectId, section }) => {
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

      const [themeRaw, materialThemeRaw] = await Promise.all([
        cacheRead(projectId, "theme"),
        cacheRead(projectId, "material-theme"),
      ]);

      if (!themeRaw) {
        return {
          content: [
            { type: "text" as const, text: "No theme data found in cache." },
          ],
        };
      }

      const theme = YAML.parse(themeRaw) as Record<string, unknown>;
      const sections: string[] = ["# Theme"];

      // Material version
      if (materialThemeRaw) {
        const materialTheme = YAML.parse(materialThemeRaw) as Record<string, unknown>;
        const useMaterial2 = materialTheme.useMaterial2 === true;
        sections.push(`\nMaterial version: Material ${useMaterial2 ? "2" : "3"}`);
      }

      const show = (s: Section) => section === "all" || section === s;

      // --- Colors ---
      if (show("colors")) {
        const colors = extractColors(theme);
        if (colors.length > 0) {
          sections.push("\n## Colors");
          for (const { name, hex } of colors) {
            sections.push(`- ${name}: ${hex}`);
          }
        }
      }

      // --- Typography ---
      if (show("typography")) {
        const defaultTypography = theme.defaultTypography as Record<string, unknown> | undefined;
        if (defaultTypography) {
          const primaryFont = (defaultTypography.primaryFontFamily as string) || "Unknown";
          const secondaryFont = (defaultTypography.secondaryFontFamily as string) || "Unknown";

          sections.push(
            "\n## Typography",
            `Primary font: ${primaryFont}`,
            `Secondary font: ${secondaryFont}`,
            "",
            "| Style | Size | Weight | Color |",
            "|-------|------|--------|-------|"
          );

          const styleKeys = [
            "displayLarge", "displayMedium", "displaySmall",
            "headlineLarge", "headlineMedium", "headlineSmall",
            "titleLarge", "titleMedium", "titleSmall",
            "bodyLarge", "bodyMedium", "bodySmall",
            "labelLarge", "labelMedium", "labelSmall",
          ];

          for (const key of styleKeys) {
            const style = defaultTypography[key] as Record<string, unknown> | undefined;
            if (!style) continue;
            const size = (style.fontSizeValue as Record<string, unknown>)?.inputValue ?? "?";
            const weight = (style.fontWeightValue as Record<string, unknown>)?.inputValue ?? "?";
            const color = (
              (style.colorValue as Record<string, unknown>)?.inputValue as Record<string, unknown>
            )?.themeColor ?? "?";
            sections.push(`| ${key} | ${size} | ${weight} | ${color} |`);
          }
        }
      }

      // --- Breakpoints ---
      if (show("breakpoints")) {
        const bp = theme.breakPoints as Record<string, number> | undefined;
        if (bp) {
          const small = bp.small ?? 479;
          const medium = bp.medium ?? 767;
          const large = bp.large ?? 991;
          sections.push(
            "\n## Breakpoints",
            `- Phone: 0 - ${small}px`,
            `- Tablet: ${small + 1} - ${medium}px`,
            `- Tablet landscape: ${medium + 1} - ${large}px`,
            `- Desktop: ${large + 1}px+`
          );
        }
      }

      // --- Widget Defaults ---
      if (show("widgets")) {
        const themeWidgets = theme.themeWidgets as Record<string, Record<string, unknown>> | undefined;
        if (themeWidgets) {
          sections.push("\n## Widget Defaults");
          for (const [widgetName, widget] of Object.entries(themeWidgets)) {
            sections.push(`\n### ${widgetName}`);
            formatWidgetDefaults(widget, sections);
          }
        }

        const scrollbar = theme.scrollbarTheme as Record<string, unknown> | undefined;
        if (scrollbar) {
          sections.push("\n### scrollbarTheme");
          if (scrollbar.thickness !== undefined) sections.push(`Thickness: ${scrollbar.thickness}`);
          if (scrollbar.radius !== undefined) sections.push(`Radius: ${scrollbar.radius}`);
          const thumbColor = scrollbar.thumbColor as Record<string, unknown> | undefined;
          if (thumbColor?.value) {
            sections.push(`Thumb color: ${argbToHex(thumbColor.value as string)}`);
          }
        }
      }

      return {
        content: [{ type: "text" as const, text: sections.join("\n") }],
      };
    }
  );
}

function extractColors(
  theme: Record<string, unknown>
): Array<{ name: string; hex: string }> {
  const results: Array<{ name: string; hex: string }> = [];

  for (const [key, val] of Object.entries(theme)) {
    if (
      val &&
      typeof val === "object" &&
      !Array.isArray(val)
    ) {
      const obj = val as Record<string, unknown>;

      // Check if this is a single color entry: { value: "<argb>" }
      if (
        typeof obj.value === "string" &&
        Object.keys(obj).length <= 2 &&
        isArgbColor(obj.value)
      ) {
        results.push({ name: key, hex: argbToHex(obj.value) });
        continue;
      }

      // Check if this is a map of colors: { COLOR_NAME: { value: "<argb>" }, ... }
      const childEntries = Object.entries(obj);
      const colorChildren: Array<{ name: string; hex: string }> = [];
      for (const [childKey, childVal] of childEntries) {
        if (
          childVal &&
          typeof childVal === "object" &&
          !Array.isArray(childVal)
        ) {
          const child = childVal as Record<string, unknown>;
          if (typeof child.value === "string" && isArgbColor(child.value)) {
            colorChildren.push({ name: childKey, hex: argbToHex(child.value) });
          }
        }
      }
      if (colorChildren.length >= 3) {
        results.push(...colorChildren);
      }
    }
  }

  return results;
}

function isArgbColor(value: string): boolean {
  const n = parseInt(value, 10);
  return !isNaN(n) && n > 0xff000000;
}

function formatWidgetDefaults(
  widget: Record<string, unknown>,
  out: string[]
): void {
  if (widget.fontFamily) out.push(`Font: ${widget.fontFamily}`);

  const textStyle = widget.textStyle as Record<string, unknown> | undefined;
  if (textStyle?.themeStyle) out.push(`Text style: ${textStyle.themeStyle}`);

  const textColor = widget.textColorValue as Record<string, unknown> | undefined;
  const textColorInput = textColor?.inputValue as Record<string, unknown> | undefined;
  if (textColorInput?.themeColor) out.push(`Text color: ${textColorInput.themeColor}`);

  const bgColor = widget.backgroundColorValue as Record<string, unknown> | undefined;
  const bgInput = bgColor?.inputValue as Record<string, unknown> | undefined;
  if (bgInput?.themeColor) out.push(`Background: ${bgInput.themeColor}`);

  const borderRadius = widget.borderRadius as Record<string, unknown> | undefined;
  if (borderRadius) {
    const allVal = borderRadius.allValue as Record<string, unknown> | undefined;
    if (allVal?.inputValue !== undefined) {
      out.push(`Border radius: ${allVal.inputValue}`);
    }
  }

  const dimensions = widget.dimensions as Record<string, unknown> | undefined;
  if (dimensions) {
    const height = dimensions.height as Record<string, unknown> | undefined;
    const heightPx = height?.pixelsValue as Record<string, unknown> | undefined;
    if (heightPx?.inputValue !== undefined) out.push(`Height: ${heightPx.inputValue}px`);

    const width = dimensions.width as Record<string, unknown> | undefined;
    const widthPx = width?.pixelsValue as Record<string, unknown> | undefined;
    if (widthPx?.inputValue !== undefined) out.push(`Width: ${widthPx.inputValue}px`);
  }
}

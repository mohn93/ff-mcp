import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock all dependencies BEFORE imports
vi.mock("../utils/cache.js", () => ({
  cacheRead: vi.fn(),
  cacheWrite: vi.fn(),
  cacheWriteBulk: vi.fn(),
  cacheMeta: vi.fn(),
  cacheWriteMeta: vi.fn(),
  cacheInvalidate: vi.fn(),
  listCachedKeys: vi.fn(),
  cacheDir: vi.fn(),
}));

import { createMockServer } from "../__helpers__/mock-server.js";
import { registerGetThemeTool } from "./get-theme.js";
import { cacheRead, cacheMeta } from "../utils/cache.js";
import YAML from "yaml";

const mockedCacheRead = vi.mocked(cacheRead);
const mockedCacheMeta = vi.mocked(cacheMeta);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMeta() {
  return { lastSyncedAt: "2025-01-01", fileCount: 20, syncMethod: "bulk" as const };
}

function makeThemeYaml(data: Record<string, unknown>): string {
  return YAML.stringify(data);
}

function makeMaterialThemeYaml(useMaterial2: boolean): string {
  return YAML.stringify({ useMaterial2 });
}

// Full theme fixture used across multiple tests
function fullTheme() {
  return {
    colorPrimary: { value: "4280391411" },
    customColors: {
      RED: { value: "4294901760" },
      GREEN: { value: "4278255360" },
      BLUE: { value: "4278190335" },
    },
    defaultTypography: {
      primaryFontFamily: "Roboto",
      secondaryFontFamily: "Inter",
      bodyMedium: {
        fontSizeValue: { inputValue: 14 },
        fontWeightValue: { inputValue: "w400" },
        colorValue: { inputValue: { themeColor: "primaryText" } },
      },
    },
    breakPoints: {
      small: 479,
      medium: 767,
      large: 991,
    },
    themeWidgets: {
      ElevatedButton: {
        fontFamily: "Roboto",
        textStyle: { themeStyle: "titleSmall" },
        backgroundColorValue: { inputValue: { themeColor: "primary" } },
        borderRadius: { allValue: { inputValue: 8 } },
        dimensions: { height: { pixelsValue: { inputValue: 44 } } },
      },
    },
    scrollbarTheme: {
      thickness: 8,
      radius: 4,
      thumbColor: { value: "4286611584" },
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("get_theme handler", () => {
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockServer();
    registerGetThemeTool(mock.server as any);
    getHandler = mock.getHandler;
  });

  // -----------------------------------------------------------------------
  // 1. Registers with correct tool name "get_theme"
  // -----------------------------------------------------------------------
  it("registers with correct tool name 'get_theme'", () => {
    expect(() => getHandler("get_theme")).not.toThrow();
  });

  // -----------------------------------------------------------------------
  // 2. Returns "No cache found" error when cacheMeta returns null
  // -----------------------------------------------------------------------
  it("returns 'No cache found' error when cacheMeta returns null", async () => {
    mockedCacheMeta.mockResolvedValue(null);

    const handler = getHandler("get_theme");
    const result = await handler({ projectId: "proj-no-cache" });

    expect(result.content[0].text).toContain("No cache found");
    expect(result.content[0].text).toContain("proj-no-cache");
    expect(result.content[0].text).toContain("sync_project");
  });

  // -----------------------------------------------------------------------
  // 3. Returns "No theme data found" when theme file is null
  // -----------------------------------------------------------------------
  it("returns 'No theme data found' when theme file is null", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());
    mockedCacheRead.mockResolvedValue(null);

    const handler = getHandler("get_theme");
    const result = await handler({ projectId: "proj-1" });

    expect(result.content[0].text).toContain("No theme data found");
  });

  // -----------------------------------------------------------------------
  // 4. Shows Material version from material-theme (Material 2 vs 3)
  // -----------------------------------------------------------------------
  it("shows Material 2 when useMaterial2 is true", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());
    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "theme") return makeThemeYaml({ someKey: "val" });
      if (key === "material-theme") return makeMaterialThemeYaml(true);
      return null;
    });

    const handler = getHandler("get_theme");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("Material version: Material 2");
  });

  it("shows Material 3 when useMaterial2 is false", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());
    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "theme") return makeThemeYaml({ someKey: "val" });
      if (key === "material-theme") return makeMaterialThemeYaml(false);
      return null;
    });

    const handler = getHandler("get_theme");
    const result = await handler({ projectId: "proj-1" });
    const text = result.content[0].text;

    expect(text).toContain("Material version: Material 3");
  });

  // -----------------------------------------------------------------------
  // 5. Extracts colors from ARGB values (converts to hex)
  // -----------------------------------------------------------------------
  it("extracts colors from ARGB values and converts to hex", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    const theme = {
      colorPrimary: { value: "4280391411" }, // #1565C3
      customColors: {
        RED: { value: "4294901760" },   // #FF0000
        GREEN: { value: "4278255360" }, // #00FF00
        BLUE: { value: "4278190335" },  // #0000FF
      },
    };

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "theme") return makeThemeYaml(theme);
      return null;
    });

    const handler = getHandler("get_theme");
    const result = await handler({ projectId: "proj-1", section: "all" });
    const text = result.content[0].text;

    expect(text).toContain("## Colors");
    // Single color entry: 4280391411 = 0xFF2196F3
    expect(text).toContain("colorPrimary: #2196F3");
    // Color map children (3+ children with ARGB values)
    expect(text).toContain("RED: #FF0000");
    expect(text).toContain("GREEN: #00FF00");
    expect(text).toContain("BLUE: #0000FF");
  });

  // -----------------------------------------------------------------------
  // 6. Shows typography table (font families, style sizes/weights/colors)
  // -----------------------------------------------------------------------
  it("shows typography table with font families and style details", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    const theme = {
      defaultTypography: {
        primaryFontFamily: "Roboto",
        secondaryFontFamily: "Inter",
        bodyMedium: {
          fontSizeValue: { inputValue: 14 },
          fontWeightValue: { inputValue: "w400" },
          colorValue: { inputValue: { themeColor: "primaryText" } },
        },
      },
    };

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "theme") return makeThemeYaml(theme);
      return null;
    });

    const handler = getHandler("get_theme");
    const result = await handler({ projectId: "proj-1", section: "all" });
    const text = result.content[0].text;

    expect(text).toContain("## Typography");
    expect(text).toContain("Primary font: Roboto");
    expect(text).toContain("Secondary font: Inter");
    // Table header
    expect(text).toContain("| Style | Size | Weight | Color |");
    expect(text).toContain("|-------|------|--------|-------|");
    // bodyMedium row
    expect(text).toContain("| bodyMedium | 14 | w400 | primaryText |");
  });

  // -----------------------------------------------------------------------
  // 7. Shows breakpoints (phone/tablet/desktop ranges)
  // -----------------------------------------------------------------------
  it("shows breakpoints with phone/tablet/desktop ranges", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    const theme = {
      breakPoints: {
        small: 479,
        medium: 767,
        large: 991,
      },
    };

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "theme") return makeThemeYaml(theme);
      return null;
    });

    const handler = getHandler("get_theme");
    const result = await handler({ projectId: "proj-1", section: "all" });
    const text = result.content[0].text;

    expect(text).toContain("## Breakpoints");
    expect(text).toContain("Phone: 0 - 479px");
    expect(text).toContain("Tablet: 480 - 767px");
    expect(text).toContain("Tablet landscape: 768 - 991px");
    expect(text).toContain("Desktop: 992px+");
  });

  // -----------------------------------------------------------------------
  // 8. Shows widget defaults (font, text style, text color, background,
  //    border radius, dimensions)
  // -----------------------------------------------------------------------
  it("shows widget defaults with all properties", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    const theme = {
      themeWidgets: {
        ElevatedButton: {
          fontFamily: "Roboto",
          textStyle: { themeStyle: "titleSmall" },
          textColorValue: { inputValue: { themeColor: "info" } },
          backgroundColorValue: { inputValue: { themeColor: "primary" } },
          borderRadius: { allValue: { inputValue: 8 } },
          dimensions: { height: { pixelsValue: { inputValue: 44 } } },
        },
      },
    };

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "theme") return makeThemeYaml(theme);
      return null;
    });

    const handler = getHandler("get_theme");
    const result = await handler({ projectId: "proj-1", section: "all" });
    const text = result.content[0].text;

    expect(text).toContain("## Widget Defaults");
    expect(text).toContain("### ElevatedButton");
    expect(text).toContain("Font: Roboto");
    expect(text).toContain("Text style: titleSmall");
    expect(text).toContain("Text color: info");
    expect(text).toContain("Background: primary");
    expect(text).toContain("Border radius: 8");
    expect(text).toContain("Height: 44px");
  });

  // -----------------------------------------------------------------------
  // 9. Section filter works (section="colors" only shows colors)
  // -----------------------------------------------------------------------
  it("section filter 'colors' only shows colors section", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "theme") return makeThemeYaml(fullTheme());
      if (key === "material-theme") return makeMaterialThemeYaml(true);
      return null;
    });

    const handler = getHandler("get_theme");
    const result = await handler({ projectId: "proj-1", section: "colors" });
    const text = result.content[0].text;

    // Colors section should be present
    expect(text).toContain("## Colors");
    expect(text).toContain("colorPrimary:");

    // Material version is always shown (outside section filter)
    expect(text).toContain("Material version:");

    // Other sections should NOT be present
    expect(text).not.toContain("## Typography");
    expect(text).not.toContain("## Breakpoints");
    expect(text).not.toContain("## Widget Defaults");
  });

  it("section filter 'typography' only shows typography section", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "theme") return makeThemeYaml(fullTheme());
      return null;
    });

    const handler = getHandler("get_theme");
    const result = await handler({ projectId: "proj-1", section: "typography" });
    const text = result.content[0].text;

    expect(text).toContain("## Typography");
    expect(text).not.toContain("## Colors");
    expect(text).not.toContain("## Breakpoints");
    expect(text).not.toContain("## Widget Defaults");
  });

  it("section filter 'breakpoints' only shows breakpoints section", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "theme") return makeThemeYaml(fullTheme());
      return null;
    });

    const handler = getHandler("get_theme");
    const result = await handler({ projectId: "proj-1", section: "breakpoints" });
    const text = result.content[0].text;

    expect(text).toContain("## Breakpoints");
    expect(text).not.toContain("## Colors");
    expect(text).not.toContain("## Typography");
    expect(text).not.toContain("## Widget Defaults");
  });

  it("section filter 'widgets' only shows widgets and scrollbar sections", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "theme") return makeThemeYaml(fullTheme());
      return null;
    });

    const handler = getHandler("get_theme");
    const result = await handler({ projectId: "proj-1", section: "widgets" });
    const text = result.content[0].text;

    expect(text).toContain("## Widget Defaults");
    expect(text).toContain("### scrollbarTheme");
    expect(text).not.toContain("## Colors");
    expect(text).not.toContain("## Typography");
    expect(text).not.toContain("## Breakpoints");
  });

  // -----------------------------------------------------------------------
  // 10. Shows scrollbar theme when present
  // -----------------------------------------------------------------------
  it("shows scrollbar theme with thickness, radius, and thumb color", async () => {
    mockedCacheMeta.mockResolvedValue(makeMeta());

    const theme = {
      scrollbarTheme: {
        thickness: 8,
        radius: 4,
        thumbColor: { value: "4286611584" },
      },
    };

    mockedCacheRead.mockImplementation(async (_pid, key) => {
      if (key === "theme") return makeThemeYaml(theme);
      return null;
    });

    const handler = getHandler("get_theme");
    const result = await handler({ projectId: "proj-1", section: "all" });
    const text = result.content[0].text;

    expect(text).toContain("### scrollbarTheme");
    expect(text).toContain("Thickness: 8");
    expect(text).toContain("Radius: 4");
    expect(text).toContain("Thumb color: #808080");
  });
});

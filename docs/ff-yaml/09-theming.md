# 09 - Theming and Styling

How FlutterFlow stores theme configuration, colors, typography, dimensions, padding, border radius, responsive breakpoints, and Material theme settings in YAML.

All examples below are taken from real cached project YAML files.

---

## Theme File Location

Theme configuration lives in the `theme.yaml` file at the project root. Material theme settings are in `material-theme.yaml`.

```
theme.yaml            # Colors, typography, breakpoints, loading indicator, scrollbar, custom icons
material-theme.yaml   # Material 2 vs Material 3 toggle
```

---

## 1. Theme Colors

FlutterFlow defines a fixed set of named theme colors. These are referenced throughout widget YAML via `themeColor` instead of hard-coded ARGB values.

### Known Theme Color Names

| Name | Typical Usage |
|------|---------------|
| `PRIMARY` | Primary brand color (buttons, links, accents) |
| `PRIMARY_TEXT` | Main text color |
| `PRIMARY_BACKGROUND` | Page/scaffold background |
| `SECONDARY` | Secondary brand color |
| `SECONDARY_TEXT` | Subdued text (labels, captions) |
| `SECONDARY_BACKGROUND` | Card/surface backgrounds |
| `ALTERNATE` | Borders, dividers, subtle elements |
| `ERROR` | Error states, validation messages |
| `INFO` | Informational badges/banners |
| `SUCCESS` | Success states |
| `WARNING` | Warning indicators |
| `ACCENT1` | Custom accent color 1 |
| `ACCENT2` | Custom accent color 2 |
| `ACCENT3` | Custom accent color 3 |
| `ACCENT4` | Custom accent color 4 |

### Real usage from cached YAML

```yaml
# Nav bar using theme colors (from nav-bar.yaml)
themeColor: PRIMARY_BACKGROUND    # bar background
themeColor: PRIMARY               # active icon
themeColor: SECONDARY_TEXT        # inactive icon

# Scaffold background
backgroundColorValue:
  inputValue:
    themeColor: PRIMARY_BACKGROUND

# Divider color
colorValue:
  inputValue:
    themeColor: ALTERNATE

# Warning icon
colorValue:
  inputValue:
    themeColor: WARNING
```

---

## 2. Color Specification

There are exactly two ways to specify a color value in FlutterFlow YAML.

### By theme reference

References one of the named theme colors. Adapts automatically to light/dark mode.

```yaml
colorValue:
  inputValue:
    themeColor: PRIMARY_TEXT
  mostRecentInputValue:
    themeColor: PRIMARY_TEXT
```

### By direct ARGB value

A 32-bit integer encoded as a decimal string. Format: `0xAARRGGBB` converted to decimal.

```yaml
colorValue:
  inputValue:
    value: "4284900966"
  mostRecentInputValue:
    value: "4284900966"
```

**ARGB encoding:** The value is a 32-bit unsigned integer where:
- Bits 24-31: Alpha (FF = fully opaque = 255)
- Bits 16-23: Red
- Bits 8-15: Green
- Bits 0-7: Blue

For example, `4278190080` = `0xFF000000` = fully opaque black.

### Loading indicator color (from theme.yaml)

The loading indicator uses a slightly different structure with `value` directly (no `inputValue` wrapper):

```yaml
loadingIndicatorStyle:
  type: SK_CHASINGDOTS       # or CIRCULAR
  color:
    value: "4287097512"
  diameter: 50
```

---

## 3. Typography

### Theme Style Names

FlutterFlow uses Material Design 3 typography scale names. These are referenced in widget `themeStyle` fields.

| Style Name | Typical Size | Typical Weight | Typical Color |
|------------|-------------|----------------|---------------|
| `DISPLAY_LARGE` | 64 | w600 | PRIMARY_TEXT |
| `DISPLAY_MEDIUM` | 44 | w600 | PRIMARY_TEXT |
| `DISPLAY_SMALL` | 36 | w600 | PRIMARY_TEXT |
| `HEADLINE_LARGE` | 32 | w600 | PRIMARY_TEXT |
| `HEADLINE_MEDIUM` | 28 | w600 | PRIMARY_TEXT |
| `HEADLINE_SMALL` | 24 | w600 | PRIMARY_TEXT |
| `TITLE_LARGE` | 20 | w600 | PRIMARY_TEXT |
| `TITLE_MEDIUM` | 18 | w600 | PRIMARY_TEXT |
| `TITLE_SMALL` | 16 | w600 | PRIMARY_TEXT |
| `BODY_LARGE` | 16 | w400 | PRIMARY_TEXT |
| `BODY_MEDIUM` | 14 | w400 | PRIMARY_TEXT |
| `BODY_SMALL` | 12 | w400 | PRIMARY_TEXT |
| `LABEL_LARGE` | 16 | w400 | SECONDARY_TEXT |
| `LABEL_MEDIUM` | 14 | w400 | SECONDARY_TEXT |
| `LABEL_SMALL` | 12 | w400 | SECONDARY_TEXT |

Note: Label styles default to `SECONDARY_TEXT` color, while all others default to `PRIMARY_TEXT`.

### Typography definition in theme.yaml

Each style is defined under `defaultTypography` with font family, size, color, and weight:

```yaml
# Real structure from zellium-fptpvo/theme.yaml
defaultTypography:
  primaryFontFamily: Inter
  secondaryFontFamily: Inter
  displaySmall:
    fontFamily: Inter
    isCustomFont: false
    fontSizeValue:
      inputValue: 36
    colorValue:
      inputValue:
        themeColor: PRIMARY_TEXT
    fontWeightValue:
      inputValue: w600
  bodyMedium:
    fontFamily: Inter
    fontSizeValue:
      inputValue: 14
    colorValue:
      inputValue:
        themeColor: PRIMARY_TEXT
    fontWeightValue:
      inputValue: w400
  labelLarge:
    fontFamily: Inter
    fontSizeValue:
      inputValue: 16
    colorValue:
      inputValue:
        themeColor: SECONDARY_TEXT
    fontWeightValue:
      inputValue: w400
```

### Typography reference in widgets

When used in a Text or Button widget, the `themeStyle` field references the style name:

```yaml
# Text widget using theme typography
props:
  text:
    fontFamily: Open Sans
    themeStyle: BODY_MEDIUM
    isCustomFont: false
    textValue:
      inputValue: Hello World
    fontSizeValue:
      inputValue: 24          # Overrides theme default
    colorValue:
      inputValue:
        themeColor: PRIMARY_TEXT
    fontWeightValue:
      inputValue: w700        # Overrides theme default
```

### Optional: italic

Typography definitions can include an italic flag:

```yaml
displayLarge:
  fontFamily: Inter
  isCustomFont: false
  fontSizeValue:
    inputValue: 64
  colorValue:
    inputValue:
      themeColor: PRIMARY_TEXT
  italicValue:
    inputValue: false
  fontWeightValue:
    inputValue: w600
```

---

## 4. Font Weights

Font weights use the Flutter/CSS-style `wXXX` naming:

| Value | Name | CSS Equivalent |
|-------|------|----------------|
| `w100` | Thin | 100 |
| `w200` | Extra Light | 200 |
| `w300` | Light | 300 |
| `w400` | Normal / Regular | 400 |
| `w500` | Medium | 500 |
| `w600` | Semi-Bold | 600 |
| `w700` | Bold | 700 |
| `w800` | Extra Bold | 800 |
| `w900` | Black | 900 |

```yaml
fontWeightValue:
  inputValue: w600
  mostRecentInputValue: w600
```

---

## 5. Dimension Patterns

Dimensions (width, height) support three modes: fixed pixels, percentage of screen, and fill/expand.

### Fixed pixels

```yaml
dimensions:
  width:
    pixelsValue:
      inputValue: 200
      mostRecentInputValue: 200
  height:
    pixelsValue:
      inputValue: 48
      mostRecentInputValue: 48
```

### Percentage of screen size

Uses `percentOfScreenSizeValue` instead of `pixelsValue`. Value is 0-100.

```yaml
# Real example: Container filling 100% of screen (from Container_q7m3k7c9)
dimensions:
  width:
    percentOfScreenSizeValue:
      inputValue: 100
  height:
    percentOfScreenSizeValue:
      inputValue: 100

# Real example: AppBar expanded to 45% of screen height (from AppBar_jb8gbejf)
expandedHeight:
  percentOfScreenSizeValue:
    inputValue: 45
```

### Fill available space (Infinity)

Setting `pixelsValue` to `Infinity` makes the widget fill all available space along that axis. Commonly used for full-width buttons.

```yaml
# Real example: Full-width button (from Button_jyzzaf1t)
dimensions:
  width:
    pixelsValue:
      inputValue: Infinity
  height:
    pixelsValue:
      inputValue: 56
```

---

## 6. Padding Patterns

Padding uses a `type` field to select the padding mode, plus individual side values.

### FF_PADDING_ALL -- Uniform padding on all sides

```yaml
padding:
  type: FF_PADDING_ALL
  allValue:
    inputValue: 8
    mostRecentInputValue: 8
```

Real example from `Button_bw3x5gdi`:
```yaml
innerPadding:
  type: FF_PADDING_ALL
  allValue:
    inputValue: 8
```

### FF_PADDING_ONLY -- Per-side padding

Specify any combination of `topValue`, `bottomValue`, `leftValue`, `rightValue`. Omitted sides default to 0.

```yaml
padding:
  type: FF_PADDING_ONLY
  leftValue:
    inputValue: 24
    mostRecentInputValue: 24
  topValue:
    inputValue: 20
    mostRecentInputValue: 20
  rightValue:
    inputValue: 24
    mostRecentInputValue: 24
  bottomValue:
    inputValue: 16
    mostRecentInputValue: 16
```

### Empty padding

A padding object with no values (effectively zero padding on all sides):

```yaml
padding:
  type: FF_PADDING_ONLY
```

Or simply:

```yaml
padding: {}
```

---

## 7. Border Radius

Border radius uses a `type` field similar to padding.

### FF_BORDER_RADIUS_ALL -- Uniform radius on all corners

Includes both `allValue` and individual corner values. When using `FF_BORDER_RADIUS_ALL`, FlutterFlow stores the value redundantly in both `allValue` and each corner field.

```yaml
# Real example from Button_jyzzaf1t
borderRadius:
  type: FF_BORDER_RADIUS_ALL
  allValue:
    inputValue: 12
```

### Full per-corner specification

When all corners need the same value, FlutterFlow often stores them redundantly:

```yaml
# Real example from ff-mcp-guide.md Button reference
borderRadius:
  type: FF_BORDER_RADIUS_ALL
  topLeftValue:
    inputValue: 40
    mostRecentInputValue: 40
  topRightValue:
    inputValue: 40
    mostRecentInputValue: 40
  bottomLeftValue:
    inputValue: 40
    mostRecentInputValue: 40
  bottomRightValue:
    inputValue: 40
    mostRecentInputValue: 40
  allValue:
    inputValue: 40
    mostRecentInputValue: 40
```

### Individual corner values

For non-uniform radii, omit the `allValue` or set different values per corner:

```yaml
borderRadius:
  type: FF_BORDER_RADIUS_ALL
  topLeftValue:
    inputValue: 16
  topRightValue:
    inputValue: 16
  bottomLeftValue:
    inputValue: 0
  bottomRightValue:
    inputValue: 0
```

### borderRadiusValue (alternative form)

Some widgets (like PageView, LanguageSelector) use `borderRadiusValue` as a simple scalar instead of the structured object:

```yaml
borderRadiusValue:
  inputValue: 12
```

---

## 8. Responsive Breakpoints

### Breakpoint definitions in theme.yaml

Breakpoints define the screen width thresholds for responsive behavior:

```yaml
# From zellium-fptpvo/theme.yaml and local-perks-na36z5/theme.yaml
breakPoints:
  small: 479      # 0-479px = phone
  medium: 767     # 480-767px = tablet portrait
  large: 991      # 768-991px = tablet landscape / small desktop
                   # 992px+ = desktop
```

### Responsive visibility on widgets

Every widget can specify which device categories it should be hidden on. The `responsiveVisibility` object uses boolean flags:

```yaml
# Empty = visible on all devices (most common)
responsiveVisibility: {}

# Hidden on phone only (tablet/desktop image)
# Real example from Image_ie5duzoz
responsiveVisibility:
  phoneHidden: true

# Hidden on tablet and desktop (phone-only image)
# Real example from Image_6apkcc2e
responsiveVisibility:
  tabletHidden: true
  tabletLandscapeHidden: true
  desktopHidden: true
```

### All responsive visibility flags

| Flag | Hides on |
|------|----------|
| `phoneHidden` | Phone-sized screens (0 - `small` breakpoint) |
| `tabletHidden` | Tablet portrait (`small` - `medium` breakpoint) |
| `tabletLandscapeHidden` | Tablet landscape (`medium` - `large` breakpoint) |
| `desktopHidden` | Desktop screens (above `large` breakpoint) |

Each flag is a boolean. When `true`, the widget is hidden on that device category. When `false` or omitted, the widget is visible. An empty `responsiveVisibility: {}` means visible everywhere.

---

## 9. Material Theme

The `material-theme.yaml` file controls whether the project uses Material 2 or Material 3 design system.

```yaml
# material-theme.yaml (both zellium and local-perks projects)
useMaterial2: true
```

| Value | Design System |
|-------|---------------|
| `useMaterial2: true` | Material 2 (legacy, current default for most projects) |
| `useMaterial2: false` | Material 3 (newer, with updated component styles) |

This setting affects the visual appearance of all Material widgets (buttons, text fields, switches, etc.) throughout the app.

---

## 10. Scrollbar Theme

The theme file can also configure the global scrollbar appearance:

```yaml
# From zellium-fptpvo/theme.yaml
scrollbarTheme:
  thickness: 0
  radius: 0
  thumbColor:
    value: "3789504"
  horizontalScrollbarAlwaysVisible: false
```

---

## 11. Loading Indicator

The loading indicator style is defined at the top of `theme.yaml`:

```yaml
# Zellium project
loadingIndicatorStyle:
  type: SK_CHASINGDOTS
  color:
    value: "4287097512"
  diameter: 50

# Local Perks project
loadingIndicatorStyle:
  type: CIRCULAR
  color:
    value: "4293800507"
  diameter: 40
```

Known indicator types: `CIRCULAR`, `SK_CHASINGDOTS`.

---

## 12. Pull-to-Refresh Theme

Some projects define a pull-to-refresh indicator style:

```yaml
# From local-perks-na36z5/theme.yaml
pullToRefresh:
  refreshIndicatorStyle:
    indicatorColor:
      themeColor: PRIMARY
```

---

## 13. Custom Icon Families

Projects can include custom icon fonts. These are defined in the theme file:

```yaml
customIconFamilys:
  - familyName: Tabler-Icons
    iconFilePath: projects/local-perks-na36z5/assets/eekfihl2k2sd/Tabler-Icons.ttf
    icons:
      - iconName: arrowLeftTail
        codePoint: 59648
      - iconName: brandNetflix
        codePoint: 59649
      # ... potentially hundreds of icons
```

Custom icons are referenced in widgets using their `familyName` and `codePoint` (similar to Material icons but with the custom family name).

---

## Quick Reference: Style Property Patterns

| Property | Pattern | Example |
|----------|---------|---------|
| Color (theme) | `colorValue.inputValue.themeColor` | `PRIMARY` |
| Color (literal) | `colorValue.inputValue.value` | `"4278190080"` |
| Font size | `fontSizeValue.inputValue` | `24` |
| Font weight | `fontWeightValue.inputValue` | `w600` |
| Width (px) | `dimensions.width.pixelsValue.inputValue` | `200` |
| Width (%) | `dimensions.width.percentOfScreenSizeValue.inputValue` | `100` |
| Width (fill) | `dimensions.width.pixelsValue.inputValue` | `Infinity` |
| Padding (all) | `padding.type: FF_PADDING_ALL`, `allValue.inputValue` | `8` |
| Padding (per-side) | `padding.type: FF_PADDING_ONLY`, `leftValue.inputValue` | `24` |
| Border radius | `borderRadius.type: FF_BORDER_RADIUS_ALL`, `allValue.inputValue` | `12` |
| Responsive | `responsiveVisibility.phoneHidden` | `true` |
| Typography | `themeStyle` | `BODY_MEDIUM` |

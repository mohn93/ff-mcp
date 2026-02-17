# Miscellaneous Widgets: Icon, ProgressBar, AppBar, ConditionalBuilder

## Icon

### Minimal Example

```yaml
key: Icon_xxxxxxxx
type: Icon
props:
  icon:
    sizeValue:
      inputValue: 24
    iconDataValue:
      inputValue:
        codePoint: 57947
        family: MaterialIcons
        matchTextDirection: false
        name: favorite
```

### Full Schema

```yaml
key: Icon_xxxxxxxx
type: Icon
props:
  icon:
    sizeValue:                           # Icon size in px
      inputValue: 28
      mostRecentInputValue: 28
    colorValue:                          # Icon color
      inputValue:
        value: "4291282887"              # ARGB integer
        # OR themeColor: PRIMARY_TEXT
      mostRecentInputValue:
        value: "4291282887"
      # OR variable binding for dynamic color:
      # variable:
      #   source: FUNCTION_CALL
      #   functionCall:
      #     conditionalValue:
      #       ifConditionalValues:
      #         - condition: ...
      #           value:
      #             inputValue:
      #               color:
      #                 value: "4279506971"
      #       elseValue:
      #         inputValue:
      #           color:
      #             themeColor: PRIMARY_TEXT
      #       returnParameter:
      #         dataType:
      #           scalarType: Color
    iconDataValue:                       # Icon specification
      inputValue:
        codePoint: 983520                # Unicode code point
        family: MaterialIcons            # Icon font family
        matchTextDirection: false        # Mirror for RTL layouts
        name: store_rounded              # Human-readable icon name
        isCustom: true                   # For custom icon packs (Tabler-Icons, etc.)
  padding:                               # Common padding prop
    type: FF_PADDING_ONLY
    topValue:
      inputValue: 4
      mostRecentInputValue: 4
  responsiveVisibility: {}
  opacity:
    opacityValue:
      inputValue: 1
      mostRecentInputValue: 1
parameterValues: {}
valueKey: {}
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `sizeValue.inputValue` | number | Yes | Icon size in px |
| `colorValue.inputValue` | object | No | Color (themeColor or ARGB value) |
| `iconDataValue.inputValue.codePoint` | number | Yes | Unicode code point |
| `iconDataValue.inputValue.family` | string | Yes | Font family name |
| `iconDataValue.inputValue.name` | string | Yes | Human-readable name |
| `iconDataValue.inputValue.matchTextDirection` | bool | No | Mirror for RTL |
| `iconDataValue.inputValue.isCustom` | bool | No | Custom icon pack flag |
| `iconDataValue.inputValue.package` | string | No | Flutter package (e.g. `font_awesome_flutter`) |

### Common Icon Families

| Family | Package | Notes |
|--------|---------|-------|
| `MaterialIcons` | (built-in) | Default Flutter icons |
| `FontAwesomeBrands` | `font_awesome_flutter` | Brand logos (Google, Apple, etc.) |
| `FontAwesomeSolid` | `font_awesome_flutter` | Solid style FA icons |
| `Tabler-Icons` | (custom) | `isCustom: true` required |

---

## ProgressBar

### Minimal Example

```yaml
key: ProgressBar_xxxxxxxx
type: ProgressBar
props:
  progressBar:
    shape: Circular
    size:
      width:
        pixelsValue:
          inputValue: 150
      height:
        pixelsValue:
          inputValue: 6
    percentValue:
      inputValue: 0.5
    progressColorValue:
      inputValue:
        themeColor: SUCCESS
    backgroundColorValue:
      inputValue:
        themeColor: ALTERNATE
```

### Full Schema

```yaml
key: ProgressBar_xxxxxxxx
type: ProgressBar
props:
  expanded:
    expandedType: UNEXPANDED
  responsiveVisibility: {}
  progressBar:
    shape: Circular                      # Shape type (see enum)
    text:                                # Center text (for circular shape)
      themeStyle: HEADLINE_SMALL
      translationIdentifier:
        key: j7w2lfua
      textValue:                         # Text content (often computed)
        inputValue: ""
        # OR variable with string interpolation:
        # variable:
        #   source: FUNCTION_CALL
        #   functionCall:
        #     stringInterpolation: {}
        #     values:
        #       - variable:
        #           source: POSTGRES_QUERY
        #           baseVariable:
        #             postgresQuery: {}
        #           operations:
        #             - accessPostgresRowField:
        #                 fieldIdentifier:
        #                   name: positive_impact
        #             - numberFormat:
        #                 formatType: COMPACT
        #           nodeKeyRef:
        #             key: Container_xxxxx
        #       - inputValue:
        #           serializedValue: "%"
      fontSizeValue:
        inputValue: 16
      colorValue:
        inputValue:
          value: "4280032031"
    size:                                # Progress bar dimensions
      width:
        pixelsValue:
          inputValue: 150                # Width (diameter for circular)
      height:
        pixelsValue:
          inputValue: 6                  # Height (stroke width for circular)
    percentValue:                        # Progress value (0.0 to 1.0)
      inputValue: 0.5                    # Literal value
      # OR variable binding:
      # variable:
      #   source: LOCAL_STATE
      #   baseVariable:
      #     localState:
      #       fieldIdentifier:
      #         name: loadingProgress
      #         key: s4r96
      #       stateVariableType: WIDGET_CLASS_STATE
      #   nodeKeyRef:
      #     key: Scaffold_xxxxxxxx
      mostRecentInputValue: 1
    progressColorValue:                  # Filled portion color
      inputValue:
        themeColor: SUCCESS
        # OR value: "4282874240"
    backgroundColorValue:                # Unfilled portion color
      inputValue:
        value: "4290245323"
    animationValue:                      # Animate progress changes
      inputValue: true
  opacity:
    opacityValue:
      inputValue: 1
    animatedOpacity: {}
valueKey: {}
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `shape` | enum | Yes | `Circular` or `Linear` |
| `text` | object | No | Center text (circular only) |
| `size.width.pixelsValue.inputValue` | number | No | Width/diameter |
| `size.height.pixelsValue.inputValue` | number | No | Height/stroke width |
| `percentValue` | number/var | Yes | Progress 0.0 to 1.0 |
| `progressColorValue.inputValue` | object | No | Filled bar color |
| `backgroundColorValue.inputValue` | object | No | Background bar color |
| `animationValue.inputValue` | bool | No | Animate value changes |

### shape Enum

| Value | Description |
|-------|-------------|
| `Circular` | Circular/ring progress indicator |
| `Linear` | Horizontal bar progress indicator |

Note: For `Circular` shape, `width` = diameter and `height` = stroke thickness. The `text` property is shown in the center.

---

## AppBar

### Minimal Example

```yaml
key: AppBar_xxxxxxxx
type: AppBar
props:
  appBar:
    templateType: LARGE_HEADER
    backgroundColorValue:
      inputValue:
        themeColor: PRIMARY_BACKGROUND
```

### Full Schema

```yaml
key: AppBar_xxxxxxxx
type: AppBar
props:
  appBar:
    templateType: LARGE_HEADER           # AppBar template (see enum)
    toolbarHeight:                       # Custom toolbar height
      pixelsValue:
        inputValue: 130                  # Height in px (default ~56)
    titleInFlexibleSpaceBar: false        # Whether title appears in flexible space
    defaultBackButtonValue:              # Show default back button
      inputValue: false
      mostRecentInputValue: false
    backgroundColorValue:                # AppBar background color
      inputValue:
        themeColor: SECONDARY_BACKGROUND
      mostRecentInputValue:
        themeColor: SECONDARY_BACKGROUND
    elevationValue:                      # Shadow elevation
      inputValue: 0
      mostRecentInputValue: 0
    centerTitleValue:                    # Center the title text
      inputValue: false
      mostRecentInputValue: false
    # --- Sliver mode (collapsible) ---
    isSliver: true                       # Enable collapsible/sliver behavior
    expandedHeight:                      # Full height when expanded
      percentOfScreenSizeValue:
        inputValue: 40                   # 40% of screen height
    collapsedHeight:                     # Minimum height when collapsed
      percentOfScreenSizeValue:
        inputValue: 10
  opacity:
    opacityValue:
      inputValue: 1
      mostRecentInputValue: 1
parameterValues: {}
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `templateType` | enum | Yes | AppBar layout template |
| `toolbarHeight.pixelsValue.inputValue` | number | No | Toolbar height in px |
| `titleInFlexibleSpaceBar` | bool | No | Title in flexible space (for collapsing) |
| `defaultBackButtonValue.inputValue` | bool | No | Show back button |
| `backgroundColorValue.inputValue` | object | No | Background color |
| `elevationValue.inputValue` | number | No | Shadow elevation |
| `centerTitleValue.inputValue` | bool | No | Center title text |
| `isSliver` | bool | No | Enable collapsible/sliver app bar |
| `expandedHeight` | object | No | Full height when expanded (sliver mode) |
| `collapsedHeight` | object | No | Min height when collapsed (sliver mode) |

### templateType Enum

| Value | Description |
|-------|-------------|
| `LARGE_HEADER` | Large/extended app bar (most common, confirmed in production) |

> **Note:** `LARGE_HEADER` is the only confirmed valid value. Control the actual height via `toolbarHeight` (e.g., 60px for compact, 130px for large). Do **not** use `STANDARD` — it causes a validation error.

### Sliver Mode

Set `isSliver: true` to make the AppBar collapsible on scroll. Heights can use either pixels or screen percentage:

```yaml
# Percentage of screen (common for sliver)
expandedHeight:
  percentOfScreenSizeValue:
    inputValue: 45

# Pixels (common for toolbarHeight)
toolbarHeight:
  pixelsValue:
    inputValue: 56
```

---

## ConditionalBuilder

The ConditionalBuilder widget conditionally renders one of two child subtrees based on a condition.

### Minimal Example

```yaml
key: ConditionalBuilder_xxxxxxxx
type: ConditionalBuilder
props:
  conditionalBuilder: {}
```

### Full Schema

```yaml
key: ConditionalBuilder_xxxxxxxx
type: ConditionalBuilder
props:
  conditionalBuilder: {}                 # Condition is configured via the widget tree
```

### Notes

The ConditionalBuilder widget is typically a structural wrapper. Its condition logic is managed by the FlutterFlow editor and stored in the widget tree outline, not in the node YAML itself. The `conditionalBuilder` prop is usually an empty object `{}`. The actual condition is evaluated at runtime to decide which child branch to render.

Children of the ConditionalBuilder are organized into two branches in the widget tree:
- **True branch** - rendered when condition is met
- **False branch** - rendered when condition is not met

---

## Real Examples

**Icon with static ARGB color:**
```yaml
key: Icon_idonj3t4
type: Icon
props:
  icon:
    sizeValue:
      inputValue: 28
      mostRecentInputValue: 28
    colorValue:
      inputValue:
        value: "4291282887"
      mostRecentInputValue:
        value: "4291282887"
    iconDataValue:
      inputValue:
        codePoint: 983520
        family: MaterialIcons
        matchTextDirection: false
        name: store_rounded
  padding:
    type: FF_PADDING_ONLY
    topValue:
      inputValue: 4
      mostRecentInputValue: 4
  responsiveVisibility: {}
  opacity:
    opacityValue:
      inputValue: 1
      mostRecentInputValue: 1
parameterValues: {}
valueKey: {}
```

**Icon with conditional color (dynamic):**
```yaml
key: Icon_tbetpdvx
type: Icon
props:
  icon:
    sizeValue:
      inputValue: 32
    colorValue:
      variable:
        source: FUNCTION_CALL
        functionCall:
          conditionalValue:
            ifConditionalValues:
              - condition:
                  source: FUNCTION_CALL
                  functionCall:
                    values:
                      - variable:
                          source: LOCAL_STATE
                          baseVariable:
                            localState:
                              fieldIdentifier:
                                name: analysisSelected
                                key: c1va5
                              stateVariableType: WIDGET_CLASS_STATE
                          nodeKeyRef:
                            key: Scaffold_acmap1hi
                      - inputValue:
                          serializedValue: "1"
                    condition:
                      relation: EQUAL_TO
                value:
                  inputValue:
                    color:
                      value: "4279506971"
            elseValue:
              inputValue:
                color:
                  themeColor: PRIMARY_TEXT
            returnParameter:
              dataType:
                scalarType: Color
      mostRecentInputValue:
        themeColor: PRIMARY_TEXT
    iconDataValue:
      inputValue:
        codePoint: 62269
        family: MaterialIcons
        matchTextDirection: false
        name: science_outlined
  padding: {}
```

**Circular progress bar with animation:**
```yaml
key: ProgressBar_wntv8q6y
type: ProgressBar
props:
  expanded:
    expandedType: UNEXPANDED
  responsiveVisibility: {}
  progressBar:
    shape: Circular
    text:
      themeStyle: HEADLINE_SMALL
      textValue:
        inputValue: ""
    size:
      width:
        pixelsValue:
          inputValue: 150
      height:
        pixelsValue:
          inputValue: 6
    percentValue:
      variable:
        source: LOCAL_STATE
        baseVariable:
          localState:
            fieldIdentifier:
              name: loadingProgress
              key: s4r96
            stateVariableType: WIDGET_CLASS_STATE
        nodeKeyRef:
          key: Scaffold_0cxxh2p6
      mostRecentInputValue: 1
    progressColorValue:
      inputValue:
        value: "4282874240"
    backgroundColorValue:
      inputValue:
        value: "4290245323"
    animationValue:
      inputValue: true
  opacity:
    opacityValue:
      inputValue: 1
    animatedOpacity: {}
valueKey: {}
```

**Collapsible sliver AppBar with percentage heights:**
```yaml
key: AppBar_2ti1h14b
type: AppBar
props:
  appBar:
    toolbarHeight:
      pixelsValue:
        inputValue: 56
    isSliver: true
    expandedHeight:
      percentOfScreenSizeValue:
        inputValue: 40
    collapsedHeight:
      percentOfScreenSizeValue:
        inputValue: 10
    defaultBackButtonValue:
      inputValue: false
    backgroundColorValue:
      inputValue:
        value: "0"
    elevationValue:
      inputValue: 0
    centerTitleValue:
      inputValue: false
name: AppBars
```

**AppBar with no back button and no elevation:**
```yaml
key: AppBar_hhz2azx5
type: AppBar
props:
  appBar:
    templateType: LARGE_HEADER
    titleInFlexibleSpaceBar: false
    defaultBackButtonValue:
      inputValue: false
      mostRecentInputValue: false
    backgroundColorValue:
      inputValue:
        themeColor: SECONDARY_BACKGROUND
      mostRecentInputValue:
        themeColor: SECONDARY_BACKGROUND
    elevationValue:
      inputValue: 0
      mostRecentInputValue: 0
    centerTitleValue:
      inputValue: false
      mostRecentInputValue: false
  opacity:
    opacityValue:
      inputValue: 1
      mostRecentInputValue: 1
parameterValues: {}
```

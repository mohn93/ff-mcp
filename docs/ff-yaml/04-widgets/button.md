# Button and IconButton

## Button

### Minimal Example

```yaml
key: Button_xxxxxxxx
type: Button
props:
  button:
    text:
      themeStyle: TITLE_MEDIUM
      textValue:
        inputValue: Submit
    borderRadius:
      type: FF_BORDER_RADIUS_ALL
      allValue:
        inputValue: 8
    dimensions:
      width:
        pixelsValue:
          inputValue: Infinity
      height:
        pixelsValue:
          inputValue: 50
    fillColorValue:
      inputValue:
        themeColor: PRIMARY
  padding: {}
```

### Full Schema

```yaml
key: Button_xxxxxxxx
type: Button
props:
  button:
    text:                                # Button label text styling
      themeStyle: TITLE_MEDIUM           # Base theme style for text
      translationIdentifier:
        key: ja48xzh1                    # i18n translation key
      selectable: true                   # Whether text is selectable
      textValue:
        inputValue: Sign up              # Button label text
        mostRecentInputValue: Sign up    # Must match inputValue
      colorValue:                        # Text color
        inputValue:
          value: "4279506971"            # ARGB integer
          # OR themeColor: PRIMARY_TEXT
      fontWeightValue:
        inputValue: w700                 # Font weight override
    borderRadius:                        # Button corner radius
      type: FF_BORDER_RADIUS_ALL         # FF_BORDER_RADIUS_ALL or FF_BORDER_RADIUS_ONLY
      allValue:                          # Used with FF_BORDER_RADIUS_ALL
        inputValue: 8
      topLeftValue:                      # Individual corners (with FF_BORDER_RADIUS_ONLY or override)
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
    innerPadding:                        # Padding inside the button
      type: FF_PADDING_ALL
      allValue:
        inputValue: 8
    hasHoverStyle: true                  # Enable hover state
    dimensions:                          # Button size
      width:
        pixelsValue:
          inputValue: Infinity           # Infinity = fill parent width
      height:
        pixelsValue:
          inputValue: 50
    elevationValue:                      # Shadow elevation
      inputValue: 0
      mostRecentInputValue: 0
    fillColorValue:                      # Background color
      inputValue:
        value: "4287097512"              # ARGB integer
        # OR themeColor: SECONDARY_BACKGROUND
      mostRecentInputValue:
        value: "4287097512"
    borderColorValue:                    # Border color
      inputValue:
        themeColor: ALTERNATE
      mostRecentInputValue:
        themeColor: ALTERNATE
    borderWidthValue:                    # Border width
      inputValue: 2
      mostRecentInputValue: 2
    hoverColorValue:                     # Hover state fill color
      inputValue:
        themeColor: PRIMARY_BACKGROUND
      mostRecentInputValue:
        themeColor: PRIMARY_BACKGROUND
    iconValue:                           # Optional leading icon
      inputValue:
        sizeValue:
          inputValue: 20
          mostRecentInputValue: 20
        iconDataValue:
          inputValue:
            codePoint: 61856             # Unicode code point
            family: FontAwesomeBrands    # Icon font family
            package: font_awesome_flutter # Flutter package name
            matchTextDirection: false
            packageIcon:                 # Package-specific icon ID
              fontAwesome: google
            name: google                 # Human-readable icon name
  padding:                               # Outer padding
    type: FF_PADDING_ONLY
  visibility:                            # Conditional visibility
    visibleValue:
      variable:
        source: GLOBAL_PROPERTIES
        baseVariable:
          globalProperties:
            property: IS_IOS
      mostRecentInputValue: true
  responsiveVisibility: {}               # Breakpoint visibility
  opacity:
    opacityValue:
      inputValue: 1
    animatedOpacity: {}
parameterValues: {}
valueKey: {}
name: SignUpButton                       # Optional human-readable name
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `text.themeStyle` | enum | Yes | Same values as Text widget |
| `text.textValue.inputValue` | string | Yes | Button label text |
| `text.colorValue.inputValue` | object | No | Text color |
| `text.fontWeightValue.inputValue` | enum | No | w100-w900 (no `mostRecentInputValue`) |
| `text.translationIdentifier.key` | string | No | i18n key |
| `borderRadius.type` | enum | No | `FF_BORDER_RADIUS_ALL` or `FF_BORDER_RADIUS_ONLY` |
| `borderRadius.allValue.inputValue` | number | No | Uniform radius |
| `innerPadding` | object | No | Same format as padding |
| `hasHoverStyle` | bool | No | Enable hover effect |
| `dimensions.width.pixelsValue.inputValue` | number | No | Width (`Infinity` = fill) |
| `dimensions.height.pixelsValue.inputValue` | number | No | Height in px |
| `elevationValue.inputValue` | number | No | Shadow elevation (0 = flat) |
| `fillColorValue.inputValue` | object | No | Background color |
| `borderColorValue.inputValue` | object | No | Border stroke color |
| `borderWidthValue.inputValue` | number | No | Border stroke width |
| `hoverColorValue.inputValue` | object | No | Background on hover |
| `iconValue.inputValue` | object | No | Leading icon (see icon format) |

### Icon Format (reused in Button, IconButton, DropDown)

```yaml
iconValue:
  inputValue:
    sizeValue:
      inputValue: 20
    colorValue:
      inputValue:
        themeColor: PRIMARY
    iconDataValue:
      inputValue:
        codePoint: 61856               # Unicode code point
        family: FontAwesomeBrands      # Font family
        package: font_awesome_flutter  # Package (for non-Material icons)
        matchTextDirection: false
        packageIcon:                   # Package-specific icon mapping
          fontAwesome: google
        name: google                   # Human-readable name
        isCustom: true                 # For custom icon packs
```

Common icon families: `MaterialIcons`, `FontAwesomeBrands`, `FontAwesomeSolid`, `Tabler-Icons`.

---

## IconButton

### Minimal Example

```yaml
key: IconButton_xxxxxxxx
type: IconButton
props:
  iconButton:
    buttonSize:
      pixelsValue:
        inputValue: 40
    iconValue:
      inputValue:
        sizeValue:
          inputValue: 24
        colorValue:
          inputValue:
            themeColor: SECONDARY_TEXT
        iconDataValue:
          inputValue:
            codePoint: 63047
            family: MaterialIcons
            matchTextDirection: false
            name: close_rounded
```

### Full Schema

```yaml
key: IconButton_xxxxxxxx
type: IconButton
props:
  iconButton:
    buttonSize:                          # Overall button tap target size
      pixelsValue:
        inputValue: 40
        mostRecentInputValue: 40
    borderRadiusValue:                   # Button corner radius
      inputValue: 20
      mostRecentInputValue: 20
    borderColorValue:                    # Border stroke color
      inputValue:
        value: "1277303646"             # ARGB integer
    borderWidthValue:                    # Border stroke width
      inputValue: 1
      mostRecentInputValue: 1
    iconValue:                           # The icon to display
      inputValue:
        sizeValue:
          inputValue: 16                 # Icon size
        colorValue:
          inputValue:
            themeColor: PRIMARY          # Icon color
          mostRecentInputValue:
            themeColor: PRIMARY
        iconDataValue:
          inputValue:
            codePoint: 63295            # Unicode code point
            family: Tabler-Icons        # Icon font family
            matchTextDirection: false
            name: flag                  # Human-readable name
            isCustom: true              # Custom icon pack flag
  visibility:                            # Conditional visibility
    visibleValue:
      variable:
        source: LOCAL_STATE
        baseVariable:
          localState:
            fieldIdentifier:
              name: isAnonymous
              key: bfu0ivv2
            stateVariableType: APP_STATE
        operations:
          - negate: {}                   # Invert the boolean
      mostRecentInputValue: true
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
| `buttonSize.pixelsValue.inputValue` | number | Yes | Tap target diameter |
| `borderRadiusValue.inputValue` | number | No | Corner radius |
| `borderColorValue.inputValue` | object | No | Border color |
| `borderWidthValue.inputValue` | number | No | Border width |
| `iconValue.inputValue` | object | Yes | Icon specification (see icon format above) |

### Real Examples

**Primary CTA button with fill color and full width:**
```yaml
key: Button_q8y07fea
type: Button
props:
  button:
    text:
      themeStyle: TITLE_MEDIUM
      translationIdentifier:
        key: ja48xzh1
      selectable: true
      textValue:
        inputValue: Sign up
      colorValue:
        inputValue:
          value: "4279506971"
    borderRadius:
      type: FF_BORDER_RADIUS_ALL
      allValue:
        inputValue: 8
    innerPadding:
      type: FF_PADDING_ALL
      allValue:
        inputValue: 8
    dimensions:
      width:
        pixelsValue:
          inputValue: Infinity
      height:
        pixelsValue:
          inputValue: 50
    elevationValue:
      inputValue: 0
    fillColorValue:
      inputValue:
        value: "4287097512"
  padding: {}
name: SignUpButton
```

**Social login button with icon, border, and hover:**
```yaml
key: Button_pgwfbxkm
type: Button
props:
  button:
    text:
      themeStyle: BODY_MEDIUM
      translationIdentifier:
        key: yor8nbcw
      textValue:
        inputValue: Continue with Google
        mostRecentInputValue: Continue with Google
      fontWeightValue:
        inputValue: w700
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
        inputValue: 12
    hasHoverStyle: true
    dimensions:
      width:
        pixelsValue:
          inputValue: 300
      height:
        pixelsValue:
          inputValue: 44
          mostRecentInputValue: 44
    elevationValue:
      inputValue: 0
      mostRecentInputValue: 0
    fillColorValue:
      inputValue:
        themeColor: SECONDARY_BACKGROUND
      mostRecentInputValue:
        themeColor: SECONDARY_BACKGROUND
    borderColorValue:
      inputValue:
        themeColor: ALTERNATE
      mostRecentInputValue:
        themeColor: ALTERNATE
    borderWidthValue:
      inputValue: 2
      mostRecentInputValue: 2
    hoverColorValue:
      inputValue:
        themeColor: PRIMARY_BACKGROUND
      mostRecentInputValue:
        themeColor: PRIMARY_BACKGROUND
    iconValue:
      inputValue:
        sizeValue:
          inputValue: 20
          mostRecentInputValue: 20
        iconDataValue:
          inputValue:
            codePoint: 61856
            family: FontAwesomeBrands
            package: font_awesome_flutter
            matchTextDirection: false
            packageIcon:
              fontAwesome: google
            name: google
  padding:
    type: FF_PADDING_ONLY
  responsiveVisibility: {}
  opacity:
    opacityValue:
      inputValue: 1
    animatedOpacity: {}
parameterValues: {}
valueKey: {}
```

**IconButton with close icon and conditional visibility:**
```yaml
key: IconButton_oixaawhh
type: IconButton
props:
  iconButton:
    buttonSize:
      pixelsValue:
        inputValue: 40
    iconValue:
      inputValue:
        sizeValue:
          inputValue: 24
        colorValue:
          inputValue:
            themeColor: SECONDARY_TEXT
        iconDataValue:
          inputValue:
            codePoint: 63047
            family: MaterialIcons
            matchTextDirection: false
            name: close_rounded
  visibility:
    visibleValue:
      variable:
        source: LOCAL_STATE
        baseVariable:
          localState:
            fieldIdentifier:
              name: isAnonymous
              key: bfu0ivv2
            stateVariableType: APP_STATE
        operations:
          - negate: {}
      mostRecentInputValue: true
```

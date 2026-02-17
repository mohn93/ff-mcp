# Container

## Minimal Example

```yaml
key: Container_xxxxxxxx
type: Container
props:
  container:
    dimensions: {}
    boxDecoration: {}
```

## Full Schema

```yaml
key: Container_xxxxxxxx
type: Container
props:
  container:
    dimensions:                          # Container size
      width:
        pixelsValue:
          inputValue: 150                # Fixed pixel width
        # OR percentage:
        # percentOfScreenSizeValue:
        #   inputValue: 100              # Percentage of screen width
      height:
        pixelsValue:
          inputValue: 120                # Fixed pixel height
    maxDimensions:                       # Maximum size constraints
      width:
        pixelsValue:
          inputValue: 164
          mostRecentInputValue: 164
      height:
        pixelsValue:
          inputValue: 40
          mostRecentInputValue: 40
    minDimensions:                       # Minimum size constraints
      width:
        pixelsValue:
          inputValue: 164
      height:
        pixelsValue:
          inputValue: 90
    boxDecoration:                       # Visual decoration
      colorValue:                        # Background color
        inputValue:
          themeColor: PRIMARY_BACKGROUND
          # OR value: "4287097512"       # ARGB integer
        mostRecentInputValue:
          themeColor: PRIMARY_BACKGROUND
      borderRadius:                      # Corner radius
        type: FF_BORDER_RADIUS_ALL       # Uniform radius
        allValue:
          inputValue: 12
        # OR type: FF_BORDER_RADIUS_ONLY # Per-corner radius
        # topLeftValue:
        #   inputValue: 20
        # topRightValue:
        #   inputValue: 20
        # bottomLeftValue:
        #   inputValue: 0
        # bottomRightValue:
        #   inputValue: 0
      borderColorValue:                  # Border stroke color
        inputValue:
          value: "4279506971"
        # OR themeColor: PRIMARY_BACKGROUND
      borderWidthValue:                  # Border stroke width
        inputValue: 2
        mostRecentInputValue: 2
        # OR variable binding for dynamic width
      boxShadow: {}                      # Shadow configuration
      image:                             # Background image
        type: FF_IMAGE_TYPE_NETWORK      # FF_IMAGE_TYPE_NETWORK or FF_IMAGE_TYPE_ASSET
      elevationValue:                    # Material elevation
        inputValue: 0
        mostRecentInputValue: 0
    childAlignment:                      # Alignment of child within container
      xValue:
        inputValue: 0                    # -1 (left) to 1 (right)
      yValue:
        inputValue: -1                   # -1 (top) to 1 (bottom)
    animationDurationValue:              # Animated container duration (ms)
      inputValue: 100
      mostRecentInputValue: 100
  padding:                               # Inner padding
    type: FF_PADDING_ONLY
    topValue:
      inputValue: 16
      mostRecentInputValue: 16
  alignment:                             # Position within parent
    xValue:
      inputValue: 0                      # -1 to 1
    yValue:
      inputValue: -1                     # -1 to 1
  expanded:                              # Expand behavior
    expandedType: FLEXIBLE               # EXPANDED | FLEXIBLE | UNEXPANDED
  responsiveVisibility:                  # Breakpoint hiding
    tabletHidden: false
  opacity:
    opacityValue:
      inputValue: 1
      mostRecentInputValue: 1
    animatedOpacity: {}
parameterValues: {}
valueKey:
  inputValue: {}
name: OptionalName                       # Human-readable name
isDummyRoot: true                        # Component root marker (see below)
aiGeneratedNodeInfo:                     # AI generation tracking
  isAiGenerated: true
  requestPath: ai_component_gen_requests/xxxxxxxxxx
```

## Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `dimensions.width.pixelsValue.inputValue` | number | No | Width in px (`Infinity` = fill) |
| `dimensions.width.percentOfScreenSizeValue.inputValue` | number | No | Width as % of screen |
| `dimensions.height.pixelsValue.inputValue` | number | No | Height in px |
| `maxDimensions` | object | No | Same shape as dimensions |
| `minDimensions` | object | No | Same shape as dimensions |
| `boxDecoration.colorValue.inputValue` | object | No | Background color |
| `boxDecoration.borderRadius` | object | No | Corner radius specification |
| `boxDecoration.borderColorValue.inputValue` | object | No | Border color |
| `boxDecoration.borderWidthValue` | number/var | No | Border width (literal or variable) |
| `boxDecoration.boxShadow` | object | No | Shadow configuration |
| `boxDecoration.image` | object | No | Background image |
| `boxDecoration.elevationValue.inputValue` | number | No | Material elevation |
| `childAlignment` | object | No | Child position (x: -1..1, y: -1..1) |
| `animationDurationValue.inputValue` | number | No | Animation duration in ms |
| `isDummyRoot` | bool | No | `true` on component root containers |

## isDummyRoot Pattern

Component root containers are marked with `isDummyRoot: true`. This is how FlutterFlow identifies the top-level container of a reusable component:

```yaml
key: Container_od80u8ml
type: Container
props:
  container:
    boxDecoration:
      colorValue:
        inputValue:
          value: "0"
name: BottomSheetAddFood
isDummyRoot: true
```

The root container typically has a transparent background (`value: "0"`) and a descriptive `name`.

## Dimension Patterns

```yaml
# Fixed pixel size
width:
  pixelsValue:
    inputValue: 300

# Fill parent (stretch)
width:
  pixelsValue:
    inputValue: Infinity

# Percentage of screen
width:
  percentOfScreenSizeValue:
    inputValue: 100
    mostRecentInputValue: 100
```

## Real Examples

**Container with rounded corners and theme color:**
```yaml
key: Container_vzq4hmq5
type: Container
props:
  container:
    dimensions: {}
    boxDecoration:
      borderRadius:
        type: FF_BORDER_RADIUS_ALL
        allValue:
          inputValue: 8
      colorValue:
        inputValue:
          themeColor: TERTIARY
  padding:
    bottomValue:
      inputValue: 8
```

**Container with per-corner radius and border:**
```yaml
key: Container_z9kqe25k
type: Container
props:
  container:
    dimensions:
      width:
        percentOfScreenSizeValue:
          inputValue: 100
          mostRecentInputValue: 100
    boxDecoration:
      borderRadius:
        type: FF_BORDER_RADIUS_ONLY
        topLeftValue:
          inputValue: 20
          mostRecentInputValue: 20
        topRightValue:
          inputValue: 20
          mostRecentInputValue: 20
        bottomLeftValue:
          inputValue: 0
          mostRecentInputValue: 0
        bottomRightValue:
          inputValue: 0
          mostRecentInputValue: 0
      boxShadow: {}
      image:
        type: FF_IMAGE_TYPE_NETWORK
      colorValue:
        inputValue:
          themeColor: PRIMARY_BACKGROUND
        mostRecentInputValue:
          themeColor: PRIMARY_BACKGROUND
      borderColorValue:
        inputValue:
          themeColor: PRIMARY_BACKGROUND
        mostRecentInputValue:
          themeColor: PRIMARY_BACKGROUND
      borderWidthValue:
        inputValue: 0
        mostRecentInputValue: 0
    childAlignment:
      xValue:
        inputValue: 0
      yValue:
        inputValue: -1
    maxDimensions: {}
    minDimensions: {}
    elevationValue:
      inputValue: 0
      mostRecentInputValue: 0
    animationDurationValue:
      inputValue: 100
      mostRecentInputValue: 100
  padding:
    type: FF_PADDING_ONLY
    topValue:
      inputValue: 16
      mostRecentInputValue: 16
  alignment:
    xValue:
      inputValue: 0
    yValue:
      inputValue: -1
  expanded:
    expandedType: UNEXPANDED
  responsiveVisibility:
    tabletHidden: false
  opacity:
    opacityValue:
      inputValue: 1
      mostRecentInputValue: 1
    animatedOpacity: {}
parameterValues: {}
valueKey:
  inputValue: {}
```

**Container with conditional color via function call:**
```yaml
key: Container_asssrq5w
type: Container
props:
  container:
    dimensions:
      width:
        pixelsValue:
          inputValue: 120
    boxDecoration:
      borderRadius:
        type: FF_BORDER_RADIUS_ALL
        allValue:
          inputValue: 12
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
                                  name: subIndexSelected
                                  key: gdgw8
                                stateVariableType: WIDGET_CLASS_STATE
                            nodeKeyRef:
                              key: Scaffold_tydsj8ql
                        - inputValue:
                            serializedValue: "2"
                      condition:
                        relation: EQUAL_TO
                  value:
                    inputValue:
                      color:
                        value: "4287097512"
              elseValue:
                inputValue:
                  color:
                    value: "4287996332"
              returnParameter:
                dataType:
                  scalarType: Color
    minDimensions:
      height:
        pixelsValue:
          inputValue: 90
```

**Full-screen container for page background:**
```yaml
key: Container_2u9bf7vs
type: Container
props:
  container:
    dimensions:
      width:
        pixelsValue:
          inputValue: Infinity
      height:
        pixelsValue:
          inputValue: Infinity
    boxDecoration:
      boxShadow: {}
      image: {}
    maxDimensions: {}
    minDimensions: {}
  responsiveVisibility: {}
  opacity:
    opacityValue:
      inputValue: 1
    animatedOpacity: {}
valueKey: {}
```

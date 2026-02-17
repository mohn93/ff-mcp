# DropDown and ChoiceChips

## DropDown

### Minimal Example

```yaml
key: DropDown_xxxxxxxx
type: DropDown
props:
  padding: {}
  dropDown:
    dimensions:
      width:
        pixelsValue:
          inputValue: 120
    textStyle:
      themeStyle: BODY_MEDIUM
    optionsLabels:
      values:
        - translatableText:
            textValue:
              inputValue: Option A
        - translatableText:
            textValue:
              inputValue: Option B
    optionsValues:
      values:
        - serializedValue: a
        - serializedValue: b
    hintText: {}
    valueType:
      dataType:
        scalarType: String
```

### Full Schema

```yaml
key: DropDown_xxxxxxxx
type: DropDown
props:
  padding: {}
  alignment:                             # Position within parent
    xValue:
      inputValue: 0
      mostRecentInputValue: 0
    yValue:
      inputValue: 0
      mostRecentInputValue: 0
  dropDown:
    dimensions:                          # Dropdown button size
      width:
        pixelsValue:
          inputValue: 120
          mostRecentInputValue: 120
      height:
        pixelsValue:
          inputValue: 24
          mostRecentInputValue: 24
    textStyle:                           # Selected value text style
      themeStyle: BODY_MEDIUM
      colorValue:
        inputValue:
          themeColor: PRIMARY_TEXT
        mostRecentInputValue:
          themeColor: PRIMARY_TEXT
      fontWeightValue:
        inputValue: w400
    margin:                              # Outer margin
      type: FF_PADDING_ONLY
      leftValue:
        inputValue: 4
      topValue:
        inputValue: 0
      rightValue:
        inputValue: 110
      bottomValue:
        inputValue: 8
    initialOption:                       # Initially selected option
      textValue:
        inputValue: Default Value        # Literal default
        # OR variable binding:
        # variable:
        #   source: LOCAL_STATE
        #   baseVariable:
        #     localState:
        #       fieldIdentifier:
        #         name: distanceFilter
        #         key: gpp6v8yz
        #       stateVariableType: APP_STATE
    hintText: {}                         # Hint/placeholder text
    optionsHasKeyValues: false           # Whether options use key-value pairs
    valueType:                           # Data type of option values
      dataType:
        scalarType: String               # String | Integer | Double
    searchHintText:                      # Search field placeholder
      themeStyle: LABEL_MEDIUM
      translationIdentifier:
        key: mw7ulp44
      textValue:
        inputValue: Search for an item...
        mostRecentInputValue: Search for an item...
    fixPosition: true                    # Pin dropdown position
    searchTextStyle:                     # Search input text style
      themeStyle: BODY_MEDIUM
    label:                               # Label above dropdown
      themeStyle: LABEL_MEDIUM
      textAlignValue:
        inputValue: ALIGN_START
    fillColorValue:                      # Dropdown background color
      inputValue:
        themeColor: SECONDARY_BACKGROUND
      mostRecentInputValue:
        themeColor: SECONDARY_BACKGROUND
    elevationValue:                      # Dropdown menu elevation
      inputValue: 2
      mostRecentInputValue: 2
    borderRadiusValue:                   # Corner radius
      inputValue: 8
      mostRecentInputValue: 8
    borderColorValue:                    # Border color
      inputValue:
        themeColor: PRIMARY_BACKGROUND
      mostRecentInputValue:
        themeColor: PRIMARY_BACKGROUND
    borderWidthValue:                    # Border width
      inputValue: 2
      mostRecentInputValue: 2
    hidesUnderlineValue:                 # Remove default underline
      inputValue: true
      mostRecentInputValue: true
    iconValue:                           # Dropdown arrow icon
      inputValue:
        sizeValue:
          inputValue: 24
          mostRecentInputValue: 24
        colorValue:
          inputValue:
            themeColor: PRIMARY
          mostRecentInputValue:
            themeColor: PRIMARY
        iconDataValue:
          inputValue:
            codePoint: 63531
            family: MaterialIcons
            matchTextDirection: false
            name: keyboard_arrow_down_rounded
    initialOptionKeyValue:               # Initial option by key (for key-value options)
      values:
        - serializedValue: ""
      # OR variable binding
    optionsLabels:                       # Display labels for options
      values:
        - translatableText:
            translationIdentifier:
              key: 71cukul3
            textValue:
              inputValue: Highest Discount
              mostRecentInputValue: Highest Discount
        - translatableText:
            translationIdentifier:
              key: 5dzv467y
            textValue:
              inputValue: Closest To Me
              mostRecentInputValue: Closest To Me
    optionsValues:                       # Internal values for options
      values:
        - serializedValue: Discount
        - serializedValue: Closes
  visibility:                            # Conditional visibility
    visibleValue:
      variable:
        source: FUNCTION_CALL
        functionCall:
          values:
            - variable:
                source: LOCAL_STATE
                baseVariable:
                  localState:
                    fieldIdentifier:
                      name: email
                      key: x2tvdt22
                    stateVariableType: APP_STATE
            - inputValue:
                serializedValue: SOME_VALUE
          condition:
            relation: EQUAL_TO
        uiBuilderValue:
          serializedValue: "false"
      mostRecentInputValue: false
  responsiveVisibility: {}
name: DDS                                # Human-readable name
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `dimensions` | object | No | Size of dropdown button |
| `textStyle` | object | No | Style for selected value text |
| `margin` | object | No | Outer margin around dropdown |
| `initialOption.textValue` | object | No | Default selected value |
| `hintText` | object | No | Placeholder when nothing selected |
| `optionsHasKeyValues` | bool | No | Use key-value option pairs |
| `valueType.dataType.scalarType` | string | No | Data type: `String`, `Integer`, `Double` |
| `searchHintText` | object | No | Search field hint text |
| `fixPosition` | bool | No | Pin dropdown position |
| `label` | object | No | Label text above dropdown |
| `fillColorValue.inputValue` | object | No | Background fill color |
| `elevationValue.inputValue` | number | No | Menu shadow elevation |
| `borderRadiusValue.inputValue` | number | No | Corner radius |
| `borderColorValue.inputValue` | object | No | Border color |
| `borderWidthValue.inputValue` | number | No | Border width |
| `hidesUnderlineValue.inputValue` | bool | No | Remove underline decoration |
| `iconValue.inputValue` | object | No | Dropdown arrow icon |
| `optionsLabels.values` | array | Yes | Display text for each option |
| `optionsValues.values` | array | Yes | Internal value for each option |
| `initialOptionKeyValue.values` | array | No | Initial option by key reference |

---

## ChoiceChips

### Minimal Example

```yaml
key: ChoiceChips_xxxxxxxx
type: ChoiceChips
props:
  choiceChips:
    options:
      - label:
          textValue:
            inputValue: Option A
      - label:
          textValue:
            inputValue: Option B
    selectedChipStyle:
      textStyle:
        themeStyle: BODY_MEDIUM
      backgroundColorValue:
        inputValue:
          themeColor: PRIMARY
    unselectedChipStyle:
      textStyle:
        themeStyle: BODY_MEDIUM
      backgroundColorValue:
        inputValue:
          themeColor: SECONDARY_BACKGROUND
```

### Full Schema

```yaml
key: ChoiceChips_xxxxxxxx
type: ChoiceChips
props:
  padding:
    topValue:
      inputValue: 5
    bottomValue:
      inputValue: 5
  expanded:
    expandedType: UNEXPANDED
  choiceChips:
    options:                             # Array of chip options
      - iconData:                        # Optional icon per chip
          codePoint: 59889
          family: Tabler-Icons
          matchTextDirection: false
          name: mapPin
          isCustom: true
        label:                           # Chip label text
          translationIdentifier:
            key: twb1c9ul
          textValue:
            inputValue: Nearby
      - iconData:
          codePoint: 63421
          family: Tabler-Icons
          matchTextDirection: false
          name: grillFork
          isCustom: true
        label:
          translationIdentifier:
            key: xmkvmsha
          textValue:
            inputValue: Food
      - iconData:
          codePoint: 984739
          family: MaterialIcons
          matchTextDirection: false
          name: discount_outlined
        label:
          translationIdentifier:
            key: e4th7qdd
          textValue:
            inputValue: Entertainment
    selectedChipStyle:                   # Style when chip is selected
      textStyle:
        themeStyle: BODY_MEDIUM
        colorValue:
          inputValue:
            themeColor: INFO
      labelPadding:
        type: FF_PADDING_ONLY
        topValue:
          inputValue: 4
        rightValue:
          inputValue: 10
        bottomValue:
          inputValue: 4
        allValue:
          inputValue: 4
      borderRadius:
        type: FF_BORDER_RADIUS_ALL
        allValue:
          inputValue: 100                # Pill shape
      backgroundColorValue:
        inputValue:
          value: "4278190080"            # Black
      iconColorValue:
        inputValue:
          themeColor: INFO
      iconSizeValue:
        inputValue: 16
      elevationValue:
        inputValue: 0
    unselectedChipStyle:                 # Style when chip is not selected
      textStyle:
        themeStyle: BODY_MEDIUM
        colorValue:
          inputValue:
            value: "4286614942"
        fontWeightValue:
          inputValue: w600
      labelPadding:
        topValue:
          inputValue: 4
        rightValue:
          inputValue: 10
        bottomValue:
          inputValue: 4
      borderRadius:
        type: FF_BORDER_RADIUS_ALL
        allValue:
          inputValue: 100
      backgroundColorValue:
        inputValue:
          themeColor: SECONDARY_BACKGROUND
      iconColorValue:
        inputValue:
          themeColor: SECONDARY_TEXT
      iconSizeValue:
        inputValue: 16
      elevationValue:
        inputValue: 0
      borderColorValue:
        inputValue:
          value: "4291415247"
    initialOption:                       # Default selected chip
      translationIdentifier:
        key: n47l1c3n
      textValue:
        variable:
          source: LOCAL_STATE
          baseVariable:
            localState:
              fieldIdentifier:
                name: TypeFilter
                key: uudqi8wd
              stateVariableType: APP_STATE
        mostRecentInputValue: Nearby
    childAlignment: wrap_start           # Chip alignment within row
    chipSpacingValue:                    # Horizontal spacing between chips
      inputValue: 8
    rowSpacingValue:                     # Vertical spacing between rows
      inputValue: 8
    wrappedValue:                        # Whether chips wrap to next line
      inputValue: false
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `options` | array | Yes | List of chip options |
| `options[].label.textValue.inputValue` | string | Yes | Chip label text |
| `options[].iconData` | object | No | Icon for each chip |
| `selectedChipStyle` | object | Yes | Visual style when selected |
| `selectedChipStyle.textStyle` | object | No | Text style |
| `selectedChipStyle.backgroundColorValue.inputValue` | object | No | Fill color |
| `selectedChipStyle.borderRadius` | object | No | Corner radius |
| `selectedChipStyle.iconColorValue.inputValue` | object | No | Icon color |
| `selectedChipStyle.iconSizeValue.inputValue` | number | No | Icon size |
| `selectedChipStyle.elevationValue.inputValue` | number | No | Shadow elevation |
| `selectedChipStyle.labelPadding` | object | No | Internal padding |
| `unselectedChipStyle` | object | Yes | Visual style when not selected |
| `initialOption.textValue` | object | No | Default selected chip value |
| `childAlignment` | enum | No | `wrap_start`, `wrap_center`, `wrap_end` |
| `chipSpacingValue.inputValue` | number | No | Horizontal gap between chips |
| `rowSpacingValue.inputValue` | number | No | Vertical gap between rows |
| `wrappedValue.inputValue` | bool | No | Whether chips wrap |

### Chip Style Properties

Both `selectedChipStyle` and `unselectedChipStyle` share the same shape:

```yaml
chipStyle:
  textStyle:                           # Text styling
    themeStyle: BODY_MEDIUM
    colorValue:
      inputValue: { themeColor: INFO }
    fontWeightValue:
      inputValue: w600
  labelPadding:                        # Padding around label
    type: FF_PADDING_ONLY
    topValue: { inputValue: 4 }
    rightValue: { inputValue: 10 }
    bottomValue: { inputValue: 4 }
  borderRadius:                        # Corner radius
    type: FF_BORDER_RADIUS_ALL
    allValue: { inputValue: 100 }     # 100 = pill shape
  backgroundColorValue:                # Fill color
    inputValue: { themeColor: PRIMARY }
  borderColorValue:                    # Border color (usually on unselected)
    inputValue: { value: "4291415247" }
  iconColorValue:                      # Leading icon color
    inputValue: { themeColor: INFO }
  iconSizeValue:                       # Leading icon size
    inputValue: 16
  elevationValue:                      # Shadow elevation
    inputValue: 0
```

## Real Example

**Category filter chips with icons:**
```yaml
key: ChoiceChips_wo1694dv
type: ChoiceChips
props:
  padding:
    topValue:
      inputValue: 5
    bottomValue:
      inputValue: 5
  expanded:
    expandedType: UNEXPANDED
  choiceChips:
    options:
      - iconData:
          codePoint: 59889
          family: Tabler-Icons
          matchTextDirection: false
          name: mapPin
          isCustom: true
        label:
          translationIdentifier:
            key: twb1c9ul
          textValue:
            inputValue: Nearby
      - iconData:
          codePoint: 63421
          family: Tabler-Icons
          matchTextDirection: false
          name: grillFork
          isCustom: true
        label:
          translationIdentifier:
            key: xmkvmsha
          textValue:
            inputValue: Food
      - iconData:
          codePoint: 61029
          family: Tabler-Icons
          matchTextDirection: false
          name: tool
          isCustom: true
        label:
          translationIdentifier:
            key: ktgo4894
          textValue:
            inputValue: Service
      - iconData:
          codePoint: 984739
          family: MaterialIcons
          matchTextDirection: false
          name: discount_outlined
        label:
          translationIdentifier:
            key: e4th7qdd
          textValue:
            inputValue: Entertainment
    selectedChipStyle:
      textStyle:
        themeStyle: BODY_MEDIUM
        colorValue:
          inputValue:
            themeColor: INFO
      labelPadding:
        type: FF_PADDING_ONLY
        topValue:
          inputValue: 4
        rightValue:
          inputValue: 10
        bottomValue:
          inputValue: 4
        allValue:
          inputValue: 4
      borderRadius:
        type: FF_BORDER_RADIUS_ALL
        allValue:
          inputValue: 100
      backgroundColorValue:
        inputValue:
          value: "4278190080"
      iconColorValue:
        inputValue:
          themeColor: INFO
      iconSizeValue:
        inputValue: 16
      elevationValue:
        inputValue: 0
    unselectedChipStyle:
      textStyle:
        themeStyle: BODY_MEDIUM
        colorValue:
          inputValue:
            value: "4286614942"
        fontWeightValue:
          inputValue: w600
      labelPadding:
        topValue:
          inputValue: 4
        rightValue:
          inputValue: 10
        bottomValue:
          inputValue: 4
      borderRadius:
        type: FF_BORDER_RADIUS_ALL
        allValue:
          inputValue: 100
      backgroundColorValue:
        inputValue:
          themeColor: SECONDARY_BACKGROUND
      iconColorValue:
        inputValue:
          themeColor: SECONDARY_TEXT
      iconSizeValue:
        inputValue: 16
      elevationValue:
        inputValue: 0
      borderColorValue:
        inputValue:
          value: "4291415247"
    initialOption:
      translationIdentifier:
        key: n47l1c3n
      textValue:
        variable:
          source: LOCAL_STATE
          baseVariable:
            localState:
              fieldIdentifier:
                name: TypeFilter
                key: uudqi8wd
              stateVariableType: APP_STATE
        mostRecentInputValue: Nearby
    childAlignment: wrap_start
    chipSpacingValue:
      inputValue: 8
    rowSpacingValue:
      inputValue: 8
    wrappedValue:
      inputValue: false
```

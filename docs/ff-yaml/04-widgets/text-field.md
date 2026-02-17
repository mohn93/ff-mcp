# TextField

## Minimal Example

```yaml
key: TextField_xxxxxxxx
type: TextField
props:
  padding: {}
  textField:
    textStyle:
      themeStyle: BODY_MEDIUM
    inputDecoration:
      inputBorderType: outline
      hintText:
        textValue:
          inputValue: Enter text
    keyboardType: TEXT
    width:
      pixelsValue:
        inputValue: Infinity
```

## Full Schema

```yaml
key: TextField_xxxxxxxx
type: TextField
props:
  padding: {}                            # Outer padding (common prop)
  textField:
    textStyle:                           # Style for user-entered text
      themeStyle: BODY_MEDIUM            # Base theme text style
      colorValue:                        # Text color
        inputValue:
          themeColor: PRIMARY_TEXT
    inputDecoration:                     # Input field decoration
      inputBorderType: outline           # Border type: outline | underline | none
      borderRadius:                      # Corner radius for outline border
        type: FF_BORDER_RADIUS_ALL
        allValue:
          inputValue: 8
      contentPadding:                    # Padding inside the text field
        leftValue:
          inputValue: 16
        topValue:
          inputValue: 16
        rightValue:
          inputValue: 16
        bottomValue:
          inputValue: 16
      hintStyle:                         # Style for hint text
        themeStyle: BODY_MEDIUM
        colorValue:
          inputValue:
            themeColor: SECONDARY_TEXT
      hintText:                          # Placeholder text
        translationIdentifier:
          key: unr512uv                  # i18n key
        textValue:
          inputValue: Email              # Hint text content
      borderColorValue:                  # Border color
        inputValue:
          themeColor: ALTERNATE
      filledValue:                       # Whether field has fill color
        inputValue: true
      fillColorValue:                    # Fill background color
        inputValue:
          themeColor: SECONDARY_BACKGROUND
    passwordField: true                  # Obscure text (password mode)
    keyboardType: EMAIL_ADDRESS          # Keyboard type (see enum below)
    width:                               # Field width
      pixelsValue:
        inputValue: Infinity             # Infinity = fill parent
    maxLinesValue:                       # Max lines (1 = single line)
      inputValue: 1
    maxLengthEnforcement: NOT_ENFORCED   # Character limit enforcement
    autofocusValue:                      # Auto-focus on mount
      inputValue: false
    enableInteractiveSelection:          # Allow text selection
      inputValue: true
    trailingIconValue:                   # Icon at right side of field
      inputValue:
        sizeValue:
          inputValue: 22
        colorValue:
          inputValue:
            themeColor: SECONDARY_TEXT
        iconDataValue:
          inputValue:
            codePoint: 59070
            family: MaterialIcons
            matchTextDirection: false
            name: visibility_off
name: EmailTextField                     # Optional human-readable name
```

## Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `textStyle.themeStyle` | enum | Yes | Theme text style for input text |
| `textStyle.colorValue.inputValue` | object | No | Input text color |
| `inputDecoration.inputBorderType` | enum | No | `outline`, `underline`, or `none` |
| `inputDecoration.borderRadius` | object | No | Corner radius (outline only) |
| `inputDecoration.contentPadding` | object | No | Inner padding (left/top/right/bottom) |
| `inputDecoration.hintStyle` | object | No | Hint text style |
| `inputDecoration.hintText.textValue.inputValue` | string | No | Placeholder text |
| `inputDecoration.hintText.translationIdentifier.key` | string | No | i18n key for hint |
| `inputDecoration.borderColorValue.inputValue` | object | No | Border color |
| `inputDecoration.filledValue.inputValue` | bool | No | Enable fill background |
| `inputDecoration.fillColorValue.inputValue` | object | No | Fill color |
| `passwordField` | bool | No | Enable password obscuring |
| `keyboardType` | enum | Yes | Keyboard layout type |
| `width.pixelsValue.inputValue` | number | No | Width (`Infinity` = fill parent) |
| `maxLinesValue.inputValue` | number | No | Max visible lines (1 = single-line) |
| `maxLengthEnforcement` | enum | No | `NOT_ENFORCED` or `ENFORCED` |
| `autofocusValue.inputValue` | bool | No | Auto-focus on mount |
| `enableInteractiveSelection.inputValue` | bool | No | Allow text selection |
| `trailingIconValue.inputValue` | object | No | Icon on the right side |

> **Warning:** `fontWeightValue` and `fontSizeValue` (on `textStyle`) do **not** support `mostRecentInputValue`. Only use `inputValue` for these fields.

## keyboardType Enum

| Value | Description |
|-------|-------------|
| `TEXT` | Default text keyboard |
| `EMAIL_ADDRESS` | Email keyboard with @ symbol |
| `NUMBER` | Numeric keyboard |
| `PHONE` | Phone number keyboard |
| `MULTILINE` | Multiline text input |
| `URL` | URL keyboard |
| `VISIBLE_PASSWORD` | Password without obscuring |
| `NAME` | Name input keyboard |
| `STREET_ADDRESS` | Street address keyboard |

## Real Examples

**Email field with full decoration:**
```yaml
key: TextField_mxlvp4hj
type: TextField
props:
  padding: {}
  textField:
    textStyle:
      themeStyle: BODY_MEDIUM
      colorValue:
        inputValue:
          themeColor: PRIMARY_TEXT
    inputDecoration:
      inputBorderType: outline
      borderRadius:
        type: FF_BORDER_RADIUS_ALL
        allValue:
          inputValue: 8
      contentPadding:
        leftValue:
          inputValue: 16
        topValue:
          inputValue: 16
        rightValue:
          inputValue: 16
        bottomValue:
          inputValue: 16
      hintStyle:
        themeStyle: BODY_MEDIUM
        colorValue:
          inputValue:
            themeColor: SECONDARY_TEXT
      hintText:
        translationIdentifier:
          key: unr512uv
        textValue:
          inputValue: Email
      borderColorValue:
        inputValue:
          themeColor: ALTERNATE
      filledValue:
        inputValue: true
      fillColorValue:
        inputValue:
          themeColor: SECONDARY_BACKGROUND
    keyboardType: EMAIL_ADDRESS
    width:
      pixelsValue:
        inputValue: Infinity
    maxLinesValue:
      inputValue: 1
    autofocusValue:
      inputValue: false
    trailingIconValue:
      inputValue:
        sizeValue:
          inputValue: 22
        colorValue:
          inputValue:
            themeColor: SECONDARY_TEXT
name: EmailTextField
```

**Password field with visibility toggle icon:**
```yaml
key: TextField_3pu6ien6
type: TextField
props:
  padding: {}
  textField:
    textStyle:
      themeStyle: BODY_MEDIUM
    inputDecoration:
      inputBorderType: outline
      borderRadius:
        type: FF_BORDER_RADIUS_ALL
        allValue:
          inputValue: 8
      contentPadding:
        leftValue:
          inputValue: 16
        topValue:
          inputValue: 16
        rightValue:
          inputValue: 16
        bottomValue:
          inputValue: 16
      hintStyle:
        themeStyle: BODY_MEDIUM
        colorValue:
          inputValue:
            themeColor: SECONDARY_TEXT
      hintText:
        translationIdentifier:
          key: 7nurlg8g
        textValue:
          inputValue: Password
      borderColorValue:
        inputValue:
          themeColor: ALTERNATE
      filledValue:
        inputValue: true
      fillColorValue:
        inputValue:
          themeColor: SECONDARY_BACKGROUND
    passwordField: true
    keyboardType: TEXT
    width:
      pixelsValue:
        inputValue: Infinity
    maxLengthEnforcement: NOT_ENFORCED
    maxLinesValue:
      inputValue: 1
    autofocusValue:
      inputValue: false
    trailingIconValue:
      inputValue:
        iconDataValue:
          inputValue:
            codePoint: 59070
            family: MaterialIcons
            matchTextDirection: false
            name: visibility_off
    enableInteractiveSelection:
      inputValue: true
name: PasswordTextField
```

**Multiline text field (3 lines):**
```yaml
key: TextField_m3tc50mw
type: TextField
props:
  padding: {}
  textField:
    textStyle:
      themeStyle: BODY_MEDIUM
    inputDecoration:
      inputBorderType: outline
      borderRadius:
        type: FF_BORDER_RADIUS_ALL
        allValue:
          inputValue: 12
      contentPadding:
        leftValue:
          inputValue: 16
        topValue:
          inputValue: 16
        rightValue:
          inputValue: 16
        bottomValue:
          inputValue: 16
      hintStyle:
        themeStyle: BODY_MEDIUM
        colorValue:
          inputValue:
            themeColor: SECONDARY_TEXT
      hintText:
        translationIdentifier:
          key: o05uez5s
        textValue:
          inputValue: Add your meals for the day
      borderColorValue:
        inputValue:
          themeColor: ALTERNATE
      filledValue:
        inputValue: true
      fillColorValue:
        inputValue:
          themeColor: SECONDARY_BACKGROUND
    keyboardType: TEXT
    width:
      pixelsValue:
        inputValue: Infinity
    maxLinesValue:
      inputValue: 3
    autofocusValue:
      inputValue: false
    trailingIconValue:
      inputValue:
        sizeValue:
          inputValue: 22
        colorValue:
          inputValue:
            themeColor: SECONDARY_TEXT
name: AddFoodTextField
```

# Text and RichTextSpan

## Text

### Minimal Example

```yaml
key: Text_xxxxxxxx
type: Text
props:
  text:
    themeStyle: BODY_MEDIUM
    selectable: false
    textValue:
      inputValue: Hello World
  padding: {}
```

### Full Schema

```yaml
key: Text_xxxxxxxx
type: Text
props:
  text:
    themeStyle: HEADLINE_MEDIUM          # Theme text style preset (see enum below)
    translationIdentifier:               # i18n key for this text
      key: pudajyoa                      # Auto-generated translation key
    selectable: false                    # Whether user can select/copy text
    textValue:                           # The actual text content
      inputValue: Create an Account      # Literal string
      # OR variable binding:
      # variable:
      #   source: WIDGET_CLASS_PARAMETER
      #   baseVariable:
      #     widgetClass:
      #       paramIdentifier:
      #         name: title
      #         key: abc123
      #   nodeKeyRef:
      #     key: Scaffold_xxxxxxxx
    fontSizeValue:                       # Override font size from theme
      inputValue: 28
    colorValue:                          # Text color
      inputValue:
        themeColor: PRIMARY_TEXT          # Theme color reference
        # OR ARGB integer:
        # value: "4284982146"
    fontWeightValue:                     # Font weight override
      inputValue: w600                   # See weight enum below
    textAlignValue:                      # Text alignment
      inputValue: ALIGN_CENTER           # See alignment enum below
  padding:                               # Common padding prop
    type: FF_PADDING_ONLY
    leftValue:
      inputValue: 4
  expanded:                              # Optional expand behavior
    expandedType: EXPANDED               # EXPANDED | FLEXIBLE | UNEXPANDED
  responsiveVisibility: {}               # Optional breakpoint visibility
  opacity:                               # Optional opacity
    opacityValue:
      inputValue: 1
    animatedOpacity: {}
  visibility:                            # Optional conditional visibility
    visibleValue:
      variable:
        source: CONSTANTS
        baseVariable:
          constants:
            value: "FALSE"
      mostRecentInputValue: true
parameterValues: {}                      # Optional parameter pass-through
valueKey: {}                             # Optional key for state preservation
name: OptionalName                       # Optional human-readable name
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `themeStyle` | enum | Yes | Base text style from theme |
| `translationIdentifier.key` | string | No | Auto-generated i18n key |
| `selectable` | bool | No | Defaults to `false` |
| `textValue.inputValue` | string | Yes | The display text (literal or variable) |
| `fontSizeValue.inputValue` | number | No | Override font size in px |
| `colorValue.inputValue` | object | No | `themeColor` or ARGB `value` |
| `fontWeightValue.inputValue` | enum | No | Font weight override |
| `textAlignValue.inputValue` | enum | No | Text alignment |

### themeStyle Enum

| Value | Description |
|-------|-------------|
| `DISPLAY_LARGE` | Display Large |
| `DISPLAY_MEDIUM` | Display Medium |
| `DISPLAY_SMALL` | Display Small |
| `HEADLINE_LARGE` | Headline Large |
| `HEADLINE_MEDIUM` | Headline Medium |
| `HEADLINE_SMALL` | Headline Small |
| `TITLE_LARGE` | Title Large |
| `TITLE_MEDIUM` | Title Medium |
| `TITLE_SMALL` | Title Small |
| `LABEL_LARGE` | Label Large |
| `LABEL_MEDIUM` | Label Medium |
| `LABEL_SMALL` | Label Small |
| `BODY_LARGE` | Body Large |
| `BODY_MEDIUM` | Body Medium |
| `BODY_SMALL` | Body Small |

### fontWeight Values

`w100`, `w200`, `w300`, `w400` (normal), `w500`, `w600` (semi-bold), `w700` (bold), `w800`, `w900`.

> **Warning:** `fontWeightValue` and `fontSizeValue` do **not** support `mostRecentInputValue`. Only use `inputValue` for these fields. Adding `mostRecentInputValue` will cause a validation error.

### textAlign Values

`ALIGN_START`, `ALIGN_CENTER`, `ALIGN_END`, `ALIGN_JUSTIFY`.

---

## RichTextSpan

RichTextSpan widgets are children of a RichText parent. Each span represents a styled segment of text.

### Minimal Example

```yaml
key: RichTextSpan_xxxxxxxx
type: RichTextSpan
props:
  richTextSpan:
    textSpan:
      textValue:
        inputValue: ", "
```

### Full Schema

```yaml
key: RichTextSpan_xxxxxxxx
type: RichTextSpan
props:
  richTextSpan:
    textSpan:
      fontFamily: Open Sans              # Custom font family name
      themeStyle: BODY_MEDIUM            # Base theme text style
      legacyOverflowReplacement: ellipsis # Overflow behavior
      isCustomFont: false                # Whether fontFamily is custom
      translationIdentifier:
        key: cwt83xwk                    # i18n translation key
      selectable: false                  # Text selection enabled
      textValue:                         # Text content (literal or variable)
        inputValue: Hello World
        # OR variable:
        #   source: WIDGET_CLASS_PARAMETER
        #   defaultValue:
        #     serializedValue: City
        #   baseVariable:
        #     widgetClass:
        #       paramIdentifier:
        #         name: city
        #         key: k0wwda
        #   nodeKeyRef:
        #     key: Scaffold_xxxxxxxx
        #   uiBuilderValue:
        #     serializedValue: City
      fontSizeValue:
        inputValue: 14                   # Font size override
      colorValue:
        inputValue:
          value: "4287269514"            # ARGB color integer
      legacyOverriddenTextMaxCharsValue:
        inputValue: 30                   # Max characters before truncation
      fontWeightValue:
        inputValue: w600                 # Font weight
      textAlignValue:
        inputValue: ALIGN_START          # Alignment
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `textSpan.textValue.inputValue` | string | Yes | The span text content |
| `textSpan.themeStyle` | enum | No | Same values as Text themeStyle |
| `textSpan.fontFamily` | string | No | Named font family |
| `textSpan.isCustomFont` | bool | No | Whether font is custom-loaded |
| `textSpan.fontSizeValue.inputValue` | number | No | Font size override |
| `textSpan.colorValue.inputValue` | object | No | Color (themeColor or ARGB value) |
| `textSpan.fontWeightValue.inputValue` | enum | No | Font weight |
| `textSpan.textAlignValue.inputValue` | enum | No | Text alignment |
| `textSpan.selectable` | bool | No | Text selection enabled |
| `textSpan.legacyOverflowReplacement` | string | No | `ellipsis` for overflow handling |
| `textSpan.legacyOverriddenTextMaxCharsValue.inputValue` | number | No | Max chars before truncation |
| `textSpan.translationIdentifier.key` | string | No | i18n key |

### Real Examples

**Simple text with theme style and custom size:**
```yaml
key: Text_twhdzcyx
type: Text
props:
  text:
    themeStyle: HEADLINE_MEDIUM
    translationIdentifier:
      key: pudajyoa
    selectable: false
    textValue:
      inputValue: Create an Account
    fontSizeValue:
      inputValue: 28
    colorValue:
      inputValue:
        themeColor: PRIMARY_TEXT
    fontWeightValue:
      inputValue: w600
  padding: {}
```

**Text with ARGB color and custom weight:**
```yaml
key: Text_mc60e4wt
type: Text
props:
  text:
    themeStyle: BODY_MEDIUM
    translationIdentifier:
      key: n4ydgwcb
    selectable: false
    textValue:
      inputValue: Login
    colorValue:
      inputValue:
        value: "4284982146"
    fontWeightValue:
      inputValue: w600
```

**Expanded text with theme color:**
```yaml
key: Text_xg8qrg64
type: Text
props:
  text:
    themeStyle: BODY_MEDIUM
    translationIdentifier:
      key: u0i7hkg9
    selectable: false
    textValue:
      inputValue: "I have read and understand the Privacy Policy, and agree to Terms of Service"
    colorValue:
      inputValue:
        themeColor: PRIMARY_TEXT
  expanded:
    expandedType: EXPANDED
```

**RichTextSpan with variable binding:**
```yaml
key: RichTextSpan_je5zvzcq
type: RichTextSpan
props:
  richTextSpan:
    textSpan:
      fontFamily: Open Sans
      themeStyle: BODY_MEDIUM
      legacyOverflowReplacement: ellipsis
      isCustomFont: false
      translationIdentifier:
        key: cwt83xwk
      selectable: false
      textValue:
        variable:
          source: WIDGET_CLASS_PARAMETER
          defaultValue:
            serializedValue: City
          baseVariable:
            widgetClass:
              paramIdentifier:
                name: city
                key: k0wwda
          nodeKeyRef:
            key: Scaffold_q2hw5kk7
          uiBuilderValue:
            serializedValue: City
      fontSizeValue:
        inputValue: 14
        mostRecentInputValue: 14
      colorValue:
        inputValue:
          value: "4287269514"
        mostRecentInputValue:
          value: "4287269514"
      legacyOverriddenTextMaxCharsValue:
        inputValue: 30
      fontWeightValue:
        inputValue: w600
      textAlignValue:
        inputValue: ALIGN_START
```

# Widget YAML Reference

This directory documents every FlutterFlow widget type's YAML schema, extracted from real cached project files.

## Widget Type Index

| Type | File | Description |
|------|------|-------------|
| Text, RichTextSpan | [text.md](text.md) | Static text display and rich text spans |
| Button, IconButton | [button.md](button.md) | Tappable buttons with text/icon |
| TextField | [text-field.md](text-field.md) | Text input fields with decoration |
| Container | [container.md](container.md) | Box decoration, backgrounds, sizing |
| Column, Row, Stack, Wrap | [layout.md](layout.md) | Layout containers |
| Image | [image.md](image.md) | Asset and network images |
| Form | [form.md](form.md) | Form validation wrapper |
| DropDown, ChoiceChips | [dropdown.md](dropdown.md) | Selection widgets |
| Icon, ProgressBar, AppBar, ConditionalBuilder | [misc.md](misc.md) | Other widget types |

## Common Props

Every widget node has a top-level structure with these fields:

```yaml
key: WidgetType_xxxxxxxx        # Unique widget ID
type: WidgetType                # Widget type enum (Text, Button, Container, etc.)
props:
  # Widget-specific props wrapper (text:, button:, container:, etc.)
  # Plus common props listed below
name: OptionalHumanName         # Optional human-readable name
isDummyRoot: true               # Only on component root containers
parameterValues: {}             # Parameter pass-through bindings
valueKey: {}                    # Key for state preservation
aiGeneratedNodeInfo:            # Present if AI-generated
  isAiGenerated: true
  requestPath: ai_component_gen_requests/xxxxx
```

### Common Props (under `props:`)

These props can appear on **any** widget type:

| Prop | Type | Description |
|------|------|-------------|
| `padding` | object | Padding around the widget. See padding format below. |
| `expanded` | object | `expandedType: EXPANDED`, `FLEXIBLE`, or `UNEXPANDED` |
| `responsiveVisibility` | object | Hide on breakpoints: `phoneHidden`, `tabletHidden`, `tabletLandscapeHidden`, `desktopHidden` |
| `opacity` | object | `opacityValue.inputValue: 0..1` and optional `animatedOpacity: {}` |
| `alignment` | object | Position within parent: `xValue.inputValue` (-1 to 1), `yValue.inputValue` (-1 to 1) |
| `visibility` | object | Conditional visibility via `visibleValue` (literal bool or variable binding) |

### Padding Format

```yaml
# All sides equal
padding:
  type: FF_PADDING_ALL
  allValue:
    inputValue: 16

# Individual sides
padding:
  type: FF_PADDING_ONLY
  leftValue:
    inputValue: 16
  topValue:
    inputValue: 8
  rightValue:
    inputValue: 16
  bottomValue:
    inputValue: 8

# Empty (no padding)
padding: {}
```

### Color Patterns

Colors appear throughout widget props in two forms:

```yaml
# Theme color reference
colorValue:
  inputValue:
    themeColor: PRIMARY_TEXT

# ARGB integer value (as string)
colorValue:
  inputValue:
    value: "4287097512"
```

Theme color enum values: `PRIMARY`, `SECONDARY`, `TERTIARY`, `ALTERNATE`, `PRIMARY_TEXT`, `SECONDARY_TEXT`, `PRIMARY_BACKGROUND`, `SECONDARY_BACKGROUND`, `SUCCESS`, `WARNING`, `ERROR`, `INFO`.

### Value Patterns

All values follow the `inputValue` / `mostRecentInputValue` pattern:

```yaml
# Literal value
someValue:
  inputValue: 42

# With sync tracking (both must match when editing)
someValue:
  inputValue: 42
  mostRecentInputValue: 42

# Variable binding
someValue:
  variable:
    source: WIDGET_CLASS_PARAMETER
    baseVariable:
      widgetClass:
        paramIdentifier:
          name: paramName
          key: abc123
    nodeKeyRef:
      key: Scaffold_xxxxxxxx
  mostRecentInputValue: fallback_value
```

Variable sources: `WIDGET_CLASS_PARAMETER`, `LOCAL_STATE`, `ACTION_OUTPUTS`, `GLOBAL_PROPERTIES`, `FIRESTORE_REQUEST`, `POSTGRES_QUERY`, `CONSTANTS`, `FUNCTION_CALL`, `ENUMS`.

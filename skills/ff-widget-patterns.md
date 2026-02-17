# FlutterFlow Widget Patterns Skill

Quick reference for common FlutterFlow widget YAML patterns. Use `get_yaml_docs` for full schemas.

## Value Pattern

Most FF YAML properties follow this structure:

```yaml
propertyNameValue:
  inputValue: "the value"
  mostRecentInputValue: "the value"  # must match inputValue
```

**Exceptions** — these only accept `inputValue`:
- `fontWeightValue`
- `fontSizeValue`

## Common Widget Snippets

### Text Widget
```yaml
type: Text
properties:
  textValue:
    inputValue: "Hello World"
    mostRecentInputValue: "Hello World"
  textStyle:
    fontSizeValue:
      inputValue: 16        # no mostRecentInputValue
    fontWeightValue:
      inputValue: w600       # no mostRecentInputValue
    colorValue:
      inputValue: "ff000000"
      mostRecentInputValue: "ff000000"
```

### Container with Padding
```yaml
type: Container
properties:
  widthValue:
    inputValue: "double.infinity"
    mostRecentInputValue: "double.infinity"
  decoration:
    colorValue:
      inputValue: "ffFFFFFF"
      mostRecentInputValue: "ffFFFFFF"
    borderRadiusValue:
      inputValue: 12
      mostRecentInputValue: 12
  paddingValue:
    inputValue: "16,16,16,16"
    mostRecentInputValue: "16,16,16,16"
```

### Image (Network)
```yaml
type: Image
properties:
  imageTypeValue:
    inputValue: FF_IMAGE_TYPE_NETWORK
    mostRecentInputValue: FF_IMAGE_TYPE_NETWORK
  pathValue:
    inputValue: "https://example.com/image.jpg"
    mostRecentInputValue: "https://example.com/image.jpg"
  widthValue:
    inputValue: "double.infinity"
    mostRecentInputValue: "double.infinity"
  heightValue:
    inputValue: 200
    mostRecentInputValue: 200
  fitValue:
    inputValue: COVER
    mostRecentInputValue: COVER
```

### Image (Asset)
```yaml
type: Image
properties:
  imageTypeValue:
    inputValue: FF_IMAGE_TYPE_ASSET
    mostRecentInputValue: FF_IMAGE_TYPE_ASSET
  pathValue:
    inputValue: "assets/images/logo.svg"
    mostRecentInputValue: "assets/images/logo.svg"
```

### Button
```yaml
type: Button
properties:
  textValue:
    inputValue: "Click Me"
    mostRecentInputValue: "Click Me"
  buttonType: FILLED
  optionsValue:
    elevationValue:
      inputValue: 2
      mostRecentInputValue: 2
    heightValue:
      inputValue: 48
      mostRecentInputValue: 48
    borderRadiusValue:
      inputValue: 8
      mostRecentInputValue: 8
```

### Column (Shrink-to-Content)
```yaml
type: Column
properties:
  minSizeValue:
    inputValue: true       # equivalent to MainAxisSize.min
  crossAxisAlignmentValue:
    inputValue: CENTER
    mostRecentInputValue: CENTER
```

### AppBar
```yaml
type: AppBar
properties:
  templateType: LARGE_HEADER  # only valid value
  toolbarHeight: 60            # control actual height
  titleValue:
    inputValue: "Page Title"
    mostRecentInputValue: "Page Title"
```

## Elevation vs Shadow

Prefer `elevationValue` for Material-style card shadows:
```yaml
elevationValue:
  inputValue: 4
  mostRecentInputValue: 4
```

For custom shadows use `boxShadow` on the container decoration.

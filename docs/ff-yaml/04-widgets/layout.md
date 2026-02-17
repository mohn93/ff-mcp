# Layout Widgets: Column, Row, Stack, Wrap

## Column

### Minimal Example

```yaml
key: Column_xxxxxxxx
type: Column
props:
  column:
    listSpacing: {}
  padding: {}
```

### Full Schema

```yaml
key: Column_xxxxxxxx
type: Column
props:
  column:
    mainAxisAlignment: main_axis_space_between  # Main axis distribution (see enum)
    crossAxisAlignment: cross_axis_center       # Cross axis alignment (see enum)
    scrollable: true                            # Enable vertical scrolling
    primary: true                               # Whether this is primary scroll view
    listSpacing:                                # Spacing between children
      applyStartEndSpace: true                  # Add spacing before first / after last child
      spacingValue:
        inputValue: 32                          # Gap in px between children
      startSpacingValue:                        # Explicit start spacing (alternative to applyStartEndSpace)
        inputValue: 20
      endSpacingValue:                          # Explicit end spacing
        inputValue: 60
    minSizeValue:                               # Whether column shrinks to min size
      inputValue: false                         # false = take full available height
      mostRecentInputValue: false
  padding:                                      # Inner padding
    leftValue:
      inputValue: 32
    topValue:
      inputValue: 32
    rightValue:
      inputValue: 32
    bottomValue:
      inputValue: 32
  responsiveVisibility: {}
  opacity:
    opacityValue:
      inputValue: 1
      mostRecentInputValue: 1
    animatedOpacity: {}
parameterValues: {}
valueKey: {}
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `mainAxisAlignment` | enum | No | Vertical distribution of children |
| `crossAxisAlignment` | enum | No | Horizontal alignment of children |
| `scrollable` | bool | No | Enable vertical scrolling |
| `primary` | bool | No | Primary scroll controller |
| `listSpacing.spacingValue.inputValue` | number | No | Gap between children in px |
| `listSpacing.applyStartEndSpace` | bool | No | Space before first/after last child |
| `listSpacing.startSpacingValue.inputValue` | number | No | Explicit start spacing in px |
| `listSpacing.endSpacingValue.inputValue` | number | No | Explicit end spacing in px |
| `minSizeValue.inputValue` | bool | No | `false` = fill height, `true` = shrink-wrap |

> **Warning:** There is no `mainAxisSize` field on Column. Use `minSizeValue: { inputValue: true }` for shrink-to-content behavior (equivalent to Flutter's `MainAxisSize.min`). Adding `mainAxisSize` will cause a validation error.

### mainAxisAlignment Values (Column = vertical, Row = horizontal)

| Value | Description |
|-------|-------------|
| `main_axis_start` | Pack children at start |
| `main_axis_end` | Pack children at end |
| `main_axis_center` | Center children |
| `main_axis_space_between` | Even spacing, no edge space |
| `main_axis_space_around` | Even spacing, half edge space |
| `main_axis_space_evenly` | Even spacing including edges |

### crossAxisAlignment Values (Column = horizontal, Row = vertical)

| Value | Description |
|-------|-------------|
| `cross_axis_start` | Align to start (left for Column, top for Row) |
| `cross_axis_end` | Align to end |
| `cross_axis_center` | Center on cross axis |
| `cross_axis_stretch` | Stretch to fill cross axis |

---

## Row

### Minimal Example

```yaml
key: Row_xxxxxxxx
type: Row
props:
  row:
    listSpacing: {}
  padding: {}
```

### Full Schema

```yaml
key: Row_xxxxxxxx
type: Row
props:
  row:
    mainAxisAlignment: main_axis_center         # Horizontal distribution
    crossAxisAlignment: cross_axis_center       # Vertical alignment
    listSpacing:                                # Spacing between children
      spacingValue:
        inputValue: 8
  padding: {}
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
| `mainAxisAlignment` | enum | No | Horizontal distribution |
| `crossAxisAlignment` | enum | No | Vertical alignment |
| `listSpacing.spacingValue.inputValue` | number | No | Gap between children in px |

---

## Stack

### Minimal Example

```yaml
key: Stack_xxxxxxxx
type: Stack
props:
  stack:
    dimensions: {}
```

### Full Schema

```yaml
key: Stack_xxxxxxxx
type: Stack
props:
  stack:
    dimensions: {}                              # Stack size constraints
    childAlignment:                             # Default alignment for children
      xValue:
        inputValue: 0                           # -1 (left) to 1 (right)
      yValue:
        inputValue: 1                           # -1 (top) to 1 (bottom)
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
| `dimensions` | object | No | Width/height constraints (same as Container) |
| `childAlignment.xValue.inputValue` | number | No | Default horizontal alignment (-1 to 1) |
| `childAlignment.yValue.inputValue` | number | No | Default vertical alignment (-1 to 1) |

---

## Wrap

### Minimal Example

```yaml
key: Wrap_xxxxxxxx
type: Wrap
props:
  wrap:
    direction: FF_AXIS_HORIZONTAL
    spacingValue:
      inputValue: 16
```

### Full Schema

```yaml
key: Wrap_xxxxxxxx
type: Wrap
props:
  padding:
    type: FF_PADDING_ONLY
  alignment:                                    # Overall alignment of wrap widget
    xValue:
      inputValue: 0
      mostRecentInputValue: 0
  wrap:
    childAlignment: wrap_center                 # Alignment of children within a run
    crossAxisAlignment: wrap_cross_center       # Cross axis alignment within runs
    direction: FF_AXIS_HORIZONTAL               # FF_AXIS_HORIZONTAL or FF_AXIS_VERTICAL
    runAlignment: wrap_center                   # Alignment of runs within the wrap
    verticalDirection: FF_VERTICAL_DIRECTION_DOWN # FF_VERTICAL_DIRECTION_DOWN or FF_VERTICAL_DIRECTION_UP
    clipBehavior: FF_CLIP_NONE                  # FF_CLIP_NONE or FF_CLIP_HARD_EDGE
    spacingValue:                               # Spacing between children in main axis
      inputValue: 16
      mostRecentInputValue: 16
    runSpacingValue:                            # Spacing between runs
      inputValue: 16
  responsiveVisibility: {}
  opacity:
    opacityValue:
      inputValue: 1
    animatedOpacity: {}
valueKey: {}
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `direction` | enum | No | `FF_AXIS_HORIZONTAL` or `FF_AXIS_VERTICAL` |
| `childAlignment` | enum | No | `wrap_start`, `wrap_center`, `wrap_end`, `wrap_space_between`, `wrap_space_around`, `wrap_space_evenly` |
| `crossAxisAlignment` | enum | No | `wrap_cross_start`, `wrap_cross_center`, `wrap_cross_end` |
| `runAlignment` | enum | No | Same values as `childAlignment` |
| `verticalDirection` | enum | No | `FF_VERTICAL_DIRECTION_DOWN` or `FF_VERTICAL_DIRECTION_UP` |
| `clipBehavior` | enum | No | `FF_CLIP_NONE` or `FF_CLIP_HARD_EDGE` |
| `spacingValue.inputValue` | number | No | Main axis gap between children |
| `runSpacingValue.inputValue` | number | No | Gap between rows/columns |

---

## Real Examples

**Scrollable column with even spacing:**
```yaml
key: Column_gy6ake8z
type: Column
props:
  column:
    crossAxisAlignment: cross_axis_center
    scrollable: true
    listSpacing:
      applyStartEndSpace: true
      spacingValue:
        inputValue: 32
    minSizeValue:
      inputValue: false
  padding:
    leftValue:
      inputValue: 32
    topValue:
      inputValue: 32
    rightValue:
      inputValue: 32
    bottomValue:
      inputValue: 32
```

**Column with space-between and left alignment:**
```yaml
key: Column_r1vldyls
type: Column
props:
  column:
    mainAxisAlignment: main_axis_space_between
    crossAxisAlignment: cross_axis_start
    scrollable: false
    primary: true
    listSpacing: {}
    minSizeValue:
      inputValue: true
      mostRecentInputValue: true
  padding:
    type: FF_PADDING_ONLY
    topValue:
      inputValue: 52
      mostRecentInputValue: 52
  responsiveVisibility: {}
  opacity:
    opacityValue:
      inputValue: 1
      mostRecentInputValue: 1
parameterValues: {}
valueKey: {}
```

**Centered row with 8px spacing:**
```yaml
key: Row_2gm2u02q
type: Row
props:
  row:
    mainAxisAlignment: main_axis_center
    listSpacing:
      spacingValue:
        inputValue: 8
  padding: {}
```

**Stack with bottom-center child alignment:**
```yaml
key: Stack_vmro661q
type: Stack
props:
  stack:
    childAlignment:
      xValue:
        inputValue: 0
      yValue:
        inputValue: 1
```

**Horizontal wrap with center alignment:**
```yaml
key: Wrap_2wvkst2l
type: Wrap
props:
  padding:
    type: FF_PADDING_ONLY
  alignment:
    xValue:
      inputValue: 0
      mostRecentInputValue: 0
  wrap:
    childAlignment: wrap_center
    crossAxisAlignment: wrap_cross_center
    direction: FF_AXIS_HORIZONTAL
    runAlignment: wrap_center
    verticalDirection: FF_VERTICAL_DIRECTION_DOWN
    clipBehavior: FF_CLIP_NONE
    spacingValue:
      inputValue: 16
      mostRecentInputValue: 16
    runSpacingValue:
      inputValue: 16
  responsiveVisibility: {}
  opacity:
    opacityValue:
      inputValue: 1
    animatedOpacity: {}
valueKey: {}
```

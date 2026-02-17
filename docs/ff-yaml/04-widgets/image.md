# Image

## Minimal Example

```yaml
key: Image_xxxxxxxx
type: Image
props:
  image:
    type: FF_IMAGE_TYPE_ASSET
    fit: FF_BOX_FIT_COVER
    pathValue:
      inputValue: projects/my-project/assets/xxxxx/image.png
```

## Full Schema

```yaml
key: Image_xxxxxxxx
type: Image
props:
  image:
    type: FF_IMAGE_TYPE_ASSET            # Image source type (see enum)
    fit: FF_BOX_FIT_COVER                # How image fits its box (see enum)
    dimensions:                          # Image display size
      width:
        pixelsValue:
          inputValue: 150
      height:
        pixelsValue:
          inputValue: 70
    borderRadius:                        # Corner radius
      type: FF_BORDER_RADIUS_ALL         # FF_BORDER_RADIUS_ALL or FF_BORDER_RADIUS_ONLY
      allValue:
        inputValue: 8
      topLeftValue:                      # Per-corner values (with ONLY type)
        inputValue: 8
        mostRecentInputValue: 8
      topRightValue:
        inputValue: 8
        mostRecentInputValue: 8
      bottomLeftValue:
        inputValue: 8
        mostRecentInputValue: 8
      bottomRightValue:
        inputValue: 8
        mostRecentInputValue: 8
    cached: true                         # Cache network images
    cacheFadeDuration: 500               # Fade-in duration for cached images (ms)
    showErrorImage: true                 # Show placeholder on error
    pathValue:                           # Image path/URL
      inputValue: projects/zellium-fptpvo/assets/4irp4lk9qgkw/logo.png
      # OR for network images, a variable binding:
      # variable:
      #   source: FIRESTORE_REQUEST
      #   baseVariable:
      #     firestore: {}
      #   operations:
      #     - accessDocumentField:
      #         fieldIdentifier:
      #           name: LogoURL
      #   nodeKeyRef:
      #     key: ListView_c6q77t1v
      #   uiBuilderValue:
      #     serializedValue: https://picsum.photos/seed/733/600
      # mostRecentInputValue: https://picsum.photos/seed/733/600
    darkModePath: projects/zellium-fptpvo/assets/n4nm8ioujlxm/logo_dark.png  # Dark mode asset
    hasDarkModeAsset: true               # Whether dark mode asset exists
    format: FF_IMAGE_FORMAT_AUTO         # Image format hint
    localFileVariable: {}                # For local file picker images
  padding:                              # Common padding prop
    type: FF_PADDING_ONLY
    topValue:
      inputValue: 16
      mostRecentInputValue: 16
    bottomValue:
      inputValue: 32
      mostRecentInputValue: 32
  alignment:                            # Position within parent
    xValue:
      inputValue: 0
    yValue:
      inputValue: 0
  responsiveVisibility:                 # Breakpoint visibility
    phoneHidden: true                   # Hidden on phone
    tabletHidden: true                  # Hidden on tablet
    tabletLandscapeHidden: true
    desktopHidden: true
  opacity:
    opacityValue:
      inputValue: 1
      mostRecentInputValue: 1
name: mobile_image                      # Human-readable name
parameterValues: {}
valueKey: {}
```

## Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | enum | Yes | Image source type |
| `fit` | enum | No | How image fits its container |
| `dimensions.width.pixelsValue.inputValue` | number | No | Display width in px |
| `dimensions.height.pixelsValue.inputValue` | number | No | Display height in px |
| `borderRadius` | object | No | Corner rounding |
| `cached` | bool | No | Cache network images |
| `cacheFadeDuration` | number | No | Fade animation duration in ms |
| `showErrorImage` | bool | No | Show error placeholder |
| `pathValue.inputValue` | string | Yes | Asset path or URL (literal or variable) |
| `darkModePath` | string | No | Alternate asset for dark mode |
| `hasDarkModeAsset` | bool | No | Whether dark mode variant exists |
| `format` | enum | No | Image format hint |
| `localFileVariable` | object | No | For file picker results |

## type Enum

| Value | Description |
|-------|-------------|
| `FF_IMAGE_TYPE_ASSET` | FlutterFlow project asset (stored in project assets) |
| `FF_IMAGE_TYPE_NETWORK` | Network URL image |

## fit Enum

| Value | Description |
|-------|-------------|
| `FF_BOX_FIT_COVER` | Cover the box, may crop |
| `FF_BOX_FIT_CONTAIN` | Fit inside the box, may letterbox |
| `FF_BOX_FIT_FILL` | Stretch to fill (may distort) |
| `FF_BOX_FIT_FIT_WIDTH` | Fit width, may crop height |
| `FF_BOX_FIT_FIT_HEIGHT` | Fit height, may crop width |
| `FF_BOX_FIT_NONE` | No scaling |
| `FF_BOX_FIT_SCALE_DOWN` | Scale down only, never up |

## format Enum

| Value | Description |
|-------|-------------|
| `FF_IMAGE_FORMAT_AUTO` | Auto-detect format |

## Asset Path Pattern

FlutterFlow asset paths follow this format:
```
projects/{project-slug}/assets/{asset-id}/{filename}
```

Example: `projects/zellium-fptpvo/assets/4irp4lk9qgkw/Zellium_-_full_logo_-_white-1.png`

SVG files are also supported: `projects/local-perks-na36z5/assets/rho4dig9lgan/PerksPass_red_logo.svg`

## Real Examples

**Asset image with dark mode variant:**
```yaml
key: Image_wu74cv76
type: Image
props:
  image:
    type: FF_IMAGE_TYPE_ASSET
    fit: FF_BOX_FIT_COVER
    dimensions:
      width:
        pixelsValue:
          inputValue: 150
      height:
        pixelsValue:
          inputValue: 70
    borderRadius:
      type: FF_BORDER_RADIUS_ONLY
      allValue:
        inputValue: 8
    darkModePath: projects/zellium-fptpvo/assets/n4nm8ioujlxm/Zellium_-_full_logo_-_white.png
    hasDarkModeAsset: true
    cacheFadeDuration: 500
    pathValue:
      inputValue: projects/zellium-fptpvo/assets/4irp4lk9qgkw/Zellium_-_full_logo_-_white-1.png
    format: FF_IMAGE_FORMAT_AUTO
name: ImageLogo
```

**Network image from Firestore with caching:**
```yaml
key: Image_21e85ciy
type: Image
props:
  image:
    type: FF_IMAGE_TYPE_NETWORK
    fit: FF_BOX_FIT_COVER
    dimensions:
      width:
        pixelsValue:
          inputValue: 88
          mostRecentInputValue: 88
      height:
        pixelsValue:
          inputValue: 88
          mostRecentInputValue: 88
    borderRadius:
      type: FF_BORDER_RADIUS_ALL
      topLeftValue:
        inputValue: 100
        mostRecentInputValue: 100
      topRightValue:
        inputValue: 100
        mostRecentInputValue: 100
      bottomLeftValue:
        inputValue: 100
        mostRecentInputValue: 100
      bottomRightValue:
        inputValue: 100
        mostRecentInputValue: 100
      allValue:
        inputValue: 100
        mostRecentInputValue: 100
    cached: true
    cacheFadeDuration: 200
    showErrorImage: true
    pathValue:
      variable:
        source: FIRESTORE_REQUEST
        baseVariable:
          firestore: {}
        operations:
          - accessDocumentField:
              fieldIdentifier:
                name: LogoURL
        nodeKeyRef:
          key: ListView_c6q77t1v
        uiBuilderValue:
          serializedValue: https://picsum.photos/seed/733/600
      mostRecentInputValue: https://picsum.photos/seed/733/600
  responsiveVisibility: {}
  opacity:
    opacityValue:
      inputValue: 1
      mostRecentInputValue: 1
parameterValues: {}
valueKey: {}
```

**SVG asset image with responsive visibility:**
```yaml
key: Image_6apkcc2e
type: Image
props:
  image:
    type: FF_IMAGE_TYPE_ASSET
    fit: FF_BOX_FIT_CONTAIN
    dimensions:
      width:
        pixelsValue:
          inputValue: 120
    borderRadius:
      type: FF_BORDER_RADIUS_ALL
      allValue:
        inputValue: 8
        mostRecentInputValue: 8
    cacheFadeDuration: 500
    pathValue:
      inputValue: projects/dTYvUdos4VEnxHJVe6Wq/assets/rqcvje5bneln/PerkpassLogo.png
      mostRecentInputValue: projects/local-perks-na36z5/assets/qsomrf8ciatl/perkspass_light_red.svg
  padding:
    type: FF_PADDING_ONLY
  responsiveVisibility:
    tabletHidden: true
    tabletLandscapeHidden: true
    desktopHidden: true
  opacity:
    opacityValue:
      inputValue: 1
      mostRecentInputValue: 1
name: mobile_image
parameterValues: {}
valueKey: {}
```

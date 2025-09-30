# Texture Build Pipeline Documentation

## Overview

This automated build pipeline converts equirectangular environment textures into GPU-optimized formats for maximum performance and quality.

## Pipeline Flow

```
Equirectangular JPG/HDR
         ↓
    Resize/Process
         ↓
   Generate Mipmaps
         ↓
  Compress to KTX2
         ↓
  GPU-Ready Textures
```

## Quality Presets

The pipeline generates 4 quality levels for each texture:

### 1. **High Quality** (Desktop/High-end)
- Cubemap size: 2048×2048 per face
- Compression: UASTC (high quality)
- Mipmaps: Full chain
- Use case: Desktop, high-end mobile

### 2. **Medium Quality** (Standard)
- Cubemap size: 1024×1024 per face
- Compression: ETC1S
- Mipmaps: Full chain
- Use case: Standard mobile, mid-range desktop

### 3. **Low Quality** (Low-end devices)
- Cubemap size: 512×512 per face
- Compression: ETC1S
- Mipmaps: Full chain
- Use case: Low-end mobile

### 4. **Preview** (Initial load)
- Cubemap size: 256×256 per face
- Compression: ETC1S
- Mipmaps: None
- Use case: Progressive loading initial frame

## Installation

### 1. Install Node.js Dependencies

```bash
npm install
```

This installs `sharp` for image processing.

### 2. Install KTX-Software Tools

#### macOS (via Homebrew)
```bash
brew install toktx
```

#### Linux (from source)
```bash
git clone https://github.com/KhronosGroup/KTX-Software.git
cd KTX-Software
mkdir build && cd build
cmake ..
make
sudo make install
```

#### Windows
Download pre-built binaries from [KTX-Software Releases](https://github.com/KhronosGroup/KTX-Software/releases)

### 3. Verify Installation

```bash
toktx --version
node -e "require('sharp')"
```

## Usage

### Basic Usage

Process all textures in `textures/equirectangular/`:

```bash
npm run build:textures
```

Or directly:

```bash
node build-textures.js
```

### Output Structure

```
textures/
  ├── equirectangular/          # Source files
  │   ├── sunset-mountain.jpg
  │   └── ...
  └── processed/                # Generated files
      ├── cubemaps/             # Intermediate cubemaps
      ├── ktx2/                 # Compressed textures
      │   ├── high/
      │   │   └── sunset-mountain.ktx2
      │   ├── medium/
      │   │   └── sunset-mountain.ktx2
      │   ├── low/
      │   │   └── sunset-mountain.ktx2
      │   └── preview/
      │       └── sunset-mountain.ktx2
      ├── previews/             # Preview images
      └── manifest.json         # Texture metadata
```

### Manifest File

The build generates a `manifest.json` with texture metadata:

```json
{
  "version": "1.0.0",
  "generated": "2025-09-30T...",
  "textures": {
    "sunset-mountain": {
      "original": "sunset-mountain.jpg",
      "formats": {
        "high": {
          "path": "textures/processed/ktx2/high/sunset-mountain.ktx2",
          "size": 12582912,
          "sizeMB": "12.00"
        },
        "medium": { ... },
        "low": { ... },
        "preview": { ... }
      }
    }
  }
}
```

## Performance Benefits

### Before (Current)
- ❌ Equirectangular JPG (uncompressed)
- ❌ Client-side PMREM generation (expensive!)
- ❌ No GPU compression
- ❌ Single quality level
- Average load time: ~2-3s per texture

### After (Optimized)
- ✅ Prefiltered cubemaps (no client processing)
- ✅ GPU-native compression (KTX2/Basis)
- ✅ Multiple quality levels
- ✅ Smaller file sizes (60-80% reduction)
- Expected load time: ~300-500ms per texture

## Size Comparison

Typical 4K equirectangular texture:

| Format | Size | Compression Ratio |
|--------|------|-------------------|
| Original JPG | 8-12 MB | Baseline |
| High (UASTC) | 10-14 MB | ~Same (higher quality) |
| Medium (ETC1S) | 2-4 MB | ~75% reduction |
| Low (ETC1S) | 0.5-1 MB | ~90% reduction |
| Preview (ETC1S) | 50-150 KB | ~99% reduction |

## Advanced Usage

### Custom Configuration

Edit `build-textures.js` to customize quality presets:

```javascript
const CONFIG = {
    quality: {
        high: {
            cubemapSize: 2048,
            ktx2Quality: 255,
            compression: 'uastc'
        }
        // ... customize other presets
    }
};
```

### Process Specific Texture

Currently processes all textures. To process specific files, modify the script or filter in `getTextureFiles()`.

### Offline Tools (Optional)

For even better results, use professional tools:

1. **cmft** (Cubemap Filtering Tool)
   - Better prefiltering quality
   - Install: https://github.com/dariomanesku/cmft

2. **IBLBaker**
   - Professional IBL processing
   - Install: https://github.com/derkreature/IBLBaker

## Troubleshooting

### Error: "toktx: command not found"

Install KTX-Software tools (see Installation section).

### Error: "Cannot find module 'sharp'"

```bash
npm install sharp
```

### Out of Memory

For very large textures, increase Node.js memory:

```bash
node --max-old-space-size=4096 build-textures.js
```

### Slow Processing

Processing large textures takes time. Expect:
- Small (1K): ~5-10s per texture
- Medium (4K): ~20-30s per texture
- Large (8K): ~60-90s per texture

## Integration with Client

After building, update your client code to use KTX2Loader (see next optimization step).

## CDN Deployment

Upload `textures/processed/` to your CDN:

```bash
# Example with AWS S3
aws s3 sync textures/processed/ s3://your-bucket/textures/processed/ \
  --cache-control max-age=31536000
```

## Next Steps

1. ✅ Build pipeline complete
2. ⏭️ Next: Implement KTX2Loader on client
3. ⏭️ Next: Progressive loading system
4. ⏭️ Next: LOD selection based on device

---

**Note**: This is Step 1 of the texture optimization pipeline. The client-side integration will follow in subsequent steps.


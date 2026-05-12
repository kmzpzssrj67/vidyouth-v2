# Vidyouth — assets

Drop the brand assets here.

## Logo

Save the institutional logo as **`logo.png`** at this path:

```
mobile development/assets/logo.png
```

Recommended specs:

- 512 × 512 px square
- transparent background
- centred glyph with ~10% padding
- PNG-24 with alpha

Once present, enable it in two places:

### 1. `src/screens/SplashScreen.tsx`

Uncomment the import and pass it to `<SplashLogo>`:

```tsx
import logo from '../../assets/logo.png';

<SplashLogo source={logo} size={132} />
```

### 2. (optional) `app.json` — native splash

Replace the `splash.image` field with `"./assets/logo.png"` so the native
launch screen also shows the brand mark before the JS bundle finishes loading.

## Other assets

- `icon.png` — 1024 × 1024 app icon (Apple / Play Store)
- `adaptive-icon.png` — 1024 × 1024 Android adaptive foreground (transparent margins)
- `favicon.png` — 48 × 48 PNG for the web build

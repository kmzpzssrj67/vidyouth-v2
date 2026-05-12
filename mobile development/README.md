# Vidyouth Mobile — AI Learning Lab

React Native / Expo mobile app for the Vidyouth AI Learning Lab. The visual
identity matches the web dashboard (premium glassmorphism, warm-amber default
palette, Apple-like spacing, Swiss-style typography).

## Quick start

```bash
cd "mobile development"
npm install
npx expo start
```

Scan the QR with Expo Go on iOS/Android, or press `i` / `a` in the terminal.

## Project structure

```
mobile development/
├── App.tsx                     # entry point
├── app.json                    # Expo config
├── package.json
├── tsconfig.json
└── src/
    ├── theme/
    │   └── theme.ts            # palettes, radius, spacing, shadow tokens
    ├── components/ui/
    │   ├── AmbientBackground.tsx
    │   ├── BrandMark.tsx
    │   ├── GlassCard.tsx
    │   ├── GlassInput.tsx
    │   ├── PrimaryButton.tsx
    │   ├── RoleSegment.tsx
    │   └── SocialButton.tsx
    └── screens/auth/
        └── LoginScreen.tsx
```

## Theme system

`src/theme/theme.ts` exposes seven pre-defined palettes:

- `warm-amber` (default — matches web dashboard)
- `cyber-navy`
- `warm-beige`
- `calm-green`
- `purple`
- `apple-light`
- `apple-dark`

Switch palette via `getTheme('cyber-navy')` and pass the result down via the
`theme` prop on every UI component. Components fall back to the module
default when no theme is provided, so a global theme provider is optional.

Tokens exposed:

- `colors.{bgPrimary,bgSecondary,glassBg,glassBgStrong,glassBorder,glassBorderStrong,accentPrimary,accentSecondary,success,warning,danger,textPrimary,textSecondary,textMuted,auraA,auraB,auraC}`
- `radius.{sm,md,lg,xl,xxl,pill}`
- `spacing.{xs,sm,md,lg,xl,xxl,xxxl}`
- `fontSize.{xs,sm,md,lg,xl,xxl,display}`
- `shadow.{soft,card,glow}` (cross-platform — iOS shadow* / Android elevation)

## Login screen

`src/screens/auth/LoginScreen.tsx` is keyboard-safe, scrolls on small
devices, and centres on tablets via `maxWidth: 480` on the card.

All handlers (sign-in, Google, OTP, forgot, create-account) currently log to
console and are flagged with `// TODO` comments where backend wiring belongs.

## Future screens

The component set is intentionally generic — `GlassCard`, `GlassInput`,
`PrimaryButton`, `SocialButton`, `RoleSegment`, `BrandMark`, and
`AmbientBackground` will be reused for sign-up, OTP, dashboards, settings,
etc.

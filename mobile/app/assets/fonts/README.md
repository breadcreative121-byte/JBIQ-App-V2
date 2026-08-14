# JioType fonts

The app follows the Figma, which uses **JioType Var**. React Native cannot load
the `.woff2` that ships in the web repo, so bundle **static weight** `.ttf`/`.otf`
files here:

```
JioType-Regular.ttf    (400)
JioType-Medium.ttf     (500)
JioType-Bold.ttf       (700)
JioType-ExtraBold.ttf  (800)
JioType-Black.ttf      (900)
```

## Enabling
1. Add the files above to this folder.
2. In `App.tsx`, uncomment the `useFonts({...})` block.
3. In `src/theme/fonts.ts`, set `FONT_ENABLED = true`.

Until then the app renders with the iOS system font (layout matches Figma; only
the typeface differs). The font glob is already declared in `app.json`
(`assetBundlePatterns`), so no further config is needed.

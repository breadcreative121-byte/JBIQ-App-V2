/* JioType wiring.

   The Figma uses "JioType Var". React Native cannot load the repo's `.woff2`;
   we bundle STATIC weights instead (variable fonts are unreliable across RN
   targets). To enable:

   1. Drop these files into `mobile/app/assets/fonts/` (see assets/fonts/README.md):
        JioType-Regular.ttf  (400)
        JioType-Medium.ttf   (500)
        JioType-Bold.ttf     (700)
        JioType-ExtraBold.ttf(800)
        JioType-Black.ttf    (900)
   2. In `App.tsx`, uncomment the `useFonts({...})` block.
   3. Set `FONT_ENABLED = true` below.

   Until then `familyFor()` returns undefined and RN falls back to the system
   font (layout is unaffected — only the typeface differs). We intentionally do
   NOT `require()` the .ttf files here: Metro resolves requires statically, so
   referencing missing assets would break the build before the files exist. */

export const FONT_ENABLED = false;

export const JioType = {
  '400': 'JioType-Regular',
  '500': 'JioType-Medium',
  '700': 'JioType-Bold',
  '800': 'JioType-ExtraBold',
  '900': 'JioType-Black',
} as const;

type FontWeightKey = keyof typeof JioType;

/** Nearest bundled JioType family for a token fontWeight, or undefined (system). */
export function familyFor(weight?: string): string | undefined {
  if (!FONT_ENABLED) return undefined;
  const w = (weight ?? '400') as string;
  if (w in JioType) return JioType[w as FontWeightKey];
  // Map in-between weights to the nearest bundled cut.
  const n = parseInt(w, 10);
  if (Number.isNaN(n)) return JioType['400'];
  if (n >= 850) return JioType['900'];
  if (n >= 750) return JioType['800'];
  if (n >= 600) return JioType['700'];
  if (n >= 450) return JioType['500'];
  return JioType['400'];
}

/** Spreadable style fragment that applies the JioType family for a given weight. */
export function font(weight?: string) {
  const family = familyFor(weight);
  return family ? { fontFamily: family } : {};
}

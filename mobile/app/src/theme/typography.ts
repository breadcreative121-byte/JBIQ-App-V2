import type { TextStyle } from 'react-native';
import { typography } from './tokens';

// The JDS typography tokens carry `fontWeight` as string literals ("900", "800",
// …) and may include lineHeight / letterSpacing / textTransform. Those are all
// valid RN TextStyle props; this just re-shapes each entry into a mutable
// TextStyle so styles can spread `text.bodyM` etc. without `as const` friction.
type TypographyKey = keyof typeof typography;

export const text = Object.fromEntries(
  Object.entries(typography).map(([key, value]) => [key, { ...value } as TextStyle]),
) as Record<TypographyKey, TextStyle>;

export type { TypographyKey };

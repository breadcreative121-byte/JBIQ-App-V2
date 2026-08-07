/* Reference React Native component — copy into your Expo app.
   Shows the intended pattern: JDS tokens consumed from the generated
   tokens/tokens.ts, never hardcoded values. This file lives here as a
   template; it expects `react-native` and the tokens module to resolve
   inside an Expo project. */

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { color, space, radius, opacity, typography } from '../../tokens/tokens';

type Variant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  ...rest
}: ButtonProps) {
  const v = VARIANTS[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && !isDisabled && { backgroundColor: v.bgPressed },
        isDisabled && { opacity: opacity.disabled },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <Text style={[styles.label, { color: v.fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const VARIANTS: Record<Variant, { bg: string; bgPressed: string; fg: string; border: string }> = {
  primary: {
    bg: color.primary50,
    bgPressed: color.primary60,
    fg: color.textOnBold,
    border: 'transparent',
  },
  secondary: {
    bg: color.primary30,
    bgPressed: color.primary40,
    fg: color.primary50,
    border: 'transparent',
  },
  ghost: {
    bg: 'transparent',
    bgPressed: color.surfaceMinimal,
    fg: color.primary50,
    border: color.strokeSubtle,
  },
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: space.l,
    paddingVertical: space.s,
    borderRadius: radius.shapePill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.button,
  },
});

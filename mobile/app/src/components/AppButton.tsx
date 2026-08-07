/* Figma button. `solid` = filled indigo pill (e.g. "Tap to hear", "Start check
   in"); `ghost` = indigo text only (e.g. "Begin reveal"). Distinct from the JDS
   `Button` (which is #6d17ce / 48-tall) because these screens follow the Figma
   indigo palette. */
import { Pressable, Text, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fig } from '@/theme/figma';
import { font } from '@/theme/fonts';

type IoniconName = keyof typeof Ionicons.glyphMap;

export function AppButton({
  label,
  variant = 'solid',
  icon,
  onPress,
  style,
}: {
  label: string;
  variant?: 'solid' | 'ghost';
  icon?: IoniconName;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const ghost = variant === 'ghost';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        ghost ? styles.ghost : styles.solid,
        pressed && (ghost ? styles.ghostPressed : styles.solidPressed),
        style,
      ]}
    >
      <View style={styles.row}>
        {icon ? (
          <Ionicons name={icon} size={14} color={ghost ? fig.brand : fig.textOnBrand} />
        ) : null}
        <Text style={[styles.label, { color: ghost ? fig.brand : fig.textOnBrand }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  solid: { backgroundColor: fig.brand, paddingHorizontal: 18, paddingVertical: 9 },
  solidPressed: { backgroundColor: fig.brandPressed },
  ghost: { backgroundColor: 'transparent', paddingHorizontal: 4, paddingVertical: 6 },
  ghostPressed: { opacity: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  label: { fontSize: 14, fontWeight: '700', ...font('700') },
});

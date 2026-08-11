/* First-run interests picker. A full-screen opaque overlay (reads as "before the
   homepage") where the user taps the topics they care about; their picks drive
   which suggestion prompts Home shows. Forked from the SpacesIntroSheet scaffold
   but rendered full-screen with a gentle fade-in (native-driver guarded for web).
   All colours from the `fig` palette, JioType via font(). */
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fig } from '@/theme/figma';
import { font } from '@/theme/fonts';
import { AppButton } from './AppButton';
import { INTERESTS, type InterestId } from '@/lib/interests';

// RNW doesn't reliably apply native-driven animations, so drive on JS there.
const NATIVE_DRIVER = Platform.OS !== 'web';

export function InterestsIntro({ onDone }: { onDone: (ids: InterestId[]) => void }) {
  const insets = useSafeAreaInsets();
  const [sel, setSel] = useState<InterestId[]>([]);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 260,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [fade]);

  const toggle = (id: InterestId) =>
    setSel((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const canContinue = sel.length > 0;

  return (
    <Animated.View style={[styles.root, { opacity: fade, paddingTop: insets.top + 24 }]}>
      <View style={styles.head}>
        <Text style={styles.title}>What are you into?</Text>
        <Text style={styles.subtitle}>
          Pick a few topics and I’ll line up your home around them. You can change these anytime.
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.chips}
        showsVerticalScrollIndicator={false}
      >
        {INTERESTS.map((it) => (
          <SelectChip
            key={it.id}
            label={it.label}
            icon={it.icon}
            on={sel.includes(it.id)}
            onPress={() => toggle(it.id)}
          />
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <AppButton
          label="Continue"
          variant="solid"
          onPress={canContinue ? () => onDone(sel) : undefined}
          style={[styles.cta, !canContinue && styles.ctaDisabled]}
        />
        <Pressable
          onPress={() => onDone([])}
          accessibilityRole="button"
          hitSlop={8}
          style={styles.skip}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function SelectChip({
  label,
  icon,
  on,
  onPress,
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={[styles.chip, on && styles.chipOn]}
    >
      <MaterialCommunityIcons name={icon} size={16} color={on ? fig.textOnBrand : fig.accent} />
      <Text style={[styles.chipLabel, on && styles.chipLabelOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    backgroundColor: fig.surface,
    paddingHorizontal: 20,
  },
  head: { paddingTop: 12, paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: fig.textHigh, ...font('800'), marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, color: fig.textLow, ...font('400') },
  scroll: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 24 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: fig.strokeCard,
    backgroundColor: fig.surface,
  },
  chipOn: { backgroundColor: fig.brand, borderColor: fig.brand },
  chipLabel: { fontSize: 14, fontWeight: '700', color: fig.textHigh, ...font('700') },
  chipLabelOn: { color: fig.textOnBrand },
  footer: { paddingTop: 12, gap: 6 },
  cta: { alignSelf: 'stretch' },
  ctaDisabled: { opacity: 0.45 },
  skip: { alignSelf: 'center', paddingVertical: 10 },
  skipText: { fontSize: 15, fontWeight: '600', color: fig.textLow, ...font('600') },
});

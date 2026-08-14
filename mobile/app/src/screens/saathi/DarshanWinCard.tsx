/* The scripted first-win result. Shown in place of a plain assistant bubble for
   the transcript item flagged `card:'darshan'` during first-run onboarding — a
   live Kashi Vishwanath darshan, the concrete outcome of the user's first spoken
   request. Chips are non-functional stubs for now. */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fig } from '@/theme/figma';
import { font } from '@/theme/fonts';

export function DarshanWinCard({ onJoin, onRemind }: { onJoin?: () => void; onRemind?: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="hands-pray" size={18} color={fig.accent} />
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.dot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <Text style={styles.eyebrow}>Kashi Vishwanath</Text>
      <Text style={styles.body}>Morning aarti is live now — 12,480 devotees watching.</Text>
      <Text style={styles.meta}>Aarti till 7:30 am · Devotion</Text>

      <View style={styles.chips}>
        <Pressable style={[styles.chip, styles.chipPrimary]} onPress={onJoin} accessibilityRole="button">
          <Text style={styles.chipPrimaryText}>Join darshan</Text>
        </Pressable>
        <Pressable style={styles.chip} onPress={onRemind} accessibilityRole="button">
          <Text style={styles.chipText}>Remind me</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: fig.strokeCard,
    backgroundColor: fig.surface,
    padding: 14,
    marginVertical: 4,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: fig.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: fig.live,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: fig.textOnBrand },
  liveText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, color: fig.textOnBrand, ...font('800') },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3, color: fig.accent, textTransform: 'uppercase', ...font('800') },
  body: { fontSize: 16, fontWeight: '700', lineHeight: 21, color: fig.textHigh, marginTop: 4, ...font('700') },
  meta: { fontSize: 12.5, color: fig.textLow, marginTop: 6, ...font('400') },
  chips: { flexDirection: 'row', gap: 8, marginTop: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: fig.strokeCard,
    backgroundColor: fig.surface,
  },
  chipPrimary: { backgroundColor: fig.brand, borderColor: fig.brand },
  chipPrimaryText: { fontSize: 13, fontWeight: '800', color: fig.textOnBrand, ...font('800') },
  chipText: { fontSize: 13, fontWeight: '700', color: fig.textHigh, ...font('700') },
});

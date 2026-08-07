/* Home "live moment" banner for a returning user (moment-led Home). A tinted
   card mirroring the Devotion Live-Darshan hero, with two actions: Join darshan
   (opens the prompt) or Later (dismiss). */
import { View, Text, StyleSheet } from 'react-native';
import { fig } from '@/theme/figma';
import { font } from '@/theme/fonts';
import { AppButton } from './AppButton';

export function HomeMomentBanner({
  onJoin,
  onLater,
}: {
  onJoin: () => void;
  onLater: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.eyebrowRow}>
        <View style={styles.liveDot} />
        <Text style={styles.eyebrow}>Live Darshan</Text>
      </View>
      <Text style={styles.title}>Kashi Vishwanath</Text>
      <Text style={styles.body}>12,480 watching · aarti at 7:00 pm</Text>
      <View style={styles.buttons}>
        <AppButton label="Join darshan" variant="solid" onPress={onJoin} />
        <AppButton label="Later" variant="ghost" onPress={onLater} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: fig.heroTint,
    borderRadius: 16,
    padding: 14,
  },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: fig.live },
  eyebrow: { fontSize: 13, fontWeight: '700', color: fig.live, ...font('700') },
  title: { fontSize: 17, fontWeight: '800', color: fig.textHigh, ...font('800') },
  body: { fontSize: 13, lineHeight: 18, color: fig.textLow, marginTop: 2, ...font('400') },
  buttons: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
});

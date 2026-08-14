/* The large card in a Space (Figma 136/137): eyebrow row + title + body +
   action button. `live` swaps the peach eyebrow chip for a red live dot. */
import { View, Text, StyleSheet } from 'react-native';
import { fig } from '@/theme/figma';
import { font } from '@/theme/fonts';
import { type GlyphName } from './AccentIconChip';
import { AgentPulse } from './AgentPulse';
import { AppButton } from './AppButton';
import { Ionicons } from '@expo/vector-icons';
import type { JdsName } from '@/theme/jdsIcons';

type IoniconName = keyof typeof Ionicons.glyphMap;

export function HeroCard({
  icon,
  jds,
  live,
  eyebrow,
  title,
  body,
  button,
  tinted,
}: {
  icon?: GlyphName;
  jds?: JdsName;
  live?: boolean;
  eyebrow: string;
  title: string;
  body: string;
  tinted?: boolean;
  button?: {
    label: string;
    variant?: 'solid' | 'ghost';
    icon?: IoniconName;
    onPress?: () => void;
  };
}) {
  return (
    <View style={[styles.card, tinted && styles.cardTinted]}>
      <View style={styles.eyebrowRow}>
        {live ? (
          <View style={styles.liveDot} />
        ) : (
          <AgentPulse size={18} />
        )}
        <Text style={styles.eyebrow}>{eyebrow}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {button ? (
        <AppButton
          label={button.label}
          variant={button.variant}
          icon={button.icon}
          onPress={button.onPress}
          style={styles.button}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: fig.strokeCard,
    backgroundColor: fig.surface,
    padding: 12,
    gap: 4,
  },
  cardTinted: { backgroundColor: fig.heroTint, borderWidth: 0 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  eyebrow: { fontSize: 12, fontWeight: '400', color: fig.textHigh, ...font('400') },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: fig.live },
  title: { fontSize: 16, fontWeight: '700', color: fig.textHigh, lineHeight: 20, ...font('700') },
  body: { fontSize: 12, fontWeight: '400', color: fig.textLow, lineHeight: 18, ...font('400') },
  button: { marginTop: 12 },
});

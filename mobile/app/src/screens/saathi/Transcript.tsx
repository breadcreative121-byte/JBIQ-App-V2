import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { color, space } from '@theme';
import { text as type } from '@/theme/typography';
import { Bubble } from './Bubble';
import { VoiceSuggestions } from './VoiceSuggestions';
import type { TranscriptItem } from './types';

type Props = { items: TranscriptItem[]; onRetry?: () => void };

// Inverted list keeps the latest message pinned to the bottom and auto-scrolls
// as new items arrive. We reverse the data so newest sits at index 0.
export function Transcript({ items, onRetry }: Props) {
  const data = useMemo(() => [...items].reverse(), [items]);

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[type.bodyM, { color: color.textLow, textAlign: 'center' }]}>
          Namaste. I’m Saathi — ask me anything.
        </Text>
        <VoiceSuggestions />
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      inverted
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <Bubble item={item} onRetry={onRetry} />}
      contentContainerStyle={styles.content}
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  content: { paddingHorizontal: space.m, paddingVertical: space.s },
});

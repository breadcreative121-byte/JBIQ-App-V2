import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { color, space } from '@theme';
import { text as type } from '@/theme/typography';
import { Bubble } from './Bubble';
import { DarshanWinCard } from './DarshanWinCard';
import { VoiceSuggestions } from './VoiceSuggestions';
import type { TranscriptItem } from './types';

type Props = {
  items: TranscriptItem[];
  onRetry?: () => void;
  // Anchor the conversation to the TOP of the screen (the first-run onboarding
  // turn) instead of the default bottom-pinned, inverted list.
  anchorTop?: boolean;
};

export function Transcript({ items, onRetry, anchorTop }: Props) {
  // Inverted list reverses the data so newest sits at index 0 (bottom-pinned).
  const data = useMemo(() => [...items].reverse(), [items]);

  const renderItem = ({ item }: { item: TranscriptItem }) =>
    item.kind === 'assistant' && item.card === 'darshan' ? (
      <DarshanWinCard />
    ) : (
      <Bubble item={item} onRetry={onRetry} />
    );

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

  // Top-down feed: the first message sits at the top and the conversation grows
  // downward, like a chat.
  if (anchorTop) {
    return (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.contentTop}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <FlatList
      data={data}
      inverted
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.content}
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  content: { paddingHorizontal: space.m, paddingVertical: space.s },
  contentTop: { paddingHorizontal: space.m, paddingTop: space.s, paddingBottom: space.s },
});

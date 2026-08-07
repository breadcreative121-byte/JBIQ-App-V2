import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { color } from '@theme';
import { text as type } from '@/theme/typography';

/* A rotating "what to say" hint for the voice/listening screen — cycles through
   varied example prompts with a gentle cross-fade. */
const SUGGESTIONS = [
  'Try “Aaj ka rashifal batao”',
  'Ask “How did yesterday’s match go?”',
  'Say “Recharge my number”',
  'Try “Find a doctor near me”',
  'Ask “Play Hanuman Chalisa”',
  'Say “What’s in the news today?”',
  'Try “Pay the electricity bill”',
];

export function VoiceSuggestions() {
  const [i, setI] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
        setI((p) => (p + 1) % SUGGESTIONS.length);
        Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
      });
    }, 3000);
    return () => clearInterval(id);
  }, [fade]);

  return (
    <Animated.Text style={[type.bodyM, styles.text, { opacity: fade }]} numberOfLines={1}>
      {SUGGESTIONS[i]}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: { color: color.textHigh, textAlign: 'center', marginTop: 10 },
});

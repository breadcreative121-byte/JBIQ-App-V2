import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { color } from '@theme';
import { text as type } from '@/theme/typography';

/* The voice/listening screen's prompt: it opens with "Start talking", holds a
   beat, then cross-fades into rotating "what to say" example prompts. */
const LEAD = 'Start talking';
const LEAD_HOLD = 2200; // beat before the first suggestion appears

const SUGGESTIONS = [
  'Try “Read my horoscope”',
  'Ask “How did yesterday’s match go?”',
  'Say “Recharge my number”',
  'Try “Find a doctor near me”',
  'Ask “Play Hanuman Chalisa”',
  'Say “What’s in the news today?”',
  'Try “Pay the electricity bill”',
];

export function VoiceSuggestions() {
  const [text, setText] = useState(LEAD);
  const fade = useRef(new Animated.Value(1)).current;
  const next = useRef(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const advance = () => {
      Animated.timing(fade, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
        setText(SUGGESTIONS[next.current % SUGGESTIONS.length]);
        next.current += 1;
        Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
      });
    };
    // Hold "Start talking", reveal the first suggestion, then rotate.
    const lead = setTimeout(() => {
      advance();
      interval = setInterval(advance, 3000);
    }, LEAD_HOLD);
    return () => {
      clearTimeout(lead);
      if (interval) clearInterval(interval);
    };
  }, [fade]);

  return (
    <Animated.Text style={[type.bodyM, styles.text, { opacity: fade }]} numberOfLines={1}>
      {text}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: { color: color.textHigh, textAlign: 'center', marginTop: 10 },
});

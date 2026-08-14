/* AgentPulse — the Saathi assistant mark (JDS): four brand-indigo dots in a 2×2
   grid. Used in place of a generic icon to signal "your assistant is speaking"
   (e.g. the Home contextual banner header). Exact geometry from Figma 172:2256
   (15×15 glyph; sits in a 20px frame with 12.5% padding). */
import Svg, { Circle } from 'react-native-svg';
import { fig } from '@/theme/figma';

export function AgentPulse({ size = 15, color = fig.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <Circle cx={3.75} cy={3.75} r={3.75} fill={color} />
      <Circle cx={11.25} cy={3.75} r={3.75} fill={color} />
      <Circle cx={3.75} cy={11.25} r={3.75} fill={color} />
      <Circle cx={11.25} cy={11.25} r={3.75} fill={color} />
    </Svg>
  );
}

/* Renders a JDS glyph (SVG) at a given size/colour. The design-system SVGs use
   #1A1A1A as their single colour token; we swap it for the render colour. */
import { SvgXml } from 'react-native-svg';
import { JDS_ICONS, type JdsName } from '@/theme/jdsIcons';

export function JdsIcon({
  name,
  size = 20,
  color,
}: {
  name: JdsName;
  size?: number;
  color: string;
}) {
  const xml = JDS_ICONS[name].replace(/#1A1A1A/gi, color);
  return <SvgXml xml={xml} width={size} height={size} />;
}

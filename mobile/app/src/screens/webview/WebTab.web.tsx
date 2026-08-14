import { StyleSheet, View } from 'react-native';
import { color } from '@theme';

// Web build of the WebView tab. react-native-webview has no web implementation,
// so on web we embed the same page in an <iframe> (content is same-origin — it's
// served from the same host as this app — so it loads without cross-origin issues).
export function WebTab({ url }: { url: string }) {
  return (
    <View style={styles.container}>
      <iframe src={url} title="JBIQ web content" style={IFRAME_STYLE} />
    </View>
  );
}

const IFRAME_STYLE = { border: 'none', width: '100%', height: '100%' } as const;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.surfaceDefault },
});

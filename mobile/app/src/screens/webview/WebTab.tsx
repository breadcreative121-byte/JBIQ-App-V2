import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { createAudioPlayer } from 'expo-audio';
import { color, radius, space } from '@theme';
import { text as type } from '@/theme/typography';

const WARNING_CUE = require('../../../assets/audio/info_warning.mp3');

// Ensures pages scale to the device and respect the safe area, for the few that
// lack a viewport meta tag.
const VIEWPORT_JS = `(function(){
  if (!document.querySelector('meta[name=viewport]')) {
    var m = document.createElement('meta');
    m.name = 'viewport';
    m.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    document.head.appendChild(m);
  }
  true;
})();`;

export function WebTab({ url }: { url: string }) {
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const webRef = useRef<WebView>(null);

  const onError = () => {
    setErrored(true);
    setLoading(false);
    try {
      createAudioPlayer(WARNING_CUE).play();
    } catch {
      // cue is non-essential
    }
  };

  const retry = () => {
    setErrored(false);
    setLoading(true);
    webRef.current?.reload();
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        source={{ uri: url }}
        originWhitelist={['*']}
        decelerationRate="normal"
        pullToRefreshEnabled
        applicationNameForUserAgent="JBIQ-iOS/1.0"
        injectedJavaScriptBeforeContentLoaded={VIEWPORT_JS}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={onError}
        onHttpError={onError}
        style={styles.web}
      />

      {loading && !errored ? (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color={color.primary50} />
        </View>
      ) : null}

      {errored ? (
        <View style={styles.errorState}>
          <Text style={[type.titleM, styles.errorTitle]}>Couldn’t load this page</Text>
          <Text style={[type.bodyM, styles.errorBody]}>
            Looks like the connection dropped — let’s try again.
          </Text>
          <Pressable onPress={retry} style={styles.retryBtn} accessibilityRole="button">
            <Text style={[type.button, { color: color.white }]}>Try again</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.surfaceDefault },
  web: { flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surfaceDefault,
  },
  errorState: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    gap: space.s,
    backgroundColor: color.surfaceDefault,
  },
  errorTitle: { color: color.error },
  errorBody: { color: color.textLow, textAlign: 'center' },
  retryBtn: {
    marginTop: space.s,
    backgroundColor: color.primary50,
    paddingHorizontal: space.xl,
    paddingVertical: space.s,
    borderRadius: radius.shapePill,
  },
});

import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Video from 'react-native-video';
import { useTheme } from '../theme';

// Store/props assets aren't always static images — some categories (Rides,
// Entrances) are short video clips. <Image> silently fails to load those
// (onError fires, falls back to the emoji placeholder) and never plays
// anything. This renders the right element for whichever mimeType the
// asset actually is, and for video, plays once on tap instead of nothing.
export function AssetPreview({ uri, mimeType, style, fallbackEmoji = '🖼️', fallbackStyle, interactive = true }) {
  const theme = useTheme();
  const [failed, setFailed] = React.useState(false);
  const [paused, setPaused] = React.useState(true);
  const videoRef = React.useRef(null);
  const isVideo = typeof mimeType === 'string' && mimeType.startsWith('video/');

  if (!uri || failed) {
    return <Text style={fallbackStyle}>{fallbackEmoji}</Text>;
  }

  if (isVideo) {
    return <Pressable
        collapsable={false}
        disabled={!interactive}
        onPress={() => setPaused(current => !current)}
        style={[styles.videoWrap, style]}
      >
        <Video
          ref={videoRef}
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          paused={paused}
          repeat={false}
          muted={!interactive}
          useTextureView
          onError={() => setFailed(true)}
          onEnd={() => {
            setPaused(true);
            videoRef.current?.seek(0);
          }}
        />
        {interactive && paused ? <View style={styles.playOverlay}>
            <Text style={[styles.playGlyph, { color: theme.cta.primary.text }]}>▶</Text>
          </View> : null}
      </Pressable>;
  }

  return <Image source={{ uri }} style={style} resizeMode="contain" onError={() => setFailed(true)} />;
}

const styles = StyleSheet.create({
  videoWrap: {
    position: 'relative',
    overflow: 'hidden'
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  playGlyph: {
    fontSize: 26
  }
});

export default AssetPreview;

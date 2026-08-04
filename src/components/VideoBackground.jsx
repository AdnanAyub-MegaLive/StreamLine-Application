import React from 'react';
import { StyleSheet, View } from 'react-native';
import Video from 'react-native-video';
import { backgroundVideo } from '../assets';

// A true forward/reverse "boomerang" loop was tried here via manual
// seek() calls (pausing real playback and driving position ourselves,
// since react-native-video/ExoPlayer has no native reverse-playback
// support on Android). It doesn't work in practice: every seek() forces
// ExoPlayer's decoder to fully reinitialize (confirmed via adb logcat —
// repeated "ACodec ... Now Executing" on every tick), so it never
// actually gets far enough to render a frame. Reverted to a plain
// forward loop until there's a real way to do this (e.g. shipping a
// pre-baked boomerang video file instead of faking it at playback time).
export function VideoBackground() {
  return <View style={styles.base} pointerEvents="none">
      <Video source={backgroundVideo} style={StyleSheet.absoluteFill} resizeMode="cover" repeat muted playInBackground={false} playWhenInactive={false} ignoreSilentSwitch="obey" />
      <View style={styles.scrim} />
    </View>;
}
const styles = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#04342C'
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(4, 52, 44, 0.55)'
  }
});
export default VideoBackground;

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Video from 'react-native-video';
import { backgroundVideo } from '../assets';

export function VideoBackground() {
  return (
    <View style={styles.base} pointerEvents="none">
      <Video
        source={backgroundVideo}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        repeat
        muted
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="obey"
      />
      <View style={styles.scrim} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#04342C',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(4, 52, 44, 0.55)',
  },
});

export default VideoBackground;

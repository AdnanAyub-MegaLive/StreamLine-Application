import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { scaleFont } from '../utils';

// The bundled preset avatars offered at onboarding — no CDN/upload needed
// for these, they render locally from theme.onboarding.avatarStyles (emoji
// + accent/background pair). Real uploaded photos come later once CDN
// storage is wired up; until then a profile's stored value is either one of
// these preset ids (`avatar:<id>`) or, once CDN support lands, a real
// http(s) URL — Avatar below already handles both.
export const AVATAR_PRESETS = [
  { id: 'ranger', label: 'Ranger', emoji: '🕵️' },
  { id: 'hero', label: 'Hero', emoji: '🦸' },
  { id: 'nova', label: 'Nova', emoji: '🪐' },
  { id: 'star', label: 'Star', emoji: '⭐' },
  { id: 'wizard', label: 'Wizard', emoji: '🧙' },
  { id: 'ninja', label: 'Ninja', emoji: '🥷' },
  { id: 'robot', label: 'Robot', emoji: '🤖' },
  { id: 'explorer', label: 'Explorer', emoji: '🧭' }
];

const PRESET_PREFIX = 'avatar:';

export function getAvatarPresetValue(presetId) {
  return `${PRESET_PREFIX}${presetId}`;
}

function getAvatarPreset(value) {
  if (typeof value !== 'string' || !value.startsWith(PRESET_PREFIX)) {
    return null;
  }
  const id = value.slice(PRESET_PREFIX.length);
  return AVATAR_PRESETS.find(preset => preset.id === id) ?? null;
}

// Exposed so screens that let a user re-pick their avatar (e.g. Edit
// Profile) can pre-select whichever preset is already saved, without
// duplicating the avatar:<id> parsing logic.
export function getAvatarPresetId(value) {
  return getAvatarPreset(value)?.id ?? null;
}

function getInitial(fullName) {
  return (fullName || '?').trim().slice(0, 1).toUpperCase();
}

// Single place that decides how to render a "DP" everywhere it shows up —
// a bundled preset (avatar:<id>), a real photo URL, or (if neither) a
// letter-initial placeholder. Keeping this logic in one component means
// every screen renders profile pictures the same way.
export function Avatar({ value, fullName, size = 48, style }) {
  const theme = useTheme();
  const [imageFailed, setImageFailed] = React.useState(false);
  // Reset whenever the value changes — otherwise a component instance that
  // stays mounted across a prop change (e.g. a seat's avatarUri arriving
  // after a failed placeholder load, or a profile photo being updated)
  // would keep showing the initials fallback forever, even once the new
  // value is perfectly loadable.
  React.useEffect(() => {
    setImageFailed(false);
  }, [value]);
  const preset = getAvatarPreset(value);
  const circleStyle = [
    styles.circle,
    { width: size, height: size, borderRadius: size / 2 },
    style
  ];

  if (preset) {
    const avatarTheme = theme.onboarding.avatarStyles[preset.id];
    return (
      <View
        style={[
          circleStyle,
          { backgroundColor: avatarTheme.background, borderColor: avatarTheme.accent, borderWidth: 1 }
        ]}
      >
        <Text style={{ fontSize: Math.round(size * 0.5) }}>{preset.emoji}</Text>
      </View>
    );
  }

  if (value && !imageFailed) {
    return (
      <Image
        source={{ uri: value }}
        style={circleStyle}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <View style={[circleStyle, { backgroundColor: theme.state.soft, borderColor: theme.colors.cardBorder, borderWidth: 1 }]}>
      <Text style={[styles.initial, { color: theme.colors.teal700, fontSize: scaleFont(Math.round(size * 0.4)) }]}>
        {getInitial(fullName)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  initial: {
    fontWeight: '800'
  }
});

export default Avatar;

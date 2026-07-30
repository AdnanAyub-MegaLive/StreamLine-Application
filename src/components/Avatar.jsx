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
//
// frameUri is an optional decorative border image (an admin-assigned
// FRAMES asset — see useAssignedFrame) drawn around the circle. It has to
// live outside the circle's own View, which clips its contents
// (overflow:hidden, so the photo/initials stay a perfect circle) — a frame
// is deliberately a bit larger than the photo and would get cut off by
// that same clipping if it were inside it.
export function Avatar({ value, fullName, size = 48, style, frameUri }) {
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
  // Only applied to the outermost element this component returns — the
  // frame branch below wraps circleStyle in another View, so `style` must
  // not also be baked into circleStyle there or margin/etc. would stack on
  // both.
  const circleStyle = [
    styles.circle,
    { width: size, height: size, borderRadius: size / 2 },
    !frameUri && style
  ];

  // A frame already draws its own decorative boundary around the circle —
  // the circle's own border would double up with it (and often clash with
  // the frame's colors), so it's only applied when there's no frame.
  let content;
  if (preset) {
    const avatarTheme = theme.onboarding.avatarStyles[preset.id];
    content = (
      <View
        style={[
          circleStyle,
          { backgroundColor: avatarTheme.background },
          !frameUri && { borderColor: avatarTheme.accent, borderWidth: 1 }
        ]}
      >
        <Text style={{ fontSize: Math.round(size * 0.5) }}>{preset.emoji}</Text>
      </View>
    );
  } else if (value && !imageFailed) {
    content = (
      <Image
        source={{ uri: value }}
        style={circleStyle}
        onError={() => setImageFailed(true)}
      />
    );
  } else {
    content = (
      <View style={[circleStyle, { backgroundColor: theme.state.soft }, !frameUri && { borderColor: theme.colors.cardBorder, borderWidth: 1 }]}>
        <Text style={[styles.initial, { color: theme.colors.teal700, fontSize: scaleFont(Math.round(size * 0.4)) }]}>
          {getInitial(fullName)}
        </Text>
      </View>
    );
  }

  if (!frameUri) {
    return content;
  }

  // The frame is sized ~35% larger than the circle and centered over it —
  // a typical decorative-frame proportion (it surrounds the photo rather
  // than sitting flush against its edge). pointerEvents="none" so it never
  // steals taps meant for whatever wraps this Avatar (e.g. a Pressable
  // avatar that opens Change Avatar).
  const frameSize = Math.round(size * 1.35);
  return (
    <View style={[styles.frameWrap, { width: frameSize, height: frameSize }, style]}>
      {content}
      <Image
        source={{ uri: frameUri }}
        style={[styles.frameImage, { width: frameSize, height: frameSize }]}
        resizeMode="contain"
        pointerEvents="none"
      />
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
  },
  frameWrap: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  frameImage: {
    position: 'absolute'
  }
});

export default Avatar;

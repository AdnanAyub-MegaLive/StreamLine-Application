import { Dimensions, PixelRatio } from 'react-native';

// iPhone 11 / most common design baseline used across the app's mockups.
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

function getWindow() {
  return Dimensions.get('window');
}

export function scaleWidth(size) {
  const { width } = getWindow();
  return (width / BASE_WIDTH) * size;
}

export function scaleHeight(size) {
  const { height } = getWindow();
  return (height / BASE_HEIGHT) * size;
}

// Moderate scale: blends fixed size with scaled size so text/spacing doesn't
// grow linearly with very large or very small screens (avoids oversized UI
// on tablets and unreadably small UI on tiny phones).
export function scaleModerate(size, factor = 0.5) {
  return size + (scaleWidth(size) - size) * factor;
}

export function scaleFont(size) {
  const scaled = scaleModerate(size, 0.3);
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
}

export const responsive = {
  width: scaleWidth,
  height: scaleHeight,
  moderate: scaleModerate,
  font: scaleFont
};

export default responsive;

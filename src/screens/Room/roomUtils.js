export const CHAT_MESSAGE_MAX_LENGTH = 200;
export const SEAT_NOTE_MAX_LENGTH = 40;

export function isVideoUrl(url) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url ?? '');
}

export function buildSeatRowsFromGroups(seatGroups) {
  let seatIndex = 0;
  return seatGroups.map((count, rowIndex) => Array.from({ length: count }, () => {
    seatIndex += 1;
    return { id: `row${rowIndex}-seat${seatIndex}`, name: null, occupied: false, locked: false };
  }));
}

export function bannerHoldMs(item) {
  const artUrl = item?.kind === 'ride' ? item?.rideUrl : item?.entranceUrl;
  return artUrl && isVideoUrl(artUrl) ? 3000 : 1000;
}

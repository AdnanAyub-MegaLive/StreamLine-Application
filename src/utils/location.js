import { Linking, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { createMMKV } from 'react-native-mmkv';
// BUGFIX: no locationProvider means this library defaults to Google Play
// Services' Fused Location Provider on Android — fine on a OnePlus with an
// up-to-date, well-integrated Play Services install, but on a lot of
// budget/regional devices (reported: an Infinix) that provider is broken,
// outdated, or effectively unreachable, so getCurrentPosition fails
// immediately no matter what — not a signal/timeout issue at all, which is
// why it happened even with the device's location toggle on and survived
// the retry/accuracy fix in getCurrentLocationOrError below. 'android'
// forces Android's own native LocationManager (GPS/network providers
// directly), which every Android device has regardless of Play Services.
Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
  locationProvider: 'android'
});
const locationStorage = createMMKV({
  id: 'streamline-location'
});
const LOCATION_KEY = 'last-known-location';
// iOS: requestAuthorization resolves with the current status without
// re-prompting once the user has already answered, so it doubles as a
// permission check.
export async function checkLocationPermission() {
  if (Platform.OS === 'android') {
    return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  }
  return new Promise(resolve => {
    Geolocation.requestAuthorization(() => resolve(true), () => resolve(false));
  });
}
export async function requestLocationPermission() {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
      title: 'Location Permission',
      message: 'Streamline needs your location to personalize your experience and secure your account.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny'
    });
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
  return checkLocationPermission();
}
// On Android this opens the system-wide "Location" toggle page directly
// (not the app's own info page) — that's what actually needs changing when
// device location services are off, not an app-level permission. iOS has no
// public API to deep-link into Settings > Privacy > Location Services, so
// Linking.openSettings() (this app's own settings page, which still shows
// its Location permission row) is the closest available option there.
export function openLocationSettings() {
  if (Platform.OS === 'android') {
    Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() => Linking.openSettings());
    return;
  }
  Linking.openSettings();
}
// Geolocation's own error codes (Android/iOS both use this numbering):
// 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE (location services off, or
// no provider can produce a fix at all), 3 = TIMEOUT (services are on and a
// fix is possible in principle, it just didn't arrive in time — weak
// signal, indoors, cold GPS start). These need different user-facing
// messages: only the first two are actually "turn location on/allow
// permission" situations; a timeout is not, and sending the user to
// Settings for it fixes nothing.
const GEOLOCATION_ERROR_CODES = {
  1: 'PERMISSION_DENIED',
  2: 'POSITION_UNAVAILABLE',
  3: 'TIMEOUT'
};

function requestPosition(options) {
  return new Promise(resolve => {
    Geolocation.getCurrentPosition(
      position => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        locationStorage.set(LOCATION_KEY, JSON.stringify(location));
        resolve({ location });
      },
      error => resolve({ errorCode: GEOLOCATION_ERROR_CODES[error?.code] ?? 'POSITION_UNAVAILABLE' }),
      options
    );
  });
}

// Like getCurrentLocation, but reports *why* it failed instead of just
// null, so callers (login/signup) can show an accurate message instead of
// always claiming location is off. maximumAge lets a fix from the last
// minute (e.g. one taken moments ago on a previous attempt) resolve
// instantly instead of waiting on a fresh GPS read every single time —
// the 12s timeout is the ceiling only for when no recent fix exists at
// all.
//
// BUGFIX: this used to try enableHighAccuracy:false (network/WiFi/cell-based
// positioning) FIRST and only fall back to GPS if that attempt failed
// outright. The real problem turned out to be worse than "fails on weak
// devices" — on at least one device (Infinix, in Pakistan) the network fix
// doesn't fail, it *succeeds* with a wrong answer (resolved to the US),
// almost certainly an IP/cell-network-based estimate landing on some
// default/generic location when real WiFi-scan data isn't available. Since
// it "succeeded", the GPS fallback never even ran, and the wrong fix got
// cached and reused everywhere via getCachedLocation(). GPS is slower to
// get a first fix but is the only one of the two that can't just be wrong
// about which country you're in, so it goes first now — network-based is
// only the fallback, for when GPS itself can't get a fix at all (indoors,
// no clear sky).
export async function getCurrentLocationOrError() {
  const precise = await requestPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
  if (precise.location) {
    return precise;
  }
  return requestPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
}

// Back-compat for callers that only ever cared about success/failure (e.g.
// PermissionsGate's background warm-up, SignupDetails' cached-location
// fallback) — collapses any failure reason back down to null.
export async function getCurrentLocation() {
  const result = await getCurrentLocationOrError();
  return result.location ?? null;
}
export function getCachedLocation() {
  const raw = locationStorage.getString(LOCATION_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
export function formatLocationString(location) {
  return `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;
}

// Reverse-geocodes GPS coordinates into a country name using OpenStreetMap's
// free Nominatim API (no key required). This is deliberately separate from
// getDeviceCountryName() in deviceCountry.js, which only reads the phone's
// Region *setting* — that can say "United States" even while the device is
// physically in Pakistan, since it's a locale preference, not a location.
export async function reverseGeocodeCountry(location) {
  const address = await reverseGeocodeAddress(location);
  return address?.country ?? null;
}

// Nominatim has no SLA and no request timeout of its own — a slow or
// unreachable response used to hang login/signup for a long time (this
// fetch had no timeout at all) since it's awaited before the actual login
// request even starts. 4s is enough for a normal response; past that,
// reverseGeocodeLocationLabel below just falls back to the raw
// coordinates instead of blocking the user.
const REVERSE_GEOCODE_TIMEOUT = 4000;

async function reverseGeocodeAddress(location) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REVERSE_GEOCODE_TIMEOUT);
  try {
    // accept-language=en forces English place names — without it Nominatim
    // localizes to the device/region's language (e.g. Urdu for Pakistan).
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=10&addressdetails=1&accept-language=en`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'StreamlineApp/1.0', 'Accept-Language': 'en' },
      signal: controller.signal
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data?.address ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Turns GPS coordinates into a human-readable "City, Country" label (e.g.
// "Lahore, Pakistan") for sending as device.location on register/login —
// matches the backend's documented example instead of sending raw
// coordinates. Falls back to the "lat,lng" string (never empty) if reverse
// geocoding fails, since the backend requires this field to be present.
export async function reverseGeocodeLocationLabel(location) {
  const address = await reverseGeocodeAddress(location);
  const city = address?.city || address?.town || address?.village || address?.county;
  const country = address?.country;
  if (city && country) {
    return `${city}, ${country}`;
  }
  if (country) {
    return country;
  }
  return formatLocationString(location);
}

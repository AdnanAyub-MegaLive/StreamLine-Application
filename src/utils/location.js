import { Linking, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { createMMKV } from 'react-native-mmkv';
Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse'
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
export function openLocationSettings() {
  Linking.openSettings();
}
export function getCurrentLocation() {
  return new Promise(resolve => {
    Geolocation.getCurrentPosition(position => {
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      locationStorage.set(LOCATION_KEY, JSON.stringify(location));
      resolve(location);
    }, () => resolve(null), {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 60000
    });
  });
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

async function reverseGeocodeAddress(location) {
  try {
    // accept-language=en forces English place names — without it Nominatim
    // localizes to the device/region's language (e.g. Urdu for Pakistan).
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=10&addressdetails=1&accept-language=en`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'StreamlineApp/1.0', 'Accept-Language': 'en' }
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data?.address ?? null;
  } catch {
    return null;
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

import * as RNLocalize from 'react-native-localize';

// Reads the device's Region setting (not the network/IP) so the signup form
// can prefill the country field without any location permission or network
// call — the user can still edit it manually before submitting.
export function getDeviceCountryName() {
  const countryCode = RNLocalize.getCountry();
  try {
    const displayNames = new Intl.DisplayNames(['en'], {
      type: 'region'
    });
    return displayNames.of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}

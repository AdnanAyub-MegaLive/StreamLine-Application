export const REGION_FILTERS = [
  { id: 'all', label: 'All', flags: '', countries: [] },
  {
    id: 'europe',
    label: 'Europe',
    flags: '🇬🇧🇫🇷🇩🇪🇮🇹',
    countries: [
      { id: 'gb', label: 'United Kingdom', flag: '🇬🇧' },
      { id: 'fr', label: 'France', flag: '🇫🇷' },
      { id: 'de', label: 'Germany', flag: '🇩🇪' },
      { id: 'it', label: 'Italy', flag: '🇮🇹' },
      { id: 'es', label: 'Spain', flag: '🇪🇸' },
      { id: 'pt', label: 'Portugal', flag: '🇵🇹' },
      { id: 'nl', label: 'Netherlands', flag: '🇳🇱' },
      { id: 'be', label: 'Belgium', flag: '🇧🇪' },
      { id: 'ch', label: 'Switzerland', flag: '🇨🇭' },
      { id: 'at', label: 'Austria', flag: '🇦🇹' },
      { id: 'pl', label: 'Poland', flag: '🇵🇱' },
      { id: 'se', label: 'Sweden', flag: '🇸🇪' },
      { id: 'no', label: 'Norway', flag: '🇳🇴' },
      { id: 'dk', label: 'Denmark', flag: '🇩🇰' },
      { id: 'fi', label: 'Finland', flag: '🇫🇮' },
      { id: 'ie', label: 'Ireland', flag: '🇮🇪' },
      { id: 'gr', label: 'Greece', flag: '🇬🇷' },
      { id: 'ua', label: 'Ukraine', flag: '🇺🇦' },
      { id: 'ro', label: 'Romania', flag: '🇷🇴' },
      { id: 'cz', label: 'Czechia', flag: '🇨🇿' }
    ]
  },
  {
    id: 'russia',
    label: 'Russia',
    flags: '🇷🇺',
    countries: [{ id: 'ru', label: 'Russia', flag: '🇷🇺' }]
  },
  {
    id: 'usa-canada',
    label: 'USA and Canada',
    flags: '🇺🇸🇨🇦',
    countries: [
      { id: 'us', label: 'United States', flag: '🇺🇸' },
      { id: 'ca', label: 'Canada', flag: '🇨🇦' }
    ]
  },
  {
    id: 'middle-america',
    label: 'Middle America',
    flags: '🇲🇽🇨🇺🇵🇦',
    countries: [
      { id: 'mx', label: 'Mexico', flag: '🇲🇽' },
      { id: 'gt', label: 'Guatemala', flag: '🇬🇹' },
      { id: 'bz', label: 'Belize', flag: '🇧🇿' },
      { id: 'hn', label: 'Honduras', flag: '🇭🇳' },
      { id: 'sv', label: 'El Salvador', flag: '🇸🇻' },
      { id: 'ni', label: 'Nicaragua', flag: '🇳🇮' },
      { id: 'cr', label: 'Costa Rica', flag: '🇨🇷' },
      { id: 'pa', label: 'Panama', flag: '🇵🇦' },
      { id: 'cu', label: 'Cuba', flag: '🇨🇺' },
      { id: 'jm', label: 'Jamaica', flag: '🇯🇲' },
      { id: 'do', label: 'Dominican Republic', flag: '🇩🇴' },
      { id: 'ht', label: 'Haiti', flag: '🇭🇹' }
    ]
  },
  {
    id: 'south-america',
    label: 'South America',
    flags: '🇧🇷🇦🇷🇨🇱',
    countries: [
      { id: 'br', label: 'Brazil', flag: '🇧🇷' },
      { id: 'ar', label: 'Argentina', flag: '🇦🇷' },
      { id: 'cl', label: 'Chile', flag: '🇨🇱' },
      { id: 'pe', label: 'Peru', flag: '🇵🇪' },
      { id: 'co', label: 'Colombia', flag: '🇨🇴' },
      { id: 've', label: 'Venezuela', flag: '🇻🇪' },
      { id: 'ec', label: 'Ecuador', flag: '🇪🇨' },
      { id: 'bo', label: 'Bolivia', flag: '🇧🇴' },
      { id: 'py', label: 'Paraguay', flag: '🇵🇾' },
      { id: 'uy', label: 'Uruguay', flag: '🇺🇾' },
      { id: 'gy', label: 'Guyana', flag: '🇬🇾' },
      { id: 'sr', label: 'Suriname', flag: '🇸🇷' }
    ]
  },
  {
    id: 'north-africa-southwest-asia',
    label: 'North Africa and Southwest Asia',
    flags: '🇪🇬🇸🇦🇹🇷',
    countries: [
      { id: 'eg', label: 'Egypt', flag: '🇪🇬' },
      { id: 'ly', label: 'Libya', flag: '🇱🇾' },
      { id: 'tn', label: 'Tunisia', flag: '🇹🇳' },
      { id: 'dz', label: 'Algeria', flag: '🇩🇿' },
      { id: 'ma', label: 'Morocco', flag: '🇲🇦' },
      { id: 'sa', label: 'Saudi Arabia', flag: '🇸🇦' },
      { id: 'ae', label: 'UAE', flag: '🇦🇪' },
      { id: 'qa', label: 'Qatar', flag: '🇶🇦' },
      { id: 'kw', label: 'Kuwait', flag: '🇰🇼' },
      { id: 'bh', label: 'Bahrain', flag: '🇧🇭' },
      { id: 'om', label: 'Oman', flag: '🇴🇲' },
      { id: 'ye', label: 'Yemen', flag: '🇾🇪' },
      { id: 'jo', label: 'Jordan', flag: '🇯🇴' },
      { id: 'lb', label: 'Lebanon', flag: '🇱🇧' },
      { id: 'sy', label: 'Syria', flag: '🇸🇾' },
      { id: 'iq', label: 'Iraq', flag: '🇮🇶' },
      { id: 'ir', label: 'Iran', flag: '🇮🇷' },
      { id: 'il', label: 'Israel', flag: '🇮🇱' },
      { id: 'tr', label: 'Turkey', flag: '🇹🇷' }
    ]
  },
  {
    id: 'subsaharan-africa',
    label: 'Subsaharan Africa',
    flags: '🇳🇬🇰🇪🇿🇦',
    countries: [
      { id: 'ng', label: 'Nigeria', flag: '🇳🇬' },
      { id: 'ke', label: 'Kenya', flag: '🇰🇪' },
      { id: 'za', label: 'South Africa', flag: '🇿🇦' },
      { id: 'et', label: 'Ethiopia', flag: '🇪🇹' },
      { id: 'gh', label: 'Ghana', flag: '🇬🇭' },
      { id: 'tz', label: 'Tanzania', flag: '🇹🇿' },
      { id: 'ug', label: 'Uganda', flag: '🇺🇬' },
      { id: 'sn', label: 'Senegal', flag: '🇸🇳' },
      { id: 'ci', label: "Côte d'Ivoire", flag: '🇨🇮' },
      { id: 'cm', label: 'Cameroon', flag: '🇨🇲' },
      { id: 'zw', label: 'Zimbabwe', flag: '🇿🇼' },
      { id: 'zm', label: 'Zambia', flag: '🇿🇲' },
      { id: 'ao', label: 'Angola', flag: '🇦🇴' },
      { id: 'mz', label: 'Mozambique', flag: '🇲🇿' },
      { id: 'cd', label: 'DR Congo', flag: '🇨🇩' }
    ]
  },
  {
    id: 'south-asia',
    label: 'South Asia',
    flags: '🇵🇰🇮🇳🇧🇩',
    countries: [
      { id: 'pk', label: 'Pakistan', flag: '🇵🇰' },
      { id: 'in', label: 'India', flag: '🇮🇳' },
      { id: 'bd', label: 'Bangladesh', flag: '🇧🇩' },
      { id: 'lk', label: 'Sri Lanka', flag: '🇱🇰' },
      { id: 'np', label: 'Nepal', flag: '🇳🇵' },
      { id: 'af', label: 'Afghanistan', flag: '🇦🇫' },
      { id: 'bt', label: 'Bhutan', flag: '🇧🇹' },
      { id: 'mv', label: 'Maldives', flag: '🇲🇻' }
    ]
  },
  {
    id: 'east-asia',
    label: 'East Asia',
    flags: '🇨🇳🇯🇵🇰🇷',
    countries: [
      { id: 'cn', label: 'China', flag: '🇨🇳' },
      { id: 'jp', label: 'Japan', flag: '🇯🇵' },
      { id: 'kr', label: 'South Korea', flag: '🇰🇷' },
      { id: 'kp', label: 'North Korea', flag: '🇰🇵' },
      { id: 'tw', label: 'Taiwan', flag: '🇹🇼' },
      { id: 'mn', label: 'Mongolia', flag: '🇲🇳' },
      { id: 'hk', label: 'Hong Kong', flag: '🇭🇰' }
    ]
  },
  {
    id: 'southeast-asia',
    label: 'Southeast Asia',
    flags: '🇮🇩🇵🇭🇻🇳',
    countries: [
      { id: 'id', label: 'Indonesia', flag: '🇮🇩' },
      { id: 'ph', label: 'Philippines', flag: '🇵🇭' },
      { id: 'vn', label: 'Vietnam', flag: '🇻🇳' },
      { id: 'th', label: 'Thailand', flag: '🇹🇭' },
      { id: 'my', label: 'Malaysia', flag: '🇲🇾' },
      { id: 'sg', label: 'Singapore', flag: '🇸🇬' },
      { id: 'mm', label: 'Myanmar', flag: '🇲🇲' },
      { id: 'kh', label: 'Cambodia', flag: '🇰🇭' },
      { id: 'la', label: 'Laos', flag: '🇱🇦' },
      { id: 'bn', label: 'Brunei', flag: '🇧🇳' },
      { id: 'tl', label: 'Timor-Leste', flag: '🇹🇱' }
    ]
  },
  {
    id: 'australia-pacific',
    label: 'Australia and Pacific',
    flags: '🇦🇺🇳🇿🇫🇯',
    countries: [
      { id: 'au', label: 'Australia', flag: '🇦🇺' },
      { id: 'nz', label: 'New Zealand', flag: '🇳🇿' },
      { id: 'fj', label: 'Fiji', flag: '🇫🇯' },
      { id: 'pg', label: 'Papua New Guinea', flag: '🇵🇬' },
      { id: 'ws', label: 'Samoa', flag: '🇼🇸' },
      { id: 'to', label: 'Tonga', flag: '🇹🇴' },
      { id: 'sb', label: 'Solomon Islands', flag: '🇸🇧' },
      { id: 'vu', label: 'Vanuatu', flag: '🇻🇺' }
    ]
  }
];

// room.country (see startAudioRoom's country param) is the plain country
// name from reverseGeocodeCountry/Nominatim (e.g. "Pakistan") — matched
// here against REGION_FILTERS' country labels rather than their ISO ids,
// since rooms never carry an ISO code.
export function matchesRegionFilter(country, regionFilter) {
  const region = regionFilter?.region ?? 'all';
  const countryId = regionFilter?.country ?? 'all';
  if (region === 'all') {
    return true;
  }
  if (!country) {
    return false;
  }
  const regionData = REGION_FILTERS.find(item => item.id === region);
  if (!regionData) {
    return true;
  }
  const normalized = country.trim().toLowerCase();
  if (countryId !== 'all') {
    const countryData = regionData.countries.find(item => item.id === countryId);
    return countryData ? countryData.label.toLowerCase() === normalized : false;
  }
  return regionData.countries.some(item => item.label.toLowerCase() === normalized);
}

export default REGION_FILTERS;

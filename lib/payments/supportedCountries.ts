/**
 * Frontend-facing country catalog for the payment country picker.
 * Source of truth is the backend's PaymentOperatorRegistry — this
 * list only exists so the picker has labels + flag emojis before any
 * network round-trip. If the backend adds a country, add it here too.
 */

export interface CountryEntry {
  iso2: string;
  name: string;
  flag: string;   // emoji
  dialCode: string;
}

export const SUPPORTED_COUNTRIES: CountryEntry[] = [
  { iso2: 'RW', name: 'Rwanda',                       flag: '🇷🇼', dialCode: '+250' },
  { iso2: 'KE', name: 'Kenya',                        flag: '🇰🇪', dialCode: '+254' },
  { iso2: 'UG', name: 'Uganda',                       flag: '🇺🇬', dialCode: '+256' },
  { iso2: 'TZ', name: 'Tanzania',                     flag: '🇹🇿', dialCode: '+255' },
  { iso2: 'ZM', name: 'Zambia',                       flag: '🇿🇲', dialCode: '+260' },
  { iso2: 'GH', name: 'Ghana',                        flag: '🇬🇭', dialCode: '+233' },
  { iso2: 'NG', name: 'Nigeria',                      flag: '🇳🇬', dialCode: '+234' },
  { iso2: 'MW', name: 'Malawi',                       flag: '🇲🇼', dialCode: '+265' },
  { iso2: 'BJ', name: 'Benin',                        flag: '🇧🇯', dialCode: '+229' },
  { iso2: 'BF', name: 'Burkina Faso',                 flag: '🇧🇫', dialCode: '+226' },
  { iso2: 'CM', name: 'Cameroon',                     flag: '🇨🇲', dialCode: '+237' },
  { iso2: 'CD', name: 'DR Congo',                     flag: '🇨🇩', dialCode: '+243' },
  { iso2: 'CG', name: 'Congo',                        flag: '🇨🇬', dialCode: '+242' },
  { iso2: 'CI', name: "Côte d'Ivoire",                flag: '🇨🇮', dialCode: '+225' },
  { iso2: 'ET', name: 'Ethiopia',                     flag: '🇪🇹', dialCode: '+251' },
  { iso2: 'GA', name: 'Gabon',                        flag: '🇬🇦', dialCode: '+241' },
  { iso2: 'LS', name: 'Lesotho',                      flag: '🇱🇸', dialCode: '+266' },
  { iso2: 'MZ', name: 'Mozambique',                   flag: '🇲🇿', dialCode: '+258' },
  { iso2: 'SN', name: 'Senegal',                      flag: '🇸🇳', dialCode: '+221' },
  { iso2: 'SL', name: 'Sierra Leone',                 flag: '🇸🇱', dialCode: '+232' },
];

export function findCountry(iso2: string | null | undefined): CountryEntry | null {
  if (!iso2) return null;
  const upper = iso2.toUpperCase();
  return SUPPORTED_COUNTRIES.find(c => c.iso2 === upper) ?? null;
}

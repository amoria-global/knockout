// Location detection and management utilities

export interface LocationData {
  country: string;
  countryCode: string;
  district: string;
  latitude: number;
  longitude: number;
}

export interface District {
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

// District data for East African Community (EAC) countries
export const districtsByCountry: Record<string, District[]> = {
  RW: [ // Rwanda
    { name: 'Gasabo', coordinates: { lat: -1.9156, lng: 30.1206 } },
  { name: 'Kicukiro', coordinates: { lat: -1.9900, lng: 30.0944 } },
  { name: 'Nyarugenge', coordinates: { lat: -1.9501, lng: 30.0588 } },
  { name: 'Burera', coordinates: { lat: -1.4100, lng: 29.8200 } },
  { name: 'Gakenke', coordinates: { lat: -1.6931, lng: 29.7845 } },
  { name: 'Gicumbi', coordinates: { lat: -1.5833, lng: 30.0667 } },
  { name: 'Musanze', coordinates: { lat: -1.4992, lng: 29.6339 } },
  { name: 'Rulindo', coordinates: { lat: -1.6833, lng: 29.9833 } },
  { name: 'Gisagara', coordinates: { lat: -2.6012, lng: 29.8532 } },
  { name: 'Huye', coordinates: { lat: -2.5967, lng: 29.7392 } },
  { name: 'Kamonyi', coordinates: { lat: -2.0464, lng: 29.7936 } },
  { name: 'Muhanga', coordinates: { lat: -2.0744, lng: 29.7564 } },
  { name: 'Nyanza', coordinates: { lat: -2.3494, lng: 29.7500 } },
  { name: 'Nyaruguru', coordinates: { lat: -2.6188, lng: 29.5736 } },
  { name: 'Ruhango', coordinates: { lat: -2.2433, lng: 29.7800 } },
  { name: 'Bugesera', coordinates: { lat: -2.1596, lng: 30.1860 } },
  { name: 'Gatsibo', coordinates: { lat: -1.6700, lng: 30.4667 } },
  { name: 'Kayonza', coordinates: { lat: -1.8500, lng: 30.6667 } },
  { name: 'Kirehe', coordinates: { lat: -2.2639, lng: 30.6964 } },
  { name: 'Ngoma', coordinates: { lat: -2.1569, lng: 30.5414 } },
  { name: 'Nyagatare', coordinates: { lat: -1.3175, lng: 30.3178 } },
  { name: 'Rwamagana', coordinates: { lat: -1.9486, lng: 30.4347 } },
  { name: 'Karongi', coordinates: { lat: -2.0603, lng: 29.3481 } },
  { name: 'Ngororero', coordinates: { lat: -1.8639, lng: 29.6183 } },
  { name: 'Nyabihu', coordinates: { lat: -1.6333, lng: 29.4667 } },
  { name: 'Nyamasheke', coordinates: { lat: -2.3881, lng: 29.0306 } },
  { name: 'Rubavu', coordinates: { lat: -1.7025, lng: 29.2564 } },
  { name: 'Rusizi', coordinates: { lat: -2.4846, lng: 28.9075 } },
  { name: 'Rutsiro', coordinates: { lat: -1.9481, lng: 29.3308 } }
    ],
  BI: [ // Burundi
    { name: 'Bujumbura', coordinates: { lat: -3.3761, lng: 29.3600 } },
    { name: 'Gitega', coordinates: { lat: -3.4271, lng: 29.9246 } },
    { name: 'Ngozi', coordinates: { lat: -2.9077, lng: 29.8307 } },
    { name: 'Muyinga', coordinates: { lat: -2.8451, lng: 30.3415 } },
    { name: 'Bururi', coordinates: { lat: -3.9494, lng: 29.6244 } },
    { name: 'Cibitoke', coordinates: { lat: -2.8867, lng: 29.1243 } },
    { name: 'Makamba', coordinates: { lat: -4.1348, lng: 29.8040 } },
    { name: 'Rumonge', coordinates: { lat: -3.9736, lng: 29.4389 } },
    { name: 'Kayanza', coordinates: { lat: -2.9222, lng: 29.6289 } },
    { name: 'Rutana', coordinates: { lat: -3.9264, lng: 30.0003 } },
  ],
  KE: [ // Kenya
    { name: 'Nairobi', coordinates: { lat: -1.2921, lng: 36.8219 } },
    { name: 'Mombasa', coordinates: { lat: -4.0435, lng: 39.6682 } },
    { name: 'Kisumu', coordinates: { lat: -0.0917, lng: 34.7680 } },
    { name: 'Nakuru', coordinates: { lat: -0.3031, lng: 36.0800 } },
    { name: 'Eldoret', coordinates: { lat: 0.5143, lng: 35.2698 } },
    { name: 'Thika', coordinates: { lat: -1.0332, lng: 37.0693 } },
    { name: 'Malindi', coordinates: { lat: -3.2167, lng: 40.1167 } },
    { name: 'Kisii', coordinates: { lat: -0.6817, lng: 34.7680 } },
    { name: 'Kitale', coordinates: { lat: 1.0175, lng: 35.0061 } },
    { name: 'Garissa', coordinates: { lat: -0.4536, lng: 39.6401 } },
    { name: 'Kakamega', coordinates: { lat: 0.2827, lng: 34.7519 } },
    { name: 'Nyeri', coordinates: { lat: -0.4197, lng: 36.9475 } },
  ],
  TZ: [ // Tanzania
    { name: 'Dar es Salaam', coordinates: { lat: -6.7924, lng: 39.2083 } },
    { name: 'Dodoma', coordinates: { lat: -6.1630, lng: 35.7516 } },
    { name: 'Arusha', coordinates: { lat: -3.3869, lng: 36.6830 } },
    { name: 'Mwanza', coordinates: { lat: -2.5164, lng: 32.9175 } },
    { name: 'Zanzibar City', coordinates: { lat: -6.1659, lng: 39.2026 } },
    { name: 'Mbeya', coordinates: { lat: -8.9000, lng: 33.4500 } },
    { name: 'Morogoro', coordinates: { lat: -6.8211, lng: 37.6636 } },
    { name: 'Tanga', coordinates: { lat: -5.0689, lng: 39.0982 } },
    { name: 'Moshi', coordinates: { lat: -3.3397, lng: 37.3381 } },
    { name: 'Tabora', coordinates: { lat: -5.0167, lng: 32.8000 } },
    { name: 'Kigoma', coordinates: { lat: -4.8772, lng: 29.6269 } },
    { name: 'Iringa', coordinates: { lat: -7.7667, lng: 35.7000 } },
  ],
  UG: [ // Uganda
    { name: 'Kampala', coordinates: { lat: 0.3476, lng: 32.5825 } },
    { name: 'Entebbe', coordinates: { lat: 0.0568, lng: 32.4635 } },
    { name: 'Jinja', coordinates: { lat: 0.4244, lng: 33.2041 } },
    { name: 'Mbarara', coordinates: { lat: -0.6104, lng: 30.6595 } },
    { name: 'Gulu', coordinates: { lat: 2.7746, lng: 32.2989 } },
    { name: 'Lira', coordinates: { lat: 2.2499, lng: 32.8987 } },
    { name: 'Mbale', coordinates: { lat: 1.0821, lng: 34.1751 } },
    { name: 'Fort Portal', coordinates: { lat: 0.6710, lng: 30.2750 } },
    { name: 'Kasese', coordinates: { lat: 0.1833, lng: 30.0833 } },
    { name: 'Masaka', coordinates: { lat: -0.3378, lng: 31.7347 } },
    { name: 'Arua', coordinates: { lat: 3.0197, lng: 30.9108 } },
    { name: 'Soroti', coordinates: { lat: 1.7150, lng: 33.6111 } },
  ],
  CD: [ // DR Congo (Eastern regions close to EAC)
    { name: 'Goma', coordinates: { lat: -1.6740, lng: 29.2228 } },
    { name: 'Bukavu', coordinates: { lat: -2.5085, lng: 28.8473 } },
    { name: 'Uvira', coordinates: { lat: -3.3973, lng: 29.1378 } },
    { name: 'Beni', coordinates: { lat: 0.4914, lng: 29.4733 } },
    { name: 'Butembo', coordinates: { lat: 0.1414, lng: 29.2914 } },
    { name: 'Kinshasa', coordinates: { lat: -4.3217, lng: 15.3125 } },
    { name: 'Lubumbashi', coordinates: { lat: -11.6609, lng: 27.4794 } },
    { name: 'Kisangani', coordinates: { lat: 0.5167, lng: 25.2000 } },
    { name: 'Kalemie', coordinates: { lat: -5.9475, lng: 29.1944 } },
  ],
  SS: [ // South Sudan
    { name: 'Juba', coordinates: { lat: 4.8517, lng: 31.5825 } },
    { name: 'Malakal', coordinates: { lat: 9.5334, lng: 31.6500 } },
    { name: 'Wau', coordinates: { lat: 7.7028, lng: 27.9944 } },
    { name: 'Yei', coordinates: { lat: 4.0903, lng: 30.6783 } },
    { name: 'Bor', coordinates: { lat: 6.2067, lng: 31.5589 } },
    { name: 'Nimule', coordinates: { lat: 3.5978, lng: 32.0631 } },
    { name: 'Yambio', coordinates: { lat: 4.5717, lng: 28.3917 } },
  ],
  SO: [ // Somalia
    { name: 'Mogadishu', coordinates: { lat: 2.0469, lng: 45.3182 } },
    { name: 'Hargeisa', coordinates: { lat: 9.5600, lng: 44.0650 } },
    { name: 'Kismayo', coordinates: { lat: -0.3582, lng: 42.5454 } },
    { name: 'Berbera', coordinates: { lat: 10.4396, lng: 45.0143 } },
    { name: 'Merca', coordinates: { lat: 1.7155, lng: 44.7705 } },
    { name: 'Baidoa', coordinates: { lat: 3.1139, lng: 43.6498 } },
    { name: 'Bosaso', coordinates: { lat: 11.2842, lng: 49.1816 } },
    { name: 'Garowe', coordinates: { lat: 8.4019, lng: 48.4845 } },
  ],
};

// Country names mapping (East African Community countries)
export const countryNames: Record<string, string> = {
  RW: 'Rwanda',
  BI: 'Burundi',
  KE: 'Kenya',
  TZ: 'Tanzania',
  UG: 'Uganda',
  CD: 'DR Congo',
  SS: 'South Sudan',
  SO: 'Somalia',
  // Additional neighboring countries
  ET: 'Ethiopia',
  ZA: 'South Africa',
  NG: 'Nigeria',
  GH: 'Ghana',
  // International (if needed)
  US: 'United States',
  GB: 'United Kingdom',
  FR: 'France',
  DE: 'Germany',
  ES: 'Spain',
  IT: 'Italy',
  CA: 'Canada',
  AU: 'Australia',
};

/**
 * Get user's location using browser Geolocation API
 */
export const getUserLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Get country from coordinates using reverse geocoding
 * This is a simplified version - in production, you'd want to use a proper geocoding API
 */
export const getCountryFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<{ country: string; countryCode: string }> => {
  try {
    // Using OpenStreetMap's Nominatim API (free, but rate-limited)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=3&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'AmoriaConnekyt/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }

    const data = await response.json();
    const countryCode = data.address?.country_code?.toUpperCase() || 'US';
    const country = data.address?.country || countryNames[countryCode] || 'United States';

    return { country, countryCode };
  } catch (error) {
    console.error('Error fetching country:', error);
    // Default to US if geocoding fails
    return { country: 'United States', countryCode: 'US' };
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Find the nearest district based on user's coordinates
 */
export const findNearestDistrict = (
  latitude: number,
  longitude: number,
  countryCode: string
): string => {
  const districts = districtsByCountry[countryCode];

  if (!districts || districts.length === 0) {
    return 'All Districts';
  }

  let nearestDistrict = districts[0];
  let minDistance = calculateDistance(
    latitude,
    longitude,
    districts[0].coordinates.lat,
    districts[0].coordinates.lng
  );

  for (let i = 1; i < districts.length; i++) {
    const distance = calculateDistance(
      latitude,
      longitude,
      districts[i].coordinates.lat,
      districts[i].coordinates.lng
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestDistrict = districts[i];
    }
  }

  return nearestDistrict.name;
};

/**
 * Detect user's location and return formatted location data
 */
export const detectUserLocation = async (): Promise<LocationData> => {
  try {
    const position = await getUserLocation();
    const { latitude, longitude } = position.coords;

    const { country, countryCode } = await getCountryFromCoordinates(latitude, longitude);
    const district = findNearestDistrict(latitude, longitude, countryCode);

    return {
      country,
      countryCode,
      district,
      latitude,
      longitude,
    };
  } catch (error) {
    console.error('Error detecting location:', error);
    // Return default location if detection fails
    return {
      country: 'United States',
      countryCode: 'US',
      district: 'All Districts',
      latitude: 0,
      longitude: 0,
    };
  }
};

/**
 * Get list of districts for a specific country
 */
export const getDistrictsForCountry = (countryCode: string): string[] => {
  const districts = districtsByCountry[countryCode];
  return districts ? districts.map((d) => d.name) : ['All Districts'];
};

/**
 * Get all supported countries
 */
export const getSupportedCountries = (): { code: string; name: string }[] => {
  return Object.keys(districtsByCountry).map((code) => ({
    code,
    name: countryNames[code] || code,
  }));
};

/**
 * Save location to localStorage
 */
export const saveLocationToStorage = (location: LocationData): void => {
  try {
    localStorage.setItem('userLocation', JSON.stringify(location));
  } catch (error) {
    console.error('Error saving location to storage:', error);
  }
};

/**
 * Get location from localStorage
 */
export const getLocationFromStorage = (): LocationData | null => {
  try {
    const stored = localStorage.getItem('userLocation');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting location from storage:', error);
    return null;
  }
};

/**
 * Search for countries by name
 */
export const searchCountries = (query: string): { code: string; name: string }[] => {
  if (!query || query.trim() === '') {
    return getSupportedCountries();
  }

  const lowerQuery = query.toLowerCase().trim();
  return getSupportedCountries().filter((country) =>
    country.name.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Search for districts/cities within a country or across all countries
 */
export const searchDistricts = (query: string, countryCode?: string): Array<{
  district: string;
  country: string;
  countryCode: string;
}> => {
  if (!query || query.trim() === '') {
    return [];
  }

  const lowerQuery = query.toLowerCase().trim();
  const results: Array<{ district: string; country: string; countryCode: string }> = [];

  // If countryCode is provided, search only in that country
  if (countryCode && districtsByCountry[countryCode]) {
    districtsByCountry[countryCode].forEach((district) => {
      if (district.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          district: district.name,
          country: countryNames[countryCode],
          countryCode,
        });
      }
    });
  } else {
    // Search across all countries
    Object.keys(districtsByCountry).forEach((code) => {
      districtsByCountry[code].forEach((district) => {
        if (district.name.toLowerCase().includes(lowerQuery)) {
          results.push({
            district: district.name,
            country: countryNames[code],
            countryCode: code,
          });
        }
      });
    });
  }

  return results;
};

/**
 * Combined search for both countries and districts
 */
export const searchLocations = (query: string): {
  countries: Array<{ code: string; name: string }>;
  districts: Array<{ district: string; country: string; countryCode: string }>;
} => {
  return {
    countries: searchCountries(query),
    districts: searchDistricts(query),
  };
};

// Location data structure for East African countries
export interface District {
  name: string;
  code: string;
}

export interface Province {
  name: string;
  code: string;
  districts: District[];
}

export interface Country {
  name: string;
  code: string;
  provinces: Province[];
}

export interface LocationData {
  country: string;
  countryCode: string;
  province: string;
  provinceCode: string;
  district: string;
  districtCode: string;
}

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
}

// Location data for East African countries
export const LOCATION_DATA: Country[] = [
  {
    name: 'Rwanda',
    code: 'RW',
    provinces: [
      {
        name: 'Kigali City',
        code: 'KGL',
        districts: [
          { name: 'Gasabo', code: 'GSB' },
          { name: 'Kicukiro', code: 'KCK' },
          { name: 'Nyarugenge', code: 'NYR' }
        ]
      },
      {
        name: 'Northern Province',
        code: 'NTH',
        districts: [
          { name: 'Musanze', code: 'MSZ' },
          { name: 'Gicumbi', code: 'GCM' },
          { name: 'Gakenke', code: 'GKE' },
          { name: 'Rulindo', code: 'RLD' },
          { name: 'Burera', code: 'BUR' }
        ]
      },
      {
        name: 'Southern Province',
        code: 'STH',
        districts: [
          { name: 'Huye', code: 'HUY' },
          { name: 'Nyanza', code: 'NYZ' },
          { name: 'Muhanga', code: 'MHG' },
          { name: 'Ruhango', code: 'RHG' },
          { name: 'Kamonyi', code: 'KMY' },
          { name: 'Nyamagabe', code: 'NYM' },
          { name: 'Nyaruguru', code: 'NYU' },
          { name: 'Gisagara', code: 'GSG' }
        ]
      },
      {
        name: 'Western Province',
        code: 'WST',
        districts: [
          { name: 'Rubavu', code: 'RBV' },
          { name: 'Rusizi', code: 'RSZ' },
          { name: 'Nyamasheke', code: 'NYS' },
          { name: 'Rutsiro', code: 'RTS' },
          { name: 'Karongi', code: 'KRG' },
          { name: 'Ngororero', code: 'NGR' },
          { name: 'Nyabihu', code: 'NYB' }
        ]
      },
      {
        name: 'Eastern Province',
        code: 'EST',
        districts: [
          { name: 'Rwamagana', code: 'RWM' },
          { name: 'Nyagatare', code: 'NYG' },
          { name: 'Gatsibo', code: 'GTB' },
          { name: 'Kayonza', code: 'KYZ' },
          { name: 'Kirehe', code: 'KRH' },
          { name: 'Ngoma', code: 'NGM' },
          { name: 'Bugesera', code: 'BGS' }
        ]
      }
    ]
  },
  {
    name: 'Kenya',
    code: 'KE',
    provinces: [
      {
        name: 'Nairobi County',
        code: 'NRB',
        districts: [
          { name: 'Nairobi Central', code: 'NRBC' },
          { name: 'Westlands', code: 'WST' },
          { name: 'Kibra', code: 'KBR' },
          { name: 'Embakasi', code: 'EMB' }
        ]
      },
      {
        name: 'Mombasa County',
        code: 'MBA',
        districts: [
          { name: 'Mombasa Island', code: 'MBI' },
          { name: 'Likoni', code: 'LKN' },
          { name: 'Changamwe', code: 'CHG' }
        ]
      },
      {
        name: 'Kisumu County',
        code: 'KSM',
        districts: [
          { name: 'Kisumu Central', code: 'KSMC' },
          { name: 'Kisumu East', code: 'KSME' },
          { name: 'Kisumu West', code: 'KSMW' }
        ]
      }
    ]
  },
  {
    name: 'Uganda',
    code: 'UG',
    provinces: [
      {
        name: 'Central Region',
        code: 'CTR',
        districts: [
          { name: 'Kampala', code: 'KMP' },
          { name: 'Wakiso', code: 'WKS' },
          { name: 'Mukono', code: 'MKN' },
          { name: 'Mpigi', code: 'MPG' }
        ]
      },
      {
        name: 'Western Region',
        code: 'WST',
        districts: [
          { name: 'Kasese', code: 'KSE' },
          { name: 'Mbarara', code: 'MBR' },
          { name: 'Fort Portal', code: 'FTP' }
        ]
      }
    ]
  },
  {
    name: 'Tanzania',
    code: 'TZ',
    provinces: [
      {
        name: 'Dar es Salaam',
        code: 'DSM',
        districts: [
          { name: 'Ilala', code: 'ILL' },
          { name: 'Kinondoni', code: 'KND' },
          { name: 'Temeke', code: 'TMK' }
        ]
      },
      {
        name: 'Arusha',
        code: 'ARU',
        districts: [
          { name: 'Arusha City', code: 'ARUC' },
          { name: 'Meru', code: 'MRU' }
        ]
      }
    ]
  },
  {
    name: 'Burundi',
    code: 'BI',
    provinces: [
      {
        name: 'Bujumbura Mairie',
        code: 'BJM',
        districts: [
          { name: 'Mukaza', code: 'MKZ' },
          { name: 'Muha', code: 'MHA' },
          { name: 'Ntahangwa', code: 'NTH' }
        ]
      },
      {
        name: 'Gitega',
        code: 'GTG',
        districts: [
          { name: 'Gitega', code: 'GTG' },
          { name: 'Makebuko', code: 'MKB' }
        ]
      }
    ]
  }
];

// Get all countries
export const getCountries = (): Country[] => {
  return LOCATION_DATA;
};

// Get provinces for a specific country
export const getProvincesForCountry = (countryCode: string): Province[] => {
  const country = LOCATION_DATA.find(c => c.code === countryCode);
  return country ? country.provinces : [];
};

// Get districts for a specific province
export const getDistrictsForProvince = (countryCode: string, provinceCode: string): District[] => {
  const country = LOCATION_DATA.find(c => c.code === countryCode);
  if (!country) return [];

  const province = country.provinces.find(p => p.code === provinceCode);
  return province ? province.districts : [];
};

// Get all districts for a country (flat list)
export const getDistrictsForCountry = (countryCode: string): string[] => {
  const country = LOCATION_DATA.find(c => c.code === countryCode);
  if (!country) return [];

  const districts: string[] = [];
  country.provinces.forEach(province => {
    province.districts.forEach(district => {
      districts.push(district.name);
    });
  });

  return districts;
};

// Save location to localStorage
export const saveLocationToStorage = (location: LocationData): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userLocation', JSON.stringify(location));
  }
};

// Get location from localStorage
export const getLocationFromStorage = (): LocationData | null => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('userLocation');
    return stored ? JSON.parse(stored) : null;
  }
  return null;
};

// Clear location from localStorage
export const clearLocationFromStorage = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userLocation');
  }
};

// Get user's geolocation using browser API
export const getUserGeolocation = (): Promise<GeolocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
};

// Detect location based on coordinates (simplified - in production, use a geocoding API)
export const detectLocationFromCoordinates = async (
  coords: GeolocationCoordinates
): Promise<LocationData | null> => {
  // Rwanda approximate boundaries
  if (
    coords.latitude >= -2.9 && coords.latitude <= -1.0 &&
    coords.longitude >= 28.8 && coords.longitude <= 30.9
  ) {
    // Simplified: detect if in Kigali area
    if (
      coords.latitude >= -2.0 && coords.latitude <= -1.85 &&
      coords.longitude >= 29.9 && coords.longitude <= 30.2
    ) {
      return {
        country: 'Rwanda',
        countryCode: 'RW',
        province: 'Kigali City',
        provinceCode: 'KGL',
        district: 'Gasabo',
        districtCode: 'GSB'
      };
    }
    // Default to Rwanda, Kigali
    return {
      country: 'Rwanda',
      countryCode: 'RW',
      province: 'Kigali City',
      provinceCode: 'KGL',
      district: 'Gasabo',
      districtCode: 'GSB'
    };
  }

  // Kenya approximate boundaries (Nairobi)
  if (
    coords.latitude >= -1.5 && coords.latitude <= -1.0 &&
    coords.longitude >= 36.5 && coords.longitude <= 37.2
  ) {
    return {
      country: 'Kenya',
      countryCode: 'KE',
      province: 'Nairobi County',
      provinceCode: 'NRB',
      district: 'Nairobi Central',
      districtCode: 'NRBC'
    };
  }

  // Uganda approximate boundaries (Kampala)
  if (
    coords.latitude >= 0.0 && coords.latitude <= 0.5 &&
    coords.longitude >= 32.3 && coords.longitude <= 32.8
  ) {
    return {
      country: 'Uganda',
      countryCode: 'UG',
      province: 'Central Region',
      provinceCode: 'CTR',
      district: 'Kampala',
      districtCode: 'KMP'
    };
  }

  // Tanzania approximate boundaries (Dar es Salaam)
  if (
    coords.latitude >= -7.0 && coords.latitude <= -6.5 &&
    coords.longitude >= 39.0 && coords.longitude <= 39.5
  ) {
    return {
      country: 'Tanzania',
      countryCode: 'TZ',
      province: 'Dar es Salaam',
      provinceCode: 'DSM',
      district: 'Ilala',
      districtCode: 'ILL'
    };
  }

  // Burundi approximate boundaries (Bujumbura)
  if (
    coords.latitude >= -3.5 && coords.latitude <= -3.0 &&
    coords.longitude >= 29.0 && coords.longitude <= 29.5
  ) {
    return {
      country: 'Burundi',
      countryCode: 'BI',
      province: 'Bujumbura Mairie',
      provinceCode: 'BJM',
      district: 'Mukaza',
      districtCode: 'MKZ'
    };
  }

  return null;
};

// Parse location string (e.g., "BK Arena - KN 4 Ave, Kigali")
export const parseLocationString = (locationString: string): {
  city?: string;
  district?: string;
  country?: string;
} => {
  const parts = locationString.split(',').map(part => part.trim());

  const result: {
    city?: string;
    district?: string;
    country?: string;
  } = {};

  // Try to extract country
  const countryMatch = parts.find(part =>
    LOCATION_DATA.some(country =>
      part.toLowerCase().includes(country.name.toLowerCase())
    )
  );
  if (countryMatch) {
    result.country = countryMatch;
  }

  // Try to extract city/district
  if (parts.length > 0) {
    result.city = parts[parts.length - 1];
  }

  return result;
};

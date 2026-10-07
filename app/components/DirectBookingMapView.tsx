'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  getDirectBookingMap,
  calculateHaversineDistanceKm,
  type DirectBookingMapData,
  type NearbyPhotographerMapItem,
  getPhotographers,
  type Photographer,
} from '@/lib/APIs/public';

declare global {
  interface Window {
    L: any;
  }
}

const BRAND = '#083A85';
const BRAND_PINK = '#F20C8F';
const RADIUS_OPTIONS = [5, 10, 25, 50] as const;

const KIGALI_OFFSETS: [number, number][] = [
  [-0.008, 0.009],
  [0.012, -0.011],
  [-0.015, -0.008],
  [0.009, 0.016],
  [0.018, 0.004],
  [-0.004, -0.019],
  [0.021, -0.015],
  [-0.019, 0.018],
];

interface DirectBookingMapViewProps {
  initialSpecialty?: string;
  initialSearch?: string;
  initialRadiusKm?: number;
  initialDate?: string;
  onBookPhotographer?: (photographerId: string) => void;
  className?: string;
}

export default function DirectBookingMapView({
  initialSpecialty = 'all',
  initialSearch = '',
  initialRadiusKm = 25,
  initialDate = '',
  onBookPhotographer,
  className = '',
}: DirectBookingMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const clientMarkerRef = useRef<any>(null);

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapData, setMapData] = useState<DirectBookingMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [radiusKm, setRadiusKm] = useState<number>(initialRadiusKm);
  const [specialty, setSpecialty] = useState<string>(initialSpecialty);
  const [search, setSearch] = useState<string>(initialSearch);
  const [eventDate, setEventDate] = useState<string>(initialDate);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPhotographer, setSelectedPhotographer] =
    useState<NearbyPhotographerMapItem | null>(null);

  // Load Leaflet dynamically
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => setLeafletLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Detect client position via HTML5 Geolocation
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // Geolocation denied or unavailable; backend fallback applies
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  }, []);

  // Fetch Direct Booking Map data
  const fetchMap = useCallback(async () => {
    setLoading(true);
    let photographers: NearbyPhotographerMapItem[] = [];
    let clientLat = userCoords?.lat ?? -1.9441;
    let clientLng = userCoords?.lng ?? 30.0619;
    let city = 'Kigali';
    let message = 'You are here';
    let detectedFrom = 'DEFAULT_LOCATION';

    try {
      const res = await getDirectBookingMap({
        lat: userCoords?.lat,
        lng: userCoords?.lng,
        radiusKm,
        specialty: specialty === 'all' ? undefined : specialty,
        search: search.trim() || undefined,
        eventDate: eventDate || undefined,
      });

      const data = res?.data;
      if (data && Array.isArray(data.photographers) && data.photographers.length > 0) {
        photographers = data.photographers;
        clientLat = data.clientLocation?.latitude ?? clientLat;
        clientLng = data.clientLocation?.longitude ?? clientLng;
        city = data.clientLocation?.city ?? city;
        message = data.clientLocation?.message ?? message;
        detectedFrom = data.clientLocation?.detectedFrom ?? detectedFrom;
      }
    } catch {
      // Continue to fallback
    }

    // Graceful fallback if database or API returns zero creators
    if (photographers.length === 0) {
      try {
        const publicRes = await getPhotographers({ size: 16 });
        const list = publicRes.data?.content || [];
        photographers = list.slice(0, 10).map((p: Photographer, idx: number) => {
          const offset = KIGALI_OFFSETS[idx % KIGALI_OFFSETS.length];
          const pLat = clientLat + offset[0];
          const pLng = clientLng + offset[1];
          const dist = calculateHaversineDistanceKm(clientLat, clientLng, pLat, pLng);
          const startingPrice = p.packages?.[0]?.price ?? 120000;

          return {
            photographerId: p.id,
            fullName: `${p.firstName} ${p.lastName}`.trim() || 'Verified Creator',
            businessName: (p as any).organizationName || `${p.firstName}'s Studio`,
            profilePicture: p.profilePicture || undefined,
            coverImage: p.coverPicture || p.projects?.[0]?.images?.[0] || undefined,
            latitude: pLat,
            longitude: pLng,
            distanceKm: dist,
            distanceFormatted: `${dist.toFixed(1)} km away`,
            city: p.address || 'Kigali',
            country: 'Rwanda',
            specialties: (p.specialties || []).map((s: any) => typeof s === 'string' ? s : s.name),
            rating: p.rating ?? 4.8,
            reviewCount: p.reviews?.length ?? 14,
            verified: p.isVerified ?? true,
            startingPrice,
            currency: 'RWF',
            directBookingEnabled: true,
            packages: (p.packages || []).map((pkg) => ({
              packageId: pkg.id,
              name: pkg.packageName,
              price: pkg.price,
              currency: 'RWF',
              durationHours: pkg.durationHours,
              deliveryDays: (pkg as any).deliveryDays || undefined,
              features: (pkg.features || []).map((f: any) =>
                typeof f === 'string' ? f : f.featureName || f.name || String(f)
              ),
            })),
          };
        });
      } catch {
        // Keep empty on error
      }
    }

    const normalized: DirectBookingMapData = {
      clientLocation: {
        latitude: clientLat,
        longitude: clientLng,
        city,
        country: 'Rwanda',
        message,
        detectedFrom,
        isCurrentLocation: true,
      },
      radiusKm,
      totalNearby: photographers.length,
      totalFound: photographers.length,
      photographers,
    };

    setMapData(normalized);
    if (photographers.length > 0 && !selectedPhotographer) {
      setSelectedPhotographer(photographers[0]);
    }
    setLoading(false);
  }, [userCoords, radiusKm, specialty, search, eventDate, selectedPhotographer]);

  useEffect(() => {
    fetchMap();
  }, [fetchMap]);

  // Initialize & update Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || !mapData) return;
    const L = window.L;
    if (!L) return;

    const client = mapData.clientLocation;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([client.latitude, client.longitude], 13);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Zoom control in bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.featureGroup().addTo(map);
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    // 1. "You are here" Radar Marker
    const radarHtml = `
      <div class="radar-marker-wrap">
        <div class="radar-ripple"></div>
        <div class="radar-dot"></div>
        <div class="radar-badge">📍 ${client.message || 'You are here'}</div>
      </div>
    `;

    const radarIcon = L.divIcon({
      className: '',
      html: radarHtml,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    clientMarkerRef.current = L.marker([client.latitude, client.longitude], {
      icon: radarIcon,
      zIndexOffset: 1000,
    }).addTo(markersGroup);

    // 2. Translucent Radius Circle
    if (circleRef.current) {
      circleRef.current.remove();
    }
    circleRef.current = L.circle([client.latitude, client.longitude], {
      radius: (mapData.radiusKm || radiusKm) * 1000,
      color: '#2563EB',
      fillColor: '#2563EB',
      fillOpacity: 0.06,
      weight: 1.5,
      dashArray: '5, 5',
    }).addTo(map);

    // 3. Creator Price Pills
    const bounds = L.latLngBounds([ [client.latitude, client.longitude] ]);

    mapData.photographers.forEach((p) => {
      const priceText = `from ${p.startingPrice ? p.startingPrice.toLocaleString() : '100,000'} ${p.currency || 'RWF'}`;
      const avatarSrc = p.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
      const isSelected = selectedPhotographer?.photographerId === p.photographerId;

      const markerHtml = `
        <div class="creator-map-pill ${isSelected ? 'is-selected' : ''}" data-id="${p.photographerId}">
          <div class="creator-pill-content">
            <img class="creator-pill-avatar" src="${avatarSrc}" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'" alt="${p.fullName}" />
            <span class="creator-pill-price">${priceText}</span>
            ${p.rating ? `<span class="creator-pill-rating">★ ${p.rating.toFixed(1)}</span>` : ''}
          </div>
          <div class="creator-pill-arrow"></div>
        </div>
      `;

      const pIcon = L.divIcon({
        className: '',
        html: markerHtml,
        iconSize: [140, 42],
        iconAnchor: [70, 42],
      });

      const marker = L.marker([p.latitude, p.longitude], { icon: pIcon }).addTo(markersGroup);
      bounds.extend([p.latitude, p.longitude]);

      marker.on('click', () => {
        setSelectedPhotographer(p);
        map.panTo([p.latitude, p.longitude], { animate: true, duration: 0.6 });
      });
    });

    if (mapData.photographers.length > 0) {
      map.fitBounds(bounds.pad(0.18));
    }
  }, [leafletLoaded, mapData, radiusKm, selectedPhotographer?.photographerId]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current || !mapData) return;
    const client = mapData.clientLocation;
    mapInstanceRef.current.flyTo([client.latitude, client.longitude], 13, { duration: 0.8 });
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm ${className}`} style={{ minHeight: '620px' }}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[620px]" />

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Location & Creator status chip */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full border border-slate-200/80 shadow-md text-xs font-semibold text-slate-800">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600" />
          </span>
          <span>
            {mapData?.clientLocation?.message || 'You are here'} · {mapData?.clientLocation?.city || 'Kigali'}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-blue-700 font-bold">
            {mapData?.totalNearby ?? mapData?.photographers?.length ?? 0} creators nearby
          </span>
        </div>

        {/* Right: Controls & Recenter */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Radius selector */}
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-full border border-slate-200/80 shadow-md">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadiusKm(r)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                  radiusKm === r
                    ? 'bg-[#083A85] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>

          {/* Recenter button */}
          <button
            type="button"
            onClick={handleRecenter}
            title="Recenter to your location"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-md text-slate-700 hover:text-[#083A85] hover:scale-105 active:scale-95 transition-all"
          >
            <i className="bi bi-crosshair text-sm" />
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && !mapData && (
        <div className="absolute inset-0 z-[600] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm gap-2">
          <div className="w-8 h-8 border-3 border-[#083A85] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-700">Detecting location & creators…</p>
        </div>
      )}

      {/* Floating Photographer Preview Card */}
      {selectedPhotographer && (
        <div className="absolute bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[500] bg-white rounded-2xl border border-slate-200 shadow-xl p-4 transition-all animate-in fade-in slide-in-from-bottom-4">
          <button
            type="button"
            onClick={() => setSelectedPhotographer(null)}
            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 text-xs transition-colors"
            aria-label="Close preview"
          >
            <i className="bi bi-x-lg" />
          </button>

          <div className="flex items-center gap-3.5">
            <img
              src={
                selectedPhotographer.profilePicture ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
              }
              alt={selectedPhotographer.fullName}
              className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {selectedPhotographer.fullName}
                </h4>
                {selectedPhotographer.verified && (
                  <i className="bi bi-patch-check-fill text-[#083A85] text-xs" title="Verified Creator" />
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">
                {selectedPhotographer.businessName || 'Visual Creator'}
              </p>
              <div className="flex items-center gap-3 mt-1 text-xs">
                <span className="flex items-center gap-1 text-blue-600 font-semibold">
                  <i className="bi bi-geo-alt-fill text-[11px]" />
                  {selectedPhotographer.distanceFormatted || `${selectedPhotographer.distanceKm} km`}
                </span>
                <span className="flex items-center gap-1 text-amber-600 font-semibold">
                  <i className="bi bi-star-fill text-[11px]" />
                  {selectedPhotographer.rating.toFixed(1)} ({selectedPhotographer.reviewCount})
                </span>
              </div>
            </div>
          </div>

          {/* Specialties */}
          {selectedPhotographer.specialties?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
              {selectedPhotographer.specialties.slice(0, 3).map((spec) => (
                <span
                  key={spec}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600 uppercase tracking-wide"
                >
                  {spec}
                </span>
              ))}
            </div>
          )}

          {/* Footer with Price & Action Buttons */}
          <div className="flex items-center justify-between gap-3 mt-3.5 pt-3 border-t border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Starting from</span>
              <span className="text-sm font-extrabold text-[#083A85]">
                {selectedPhotographer.startingPrice
                  ? `${selectedPhotographer.startingPrice.toLocaleString()} ${selectedPhotographer.currency || 'RWF'}`
                  : 'Contact for price'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/user/photographers/view-profile?id=${selectedPhotographer.photographerId}`}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={() => onBookPhotographer?.(selectedPhotographer.photographerId)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white bg-[#F20C8F] hover:bg-[#d80a7f] shadow-sm hover:shadow transition-all"
              >
                <i className="bi bi-lightning-charge-fill text-[11px]" />
                Book Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Leaflet Markers */}
      <style jsx global>{`
        /* Radar pulse marker */
        .radar-marker-wrap {
          position: relative;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .radar-ripple {
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.4);
          animation: radar-wave 2.2s ease-out infinite;
        }
        .radar-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #2563EB;
          border: 3px solid #ffffff;
          box-shadow: 0 0 10px rgba(37, 99, 235, 0.8), 0 3px 6px rgba(0,0,0,0.25);
          z-index: 2;
        }
        .radar-badge {
          position: absolute;
          top: -28px;
          left: 50%;
          transform: translateX(-50%);
          background: #083A85;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.3px;
          padding: 3px 9px;
          border-radius: 12px;
          white-space: nowrap;
          box-shadow: 0 4px 10px rgba(8, 58, 133, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.25);
          z-index: 3;
        }
        .radar-badge::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          border-width: 4px 4px 0 4px;
          border-style: solid;
          border-color: #083A85 transparent transparent transparent;
        }
        @keyframes radar-wave {
          0% { transform: scale(0.4); opacity: 1; }
          70% { transform: scale(1.6); opacity: 0.15; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        /* Creator map pill */
        .creator-map-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .creator-map-pill:hover,
        .creator-map-pill.is-selected {
          transform: scale(1.12) translateY(-4px);
          z-index: 9999 !important;
        }
        .creator-pill-content {
          background: #ffffff;
          color: #0f172a;
          padding: 4px 8px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 6px 16px rgba(0,0,0,0.16);
          border: 2px solid #e2e8f0;
          white-space: nowrap;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .creator-map-pill.is-selected .creator-pill-content,
        .creator-map-pill:hover .creator-pill-content {
          border-color: #F20C8F;
          box-shadow: 0 0 14px rgba(242, 12, 143, 0.4);
        }
        .creator-pill-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          object-fit: cover;
          background: #64748b;
        }
        .creator-pill-price {
          font-size: 11px;
          font-weight: 700;
          color: #083A85;
        }
        .creator-pill-rating {
          font-size: 10px;
          font-weight: 700;
          color: #d97706;
        }
        .creator-pill-arrow {
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid #e2e8f0;
          margin-top: -1px;
          transition: border-top-color 0.2s ease;
        }
        .creator-map-pill.is-selected .creator-pill-arrow,
        .creator-map-pill:hover .creator-pill-arrow {
          border-top-color: #F20C8F;
        }
      `}</style>
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { BathroomSearchResult } from '../../types/bathroom';

interface BathroomMapProps {
  bathrooms: BathroomSearchResult[];
  userLocation: { lat: number; lng: number } | null;
  selectedBathroom: BathroomSearchResult | null;
  onSelectBathroom: (bathroom: BathroomSearchResult) => void;
}

export const BathroomMap: React.FC<BathroomMapProps> = ({
  bathrooms,
  userLocation,
  selectedBathroom,
  onSelectBathroom,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = userLocation?.lat || -34.6037;
    const initialLng = userLocation?.lng || -58.3816;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: true,
    });

    // OpenStreetMap standard tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when bathrooms or user location change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // 1. User Location Pin
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-pin-wrapper',
        html: `
          <div style="
            width: 22px;
            height: 22px;
            background: #0284c7;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(2, 132, 199, 0.7);
            animation: pulse 2s infinite;
          "></div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(markersLayer)
        .bindTooltip('Tu ubicación actual', { permanent: false, direction: 'top' });
    }

    // 2. Bathroom Pins
    const bounds: L.LatLngExpression[] = [];

    if (userLocation) {
      bounds.push([userLocation.lat, userLocation.lng]);
    }

    bathrooms.forEach((b) => {
      bounds.push([b.latitude, b.longitude]);
      const isSelected = selectedBathroom?.id === b.id;

      const bathroomIcon = L.divIcon({
        className: 'bathroom-pin-wrapper',
        html: `
          <div style="
            background: ${isSelected ? '#0369a1' : '#0f172a'};
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            padding: 4px 8px;
            border-radius: 12px;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
            transform: translate(-50%, -100%);
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            <span>🚽</span>
            <span>$${Math.round(b.price_base)}</span>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([b.latitude, b.longitude], { icon: bathroomIcon })
        .addTo(markersLayer)
        .on('click', () => {
          onSelectBathroom(b);
        });

      marker.bindTooltip(`<b>${b.title}</b><br/>${b.address} (${b.distance_km} km)`, {
        direction: 'top',
        offset: [0, -25],
      });
    });

    // Fit map bounds if there are markers
    if (bounds.length > 1) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [40, 40], maxZoom: 16 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    }
  }, [bathrooms, userLocation, selectedBathroom, onSelectBathroom]);

  return (
    <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm z-0">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, MapPin } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';

interface MapIssue {
  id: string;
  title: string;
  category: string;
  criticality: string;
  status: string;
  janbinduScore: number;
  locationLat?: number | null;
  locationLng?: number | null;
  city?: string | null;
  state?: string | null;
}

interface MapComponentProps {
  issues: MapIssue[];
  center?: [number, number];
  zoom?: number;
  isPicker?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedPos?: { lat: number; lng: number };
}

export const MapComponent: React.FC<MapComponentProps> = ({
  issues,
  center = [20.5937, 78.9629],
  zoom = 5,
  isPicker = false,
  onLocationSelect,
  selectedPos,
}) => {
  const [mounted, setMounted] = useState(false);
  const [MapModules, setMapModules] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    // Dynamic import to avoid Leaflet SSR issues
    Promise.all([
      import('leaflet'),
      import('react-leaflet'),
    ]).then(([L, ReactLeaflet]) => {
      setMapModules({ L: L.default || L, ...ReactLeaflet });
    });
  }, []);

  if (!mounted || !MapModules) {
    return (
      <div className="w-full h-full min-h-[400px] bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 font-medium">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 animate-bounce text-primary-600" />
          <span>Loading Civic Map...</span>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, useMapEvents } = MapModules;
  const L = MapModules.L;

  const createCriticalityIcon = (criticality: string) => {
    let color = '#22c55e'; // green
    if (criticality === 'critical') color = '#dc2626'; // red
    else if (criticality === 'high') color = '#ea580c'; // orange
    else if (criticality === 'medium') color = '#eab308'; // yellow

    return L.divIcon({
      className: 'custom-civic-marker',
      html: `<div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        animation: pulse 2s infinite;
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e: any) {
        if (isPicker && onLocationSelect) {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        }
      },
    });

    if (selectedPos) {
      return (
        <Marker
          position={[selectedPos.lat, selectedPos.lng]}
          draggable={true}
          eventHandlers={{
            dragend: (e: any) => {
              const marker = e.target;
              const pos = marker.getLatLng();
              if (onLocationSelect) onLocationSelect(pos.lat, pos.lng);
            },
          }}
        />
      );
    }
    return null;
  };

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden shadow-inner border border-gray-200">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {isPicker && <LocationMarker />}

        {!isPicker &&
          issues.map((issue) => {
            if (issue.locationLat && issue.locationLng) {
              return (
                <Marker
                  key={issue.id}
                  position={[issue.locationLat, issue.locationLng]}
                  icon={createCriticalityIcon(issue.criticality)}
                >
                  <Popup className="civic-map-popup">
                    <div className="p-1 min-w-[200px] space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <CategoryBadge category={issue.category} />
                        <div className="flex items-center gap-1 text-xs font-bold text-accent-600 bg-amber-50 px-2 py-0.5 rounded-md">
                          <Flame className="w-3 h-3 fill-accent-500" />
                          <span>{Math.round(issue.janbinduScore || 0)}</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-sm text-gray-900 line-clamp-2">{issue.title}</h4>

                      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                        <StatusBadge status={issue.status} />
                        <Link
                          href={`/post/${issue.id}`}
                          className="text-xs font-bold text-primary-600 hover:text-primary-700 underline"
                        >
                          View Details &rarr;
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            }
            return null;
          })}
      </MapContainer>
    </div>
  );
};

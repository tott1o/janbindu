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
  selectedAddress?: string;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  issues,
  center = [20.5937, 78.9629],
  zoom = 5,
  isPicker = false,
  onLocationSelect,
  selectedPos,
  selectedAddress,
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
      <div className="w-full h-full min-h-[300px] bg-slate-100 rounded-2xl flex items-center justify-center text-gray-500 font-medium">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 animate-bounce text-primary-600" />
          <span>Loading Interactive Map...</span>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } = MapModules;
  const L = MapModules.L;

  // Custom icon for existing civic issues
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

  // Custom picker marker icon (distinct pin with pulse ring)
  const createPickerIcon = () => {
    return L.divIcon({
      className: 'custom-picker-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
          <div style="
            position: absolute;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(79, 70, 229, 0.25);
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            position: relative;
            background: #4f46e5;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 36],
      popupAnchor: [0, -36],
    });
  };

  // Helper component to smoothly flyTo and zoom when center coordinates change
  const MapPanController = ({
    targetCenter,
    targetZoom,
  }: {
    targetCenter: [number, number];
    targetZoom: number;
  }) => {
    const map = useMap();
    useEffect(() => {
      if (targetCenter && targetCenter[0] && targetCenter[1]) {
        map.flyTo(targetCenter, targetZoom, {
          animate: true,
          duration: 1.4,
        });
      }
    }, [targetCenter[0], targetCenter[1], targetZoom, map]);
    return null;
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e: any) {
        if (isPicker && onLocationSelect) {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        }
      },
    });

    if (selectedPos && selectedPos.lat && selectedPos.lng) {
      return (
        <Marker
          position={[selectedPos.lat, selectedPos.lng]}
          draggable={true}
          icon={createPickerIcon()}
          eventHandlers={{
            dragend: (e: any) => {
              const marker = e.target;
              const pos = marker.getLatLng();
              if (onLocationSelect) onLocationSelect(pos.lat, pos.lng);
            },
          }}
        >
          {selectedAddress && (
            <Popup autoPan={false}>
              <div className="text-xs p-1">
                <p className="font-bold text-primary-700">Selected Location</p>
                <p className="text-gray-600 text-[11px] mt-0.5 max-w-[200px] leading-tight">
                  {selectedAddress}
                </p>
                <span className="text-[10px] text-gray-400 block mt-1">Drag pin to adjust</span>
              </div>
            </Popup>
          )}
        </Marker>
      );
    }
    return null;
  };

  const activeCenter: [number, number] = selectedPos
    ? [selectedPos.lat, selectedPos.lng]
    : center;
  const activeZoom: number = selectedPos ? 16 : zoom;

  return (
    <div className="relative w-full h-full min-h-[350px] overflow-hidden">
      <MapContainer
        center={activeCenter}
        zoom={activeZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Dynamic smooth flyTo controller for all map modes */}
        <MapPanController targetCenter={activeCenter} targetZoom={activeZoom} />

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

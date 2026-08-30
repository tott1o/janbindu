'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapComponent } from '@/components/MapComponent';
import { CategorySelect } from '@/components/CategorySelect';
import { useAuth } from '@/context/AuthContext';
import {
  Loader2,
  Flame,
  LayoutGrid,
  MapPin,
  Plus,
  Search,
  Navigation,
  X,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface PlaceResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function CivicMapPage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Search & Place Geocoding
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [searchingPlace, setSearchingPlace] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Dynamic Map viewport state
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState<number>(5);

  // Auto-detect user GPS
  const detectUserLocation = useCallback(() => {
    if (user?.locationLat && user?.locationLng) {
      setMapCenter([user.locationLat, user.locationLng]);
      setMapZoom(13);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
          setMapZoom(13);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, [user]);

  useEffect(() => {
    detectUserLocation();
  }, [detectUserLocation]);

  // Click outside to close place autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '150',
      });

      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedStatus) params.append('status', selectedStatus);

      const res = await fetch(`/api/posts?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setIssues(data.posts || []);
      }
    } catch {
      toast.error('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [selectedCategory, selectedStatus]);

  /**
   * Forward Geocoding: Search places / landmarks and show dropdown
   */
  const handlePlaceSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || query.trim().length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setSearchingPlace(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query.trim()
        )}&addressdetails=1&limit=5&countrycodes=in`,
        {
          headers: { 'Accept-Language': 'en' },
        }
      );

      if (!res.ok) return;

      const data: PlaceResult[] = await res.json();
      setSearchResults(data);
      setShowSearchResults(true);
    } catch (err) {
      console.error('Place search error:', err);
    } finally {
      setSearchingPlace(false);
    }
  };

  /**
   * User selects place from autocomplete dropdown -> Zoom directly to location!
   */
  const handleSelectPlace = (place: PlaceResult) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);

    setMapCenter([lat, lng]);
    setMapZoom(16);
    setShowSearchResults(false);
    setSearchQuery(place.display_name.split(',')[0]);

    toast.success(`Zoomed to ${place.display_name.split(',')[0]}`);
  };

  /**
   * User presses Enter on place search
   */
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if any loaded issue matches by title/city first
    const matchedIssue = issues.find(
      (i) =>
        i.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (matchedIssue && matchedIssue.locationLat && matchedIssue.locationLng) {
      setMapCenter([matchedIssue.locationLat, matchedIssue.locationLng]);
      setMapZoom(16);
      setShowSearchResults(false);
      toast.success(`Zoomed to ${matchedIssue.city || matchedIssue.title}`);
      return;
    }

    // Otherwise geocode place via Nominatim
    try {
      setSearchingPlace(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&limit=1&countrycodes=in`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setMapCenter([lat, lng]);
        setMapZoom(16);
        setShowSearchResults(false);
        toast.success(`Zoomed to ${data[0].display_name.split(',')[0]}`);
      } else {
        toast.error('Location not found');
      }
    } catch {
      toast.error('Search failed');
    } finally {
      setSearchingPlace(false);
    }
  };

  const mappedIssues = issues.filter((i) => i.locationLat && i.locationLng);

  return (
    <div className="h-[calc(100vh-64px)] w-full relative flex flex-col overflow-hidden bg-slate-100">
      {/* Top Floating Filter & Place Search Bar Overlay */}
      <div className="absolute top-4 left-4 right-4 z-40 max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pointer-events-none">
        {/* Search & Category Filter Pills */}
        <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-gray-200/90 flex-1 flex flex-col sm:flex-row items-center gap-2 pointer-events-auto">
          {/* Place Search Box with Autocomplete Dropdown */}
          <div ref={searchContainerRef} className="relative flex-1 w-full">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="🔍 Search place to zoom (e.g. Bandra, Indiranagar, MG Road)..."
                value={searchQuery}
                onChange={(e) => handlePlaceSearch(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchResults(true);
                }}
                className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              {searchingPlace ? (
                <Loader2 className="w-3.5 h-3.5 text-primary-600 animate-spin absolute right-3 top-2.5" />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </form>

            {/* Place Autocomplete Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-200 py-1.5 z-50 max-h-60 overflow-y-auto animate-in fade-in-50 zoom-in-95">
                {searchResults.map((place) => (
                  <button
                    key={place.place_id}
                    type="button"
                    onClick={() => handleSelectPlace(place)}
                    className="w-full text-left px-3.5 py-2 hover:bg-primary-50 transition-colors flex items-start gap-2.5 border-b border-gray-50 last:border-0"
                  >
                    <MapPin className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-800 line-clamp-2 leading-relaxed">
                      {place.display_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="w-full sm:w-56">
            <CategorySelect
              value={selectedCategory}
              onChange={(cat) => setSelectedCategory(cat)}
              allowAll={true}
              placeholder="All Categories"
            />
          </div>
        </div>

        {/* GPS Recalibrate & Mapped Issues Count Badge */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={detectUserLocation}
            className="p-2.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl border border-gray-200/90 text-slate-700 hover:text-primary-600 hover:bg-white transition-all active:scale-95 shrink-0"
            title="Center to my GPS location"
          >
            <Navigation className="w-4 h-4" />
          </button>

          <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl border border-white/15 text-white flex items-center gap-1.5 text-xs font-bold shrink-0">
            <Flame className="w-3.5 h-3.5 text-accent-400 fill-accent-400" />
            <span>{mappedIssues.length} Pins</span>
          </div>
        </div>
      </div>

      {/* Full-Screen Map Container with Smooth flyTo Zoom */}
      <div className="flex-1 w-full h-full relative">
        {loading && issues.length === 0 ? (
          <div className="absolute inset-0 z-30 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-2" />
            <p className="text-xs font-bold text-gray-600">Loading civic map...</p>
          </div>
        ) : null}

        <MapComponent
          issues={mappedIssues}
          center={mapCenter}
          zoom={mapZoom}
        />
      </div>

      {/* Floating Compact Action Dock (Mobile-Responsive & Small) */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 p-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/15 shadow-2xl pointer-events-auto">
        <Link
          href="/feed"
          className="flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] sm:text-xs font-semibold transition-all active:scale-95 whitespace-nowrap"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-primary-400" />
          <span>Feed</span>
        </Link>

        <div className="w-[1px] h-4 bg-white/20" />

        <Link
          href="/create"
          className="flex items-center gap-1 px-3.5 py-1.5 sm:px-4 sm:py-1.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white text-[11px] sm:text-xs font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Report</span>
        </Link>
      </div>
    </div>
  );
}

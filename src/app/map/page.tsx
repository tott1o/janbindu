'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Filter,
  Navigation,
  Sparkles,
  X,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CivicMapPage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Auto-detect user GPS
  const detectUserLocation = useCallback(() => {
    if (user?.locationLat && user?.locationLng) {
      setUserCoords({ lat: user.locationLat, lng: user.locationLng });
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, [user]);

  useEffect(() => {
    detectUserLocation();
  }, [detectUserLocation]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '150',
      });

      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedStatus) params.append('status', selectedStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIssues();
  };

  const mappedIssues = issues.filter((i) => i.locationLat && i.locationLng);

  return (
    <div className="h-[calc(100vh-64px)] w-full relative flex flex-col overflow-hidden bg-slate-100">
      {/* Top Floating Filter Bar Overlay */}
      <div className="absolute top-4 left-4 right-4 z-40 max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pointer-events-none">
        {/* Search & Category Filter Pills */}
        <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-gray-200/90 flex-1 flex flex-col sm:flex-row items-center gap-2 pointer-events-auto">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search area, road, or issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchIssues();
                }}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

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

        {/* Mapped Issues Count Badge */}
        <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-white/15 text-white flex items-center justify-between sm:justify-start gap-2 pointer-events-auto self-start sm:self-auto text-xs font-bold shrink-0">
          <div className="flex items-center gap-1.5 text-accent-400">
            <Flame className="w-4 h-4 fill-accent-400" />
            <span>{mappedIssues.length} Active Pins</span>
          </div>
        </div>
      </div>

      {/* Full-Screen Map Container */}
      <div className="flex-1 w-full h-full relative">
        {loading && issues.length === 0 ? (
          <div className="absolute inset-0 z-30 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-2" />
            <p className="text-xs font-bold text-gray-600">Loading civic map...</p>
          </div>
        ) : null}

        <MapComponent
          issues={mappedIssues}
          center={
            userCoords
              ? [userCoords.lat, userCoords.lng]
              : mappedIssues.length > 0 && mappedIssues[0].locationLat
              ? [mappedIssues[0].locationLat, mappedIssues[0].locationLng]
              : [20.5937, 78.9629]
          }
          zoom={userCoords ? 13 : 5}
        />
      </div>

      {/* Floating Bottom Navigation Pill (Switch to Feed or Report) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 pointer-events-auto">
        <Link
          href="/feed"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white font-bold text-xs shadow-2xl backdrop-blur-md border border-white/20 transition-all hover:scale-105 active:scale-95"
        >
          <LayoutGrid className="w-4 h-4 text-primary-400" />
          <span>Switch to Feed List</span>
        </Link>

        <Link
          href="/create"
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-2xl transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Report Issue</span>
        </Link>
      </div>
    </div>
  );
}

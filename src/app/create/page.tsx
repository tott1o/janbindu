'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CATEGORIES } from '@/lib/utils';
import { MapComponent } from '@/components/MapComponent';
import {
  AlertTriangle,
  MapPin,
  UploadCloud,
  X,
  Loader2,
  CheckCircle2,
  Navigation,
  Search,
  Crosshair,
  Sparkles,
  RefreshCw,
  Plus,
  Images,
  Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    residential?: string;
    building?: string;
    amenity?: string;
    commercial?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    subdistrict?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    [key: string]: string | undefined;
  };
}

const MAX_IMAGES = 8;

export default function CreatePostPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('roads');
  const [criticality, setCriticality] = useState('medium');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  // Multi-image state
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState<number>(0);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Position state (default fallback if GPS permission is pending)
  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: 19.076,
    lng: 72.8777,
  });

  // Geolocation & geocoding status
  const [locating, setLocating] = useState(false);
  const [locationSource, setLocationSource] = useState<'gps' | 'pin' | 'search' | 'default'>('default');
  const [geocodingLoading, setGeocodingLoading] = useState(false);

  // Place Search & Autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchingPlace, setSearchingPlace] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Reverse Geocoding: Given (lat, lng), fetch human-readable Address, City, and State
   */
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      setGeocodingLoading(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );

      if (!res.ok) return;

      const data = await res.json();
      if (data && data.address) {
        const addrObj = data.address;

        // Construct clean street/landmark address
        const road = addrObj.road || addrObj.suburb || addrObj.neighbourhood || addrObj.residential || '';
        const landmark = addrObj.building || addrObj.amenity || addrObj.commercial || '';
        const formattedAddress = [landmark, road].filter(Boolean).join(', ') || data.display_name.split(',').slice(0, 2).join(', ');

        // Extract city / town
        const detectedCity =
          addrObj.city ||
          addrObj.town ||
          addrObj.village ||
          addrObj.municipality ||
          addrObj.subdistrict ||
          addrObj.county ||
          '';

        // Extract state
        const detectedState = addrObj.state || '';

        if (formattedAddress) setAddress(formattedAddress);
        if (detectedCity) setCity(detectedCity);
        if (detectedState) setState(detectedState);
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    } finally {
      setGeocodingLoading(false);
    }
  }, []);

  /**
   * Get Current GPS Location with High Accuracy
   */
  const handleGetCurrentLocation = useCallback((isAutomatic = false) => {
    if (!navigator.geolocation) {
      if (!isAutomatic) toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setPosition(coords);
        setLocationSource('gps');
        setLocating(false);

        // Auto-populate address, city, state via reverse geocoding
        await reverseGeocode(coords.lat, coords.lng);
        toast.success(isAutomatic ? 'Location auto-detected' : 'GPS location locked');
      },
      (err) => {
        setLocating(false);
        if (!isAutomatic) {
          if (err.code === 1) {
            toast.error('Location access denied. Please click on the map to pinpoint.');
          } else {
            toast.error('Unable to fetch GPS position. Pinpoint on the map.');
          }
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [reverseGeocode]);

  // Automatically trigger location detection on page load
  useEffect(() => {
    handleGetCurrentLocation(true);
  }, [handleGetCurrentLocation]);

  // Click outside to close search dropdown
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

  /**
   * Forward Geocoding: Search places / landmarks
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

      const data: SearchResult[] = await res.json();
      setSearchResults(data);
      setShowSearchResults(true);
    } catch (err) {
      console.error('Place search error:', err);
    } finally {
      setSearchingPlace(false);
    }
  };

  /**
   * User selects place from autocomplete dropdown
   */
  const handleSelectSearchResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setPosition({ lat, lng });
    setLocationSource('search');
    setShowSearchResults(false);
    setSearchQuery(result.display_name);

    if (result.address) {
      const addrObj = result.address;
      const road = addrObj.road || addrObj.suburb || addrObj.neighbourhood || '';
      const landmark = addrObj.building || addrObj.amenity || '';
      const formattedAddress = [landmark, road].filter(Boolean).join(', ') || result.display_name.split(',').slice(0, 2).join(', ');

      const detectedCity =
        addrObj.city ||
        addrObj.town ||
        addrObj.village ||
        addrObj.municipality ||
        addrObj.subdistrict ||
        addrObj.county ||
        '';

      const detectedState = addrObj.state || '';

      setAddress(formattedAddress || result.display_name);
      if (detectedCity) setCity(detectedCity);
      if (detectedState) setState(detectedState);
    }

    toast.success('Map centered on selected landmark');
  };

  /**
   * User clicks or drags marker on the map
   */
  const handleMapLocationSelect = async (lat: number, lng: number) => {
    setPosition({ lat, lng });
    setLocationSource('pin');
    await reverseGeocode(lat, lng);
  };

  /**
   * Multi-file Cloudinary Upload handling
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - uploadedImages.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum of ${MAX_IMAGES} photos reached`);
      return;
    }

    const filesArray = Array.from(files).slice(0, remainingSlots);

    // Validate size (max 10MB per file)
    const validFiles: File[] = [];
    for (const f of filesArray) {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`"${f.name}" exceeds 10MB limit and was skipped`);
      } else {
        validFiles.push(f);
      }
    }

    if (validFiles.length === 0) return;

    const token = localStorage.getItem('janbindu_token');
    if (!token) {
      toast.error('Please sign in to upload photos');
      return;
    }

    try {
      setUploadingCount(validFiles.length);
      const formData = new FormData();
      validFiles.forEach((file) => formData.append('files', file));

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to upload images');
        return;
      }

      const newUrls: string[] = data.urls || (data.url ? [data.url] : []);
      setUploadedImages((prev) => [...prev, ...newUrls].slice(0, MAX_IMAGES));
      toast.success(`${newUrls.length} photo${newUrls.length > 1 ? 's' : ''} uploaded to Cloudinary!`);
    } catch {
      toast.error('Error uploading photos to Cloudinary');
    } finally {
      setUploadingCount(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (!urlInput.trim()) return;
    if (uploadedImages.length >= MAX_IMAGES) {
      toast.error(`Maximum of ${MAX_IMAGES} photos reached`);
      return;
    }
    setUploadedImages((prev) => [...prev, urlInput.trim()]);
    setUrlInput('');
    setShowUrlInput(false);
    toast.success('Image link added');
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('janbindu_token');
    if (!token) {
      toast.error('Please sign in to report an issue');
      router.push('/login');
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in the title and description');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          category,
          criticality,
          address: address || 'Pinpoint Location',
          city: city || 'Local Area',
          state: state || '',
          locationLat: position.lat,
          locationLng: position.lng,
          images: uploadedImages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to submit issue');
        return;
      }

      toast.success('Civic issue reported successfully!');
      router.push(`/post/${data.id}`);
    } catch {
      toast.error('Failed to submit issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-900 px-8 py-8 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-500/20 border border-accent-400/30 flex items-center justify-center text-accent-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Report a Public Issue</h1>
              <p className="text-xs text-primary-200 mt-0.5">
                Upload multiple photos and pinpoint the exact street location.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Issue Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Issue Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Severe Potholes & Waterlogging on Main Market Road"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500 text-sm font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe the severity, how long it has existed, and the danger it poses to pedestrians or traffic..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>

          {/* Category & Criticality Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500 text-sm font-medium bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Criticality Level (Urgency Weight)
              </label>
              <select
                value={criticality}
                onChange={(e) => setCriticality(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500 text-sm font-medium bg-white"
              >
                <option value="low">Low (Minor nuisance, cosmetic)</option>
                <option value="medium">Medium (Needs municipal attention)</option>
                <option value="high">High (Active disruption / hazard)</option>
                <option value="critical">Critical (Immediate danger to human life)</option>
              </select>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MULTI-IMAGE UPLOAD SECTION (CLOUDINARY) */}
          {/* ========================================================================= */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Images className="w-4 h-4 text-primary-600" />
                Photo Evidence ({uploadedImages.length} / {MAX_IMAGES})
              </label>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 underline"
              >
                {showUrlInput ? 'Hide URL input' : '+ Add via Image Link'}
              </button>
            </div>

            {/* URL input fallback */}
            {showUrlInput && (
              <div className="mb-4 flex gap-2">
                <input
                  type="url"
                  placeholder="Paste image web link (https://...)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700"
                >
                  Add Link
                </button>
              </div>
            )}

            {/* Drag & Drop Multi-file Upload Zone */}
            {uploadedImages.length < MAX_IMAGES && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-primary-500 bg-slate-50/60 hover:bg-primary-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={uploadingCount > 0}
                />

                {uploadingCount > 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-2">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                    <span className="text-sm font-semibold text-primary-700">
                      Uploading {uploadingCount} photo{uploadingCount > 1 ? 's' : ''} to Cloudinary...
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-900 block">
                        Click or drag to upload multiple photos
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Select multiple photos from different angles (PNG, JPG, WEBP &bull; Max {MAX_IMAGES} photos)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Uploaded Images Preview Gallery */}
            {uploadedImages.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {uploadedImages.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 shadow-sm group bg-slate-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                      
                      {/* Badge indicating cover image */}
                      {idx === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-bold backdrop-blur-xs">
                          Cover
                        </span>
                      )}

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeUploadedImage(idx)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-red-600 text-white transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add more button tile */}
                  {uploadedImages.length < MAX_IMAGES && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-primary-500 bg-slate-50 hover:bg-primary-50 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-primary-600 transition-colors"
                    >
                      <Plus className="w-6 h-6" />
                      <span className="text-[11px] font-bold">Add Photo</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* GEOLOCATION & PINPOINTING SECTION */}
          {/* ========================================================================= */}
          <div className="pt-6 border-t border-gray-200 space-y-5">
            {/* Header & GPS Re-trigger */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-1.5">
                    <MapPin className="w-5 h-5 text-primary-600" />
                    Issue Geolocation & Address
                  </h3>
                  {locating && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Locating GPS...
                    </span>
                  )}
                  {!locating && locationSource === 'gps' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      GPS Locked
                    </span>
                  )}
                  {!locating && locationSource === 'pin' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-800">
                      <Crosshair className="w-3 h-3" />
                      Pinpoint Mode
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Coordinates and address auto-fill automatically. Click or drag the pin anywhere on the map.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleGetCurrentLocation(false)}
                disabled={locating}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-bold transition-all border border-primary-200 shrink-0 self-start disabled:opacity-50"
              >
                {locating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                ) : (
                  <Navigation className="w-4 h-4 text-primary-600" />
                )}
                <span>{locating ? 'Detecting...' : 'Recalibrate GPS'}</span>
              </button>
            </div>

            {/* Landmark / Place Search Autocomplete */}
            <div ref={searchContainerRef} className="relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search landmark, area, or road (e.g. Bandra Terminus, MG Road...)"
                  value={searchQuery}
                  onChange={(e) => handlePlaceSearch(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSearchResults(true);
                  }}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500 text-sm bg-slate-50/70 focus:bg-white"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                {searchingPlace && (
                  <Loader2 className="w-4 h-4 text-primary-600 animate-spin absolute right-3.5 top-3" />
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-200 py-1.5 z-50 max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.place_id}
                      type="button"
                      onClick={() => handleSelectSearchResult(result)}
                      className="w-full text-left px-4 py-2.5 hover:bg-primary-50 transition-colors flex items-start gap-2.5 border-b border-gray-50 last:border-0"
                    >
                      <MapPin className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-800 line-clamp-2 leading-relaxed">
                        {result.display_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auto-filled Address Fields */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent-600" />
                  Auto-Detected Address Details
                </span>
                {geocodingLoading && (
                  <span className="text-[11px] text-primary-600 flex items-center gap-1 font-medium">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Fetching address...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Street / Landmark
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Station Road, Gate 3"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    City / Municipality
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Display Exact Coordinates */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-gray-500 font-mono border-t border-gray-200/60">
                <span>Latitude: <strong>{position.lat.toFixed(5)}</strong></span>
                <span>Longitude: <strong>{position.lng.toFixed(5)}</strong></span>
              </div>
            </div>

            {/* Interactive Leaflet Map with Draggable Pin */}
            <div className="h-72 w-full rounded-2xl overflow-hidden border border-gray-300 shadow-sm relative">
              <MapComponent
                issues={[]}
                center={[position.lat, position.lng]}
                zoom={16}
                isPicker={true}
                selectedPos={position}
                selectedAddress={address ? `${address}, ${city}` : undefined}
                onLocationSelect={handleMapLocationSelect}
              />
            </div>
            <p className="text-[11px] text-gray-500 text-center">
              💡 Tip: Click anywhere on the map or drag the blue pin to refine the exact spot. Address updates in real-time.
            </p>
          </div>

          {/* Submit Action */}
          <div className="pt-6 border-t border-gray-200 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-xl border border-gray-300 font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingCount > 0}
              className="px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm shadow-lg shadow-primary-600/30 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculating Priority Score...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Issue Report ({uploadedImages.length} photo{uploadedImages.length !== 1 ? 's' : ''})
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

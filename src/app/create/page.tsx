'use client';

import React, { useState, useRef } from 'react';
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
  Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: 19.076,
    lng: 72.8777, // Default to Mumbai
  });
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB');
      return;
    }

    const token = localStorage.getItem('janbindu_token');
    if (!token) {
      toast.error('Please sign in to upload photos');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to upload image to Cloudinary');
        return;
      }

      setUploadedImages((prev) => [...prev, data.url]);
      toast.success('Photo uploaded to Cloudinary successfully!');
    } catch {
      toast.error('Error connecting to Cloudinary upload');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          toast.success('Location updated');
        },
        () => {
          toast.error('Unable to retrieve current location');
        }
      );
    }
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

    const finalImages = [...uploadedImages];
    if (imageUrl.trim()) finalImages.push(imageUrl.trim());

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
          address,
          city: city || 'Local Area',
          state,
          locationLat: position.lat,
          locationLng: position.lng,
          images: finalImages,
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
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-900 to-indigo-900 px-8 py-8 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-500/20 border border-accent-400/30 flex items-center justify-center text-accent-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Report a Public Issue</h1>
              <p className="text-xs text-primary-200 mt-0.5">
                Uploaded images will be stored automatically on Cloudinary.
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Issue Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Hazardous Open Manhole Near Public School"
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
              placeholder="Describe the problem, duration, and the risk it poses..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>

          {/* Category & Criticality */}
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
                Criticality Level (Urgency)
              </label>
              <select
                value={criticality}
                onChange={(e) => setCriticality(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500 text-sm font-medium bg-white"
              >
                <option value="low">Low (Minor nuisance, cosmetic)</option>
                <option value="medium">Medium (Needs municipal attention)</option>
                <option value="high">High (Active disruption / risk)</option>
                <option value="critical">Critical (Immediate danger to human life)</option>
              </select>
            </div>
          </div>

          {/* Automatic Cloudinary Image Upload Section */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Photo Evidence (Automatic Cloudinary Upload)
            </label>

            {/* Drag and drop upload zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 hover:border-primary-500 bg-slate-50/60 hover:bg-primary-50/30 rounded-2xl p-6 text-center cursor-pointer transition-colors"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
                disabled={uploadingImage}
              />

              {uploadingImage ? (
                <div className="flex flex-col items-center justify-center gap-2 py-2">
                  <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                  <span className="text-sm font-semibold text-primary-700">
                    Uploading image to Cloudinary...
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900">
                      Click to upload photo from your device
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">PNG, JPG, WEBP up to 10MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Uploaded Images Preview Gallery */}
            {uploadedImages.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-4">
                {uploadedImages.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative w-28 h-28 rounded-2xl overflow-hidden border border-gray-200 shadow-sm group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeUploadedImage(idx)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-red-600 text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Geolocation Section */}
          <div className="pt-4 border-t border-gray-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-600" />
                  Exact Pin Location
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Click or drag the marker to pinpoint the exact location.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors self-start"
              >
                <Navigation className="w-4 h-4 text-primary-600" />
                Use GPS Location
              </button>
            </div>

            {/* Address inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Street Landmark"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm"
              />
              <input
                type="text"
                placeholder="City (e.g. Mumbai)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm"
              />
              <input
                type="text"
                placeholder="State (e.g. Maharashtra)"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm"
              />
            </div>

            {/* Interactive Map */}
            <div className="h-64 w-full rounded-2xl overflow-hidden border border-gray-200">
              <MapComponent
                issues={[]}
                center={[position.lat, position.lng]}
                zoom={14}
                isPicker={true}
                selectedPos={position}
                onLocationSelect={(lat, lng) => setPosition({ lat, lng })}
              />
            </div>
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
              disabled={loading || uploadingImage}
              className="px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm shadow-lg shadow-primary-600/30 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculating Score...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Issue Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

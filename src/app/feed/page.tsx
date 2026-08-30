'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PostCard } from '@/components/PostCard';
import { CategorySelect } from '@/components/CategorySelect';
import { BottomDock } from '@/components/BottomDock';
import { useAuth } from '@/context/AuthContext';
import {
  Flame,
  Clock,
  MapPin,
  Filter,
  Search,
  Loader2,
  Navigation,
  X,
  Plus,
  Map as MapIcon,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function FeedPage() {
  const { user } = useAuth();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'trending' | 'nearby' | 'recent'>('trending');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Collapsible on-demand filter toggle
  const [filtersOpen, setFiltersOpen] = useState(false);

  // User location for distance & nearby filtering
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  /**
   * Acquire user location (from profile or GPS)
   */
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

  const fetchPosts = async (resetPage = false) => {
    try {
      setLoading(true);
      const currentPage = resetPage ? 1 : page;
      const params = new URLSearchParams({
        sort,
        page: currentPage.toString(),
        limit: '12',
      });

      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedStatus) params.append('status', selectedStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      if (userCoords) {
        params.append('userLat', userCoords.lat.toString());
        params.append('userLng', userCoords.lng.toString());
      }

      const token = localStorage.getItem('janbindu_token');
      const res = await fetch(`/api/posts?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (res.ok) {
        if (resetPage) {
          setPosts(data.posts || []);
        } else {
          setPosts((prev) => [...prev, ...(data.posts || [])]);
        }
        setTotalCount(data.total || 0);
        setHasMore(data.hasMore || false);
      }
    } catch {
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchPosts(true);
  }, [sort, selectedCategory, selectedStatus, userCoords]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPosts(true);
  };

  const handleVoteChange = (postId: string, newScore: number, userVote: string | null) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          let up = p.upvoteCount;
          let down = p.downvoteCount;

          if (p.userVote === 'upvote') up = Math.max(0, up - 1);
          if (p.userVote === 'downvote') down = Math.max(0, down - 1);

          if (userVote === 'upvote') up += 1;
          if (userVote === 'downvote') down += 1;

          return {
            ...p,
            janbinduScore: newScore,
            userVote,
            upvoteCount: up,
            downvoteCount: down,
          };
        }
        return p;
      })
    );
  };

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (selectedStatus ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedStatus('');
    setSearchQuery('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 relative">
      {/* Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Public Issues Feed
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 text-xs font-bold">
              {totalCount} Issues
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Community-prioritized civic issues requiring administrative action.
          </p>
        </div>

        {/* Action Buttons, Fullscreen Map Link, Filter Trigger & Sort Tabs */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* On-Demand Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shadow-2xs active:scale-95 ${
              filtersOpen || activeFiltersCount > 0
                ? 'bg-primary-50 border-primary-300 text-primary-700 ring-2 ring-primary-500/10'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary-600 text-white text-[10px] flex items-center justify-center font-bold ml-0.5">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Direct Full-Screen Map Link */}
          <Link
            href="/map"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-200 shadow-2xs hover:scale-102 active:scale-98"
          >
            <MapIcon className="w-3.5 h-3.5 text-primary-600" />
            <span>Map</span>
          </Link>

          {/* Sort Filter Pills */}
          <div className="flex items-center p-1 rounded-xl bg-gray-100 max-w-fit">
            <button
              onClick={() => setSort('trending')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sort === 'trending'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-accent-500 fill-accent-500" />
              <span>Trending</span>
            </button>

            <button
              onClick={() => setSort('nearby')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sort === 'nearby'
                  ? 'bg-white text-primary-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-primary-600" />
              <span>Near Me</span>
            </button>

            <button
              onClick={() => setSort('recent')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sort === 'recent'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Recent</span>
            </button>
          </div>

          <Link
            href="/create"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Report Issue
          </Link>
        </div>
      </div>

      {/* Collapsible On-Demand Filter Panel */}
      {filtersOpen && (
        <div className="mt-4 p-5 bg-white rounded-2xl border border-gray-200/90 shadow-lg animate-in fade-in-50 slide-in-from-top-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
              <Filter className="w-4 h-4 text-primary-600" />
              <span>Filter & Search Issues</span>
            </div>
            <div className="flex items-center gap-3">
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-primary-600 hover:underline"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Keyword / City
              </label>
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="e.g. Mumbai, potholes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-white"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setPage(1);
                    }}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <CategorySelect
                value={selectedCategory}
                onChange={(cat) => setSelectedCategory(cat)}
                allowAll={true}
                placeholder="All Categories"
              />
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Resolution Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-white font-medium"
              >
                <option value="">All Statuses</option>
                <option value="reported">Reported</option>
                <option value="under_review">Under Review</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips Bar (Shown whenever filters are active, even if panel is closed) */}
      {activeFiltersCount > 0 && !filtersOpen && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-400 font-medium">Filtered by:</span>

          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-bold border border-slate-200">
              &ldquo;{searchQuery}&rdquo;
              <button onClick={() => setSearchQuery('')}>
                <X className="w-3 h-3 hover:text-red-500" />
              </button>
            </span>
          )}

          {selectedCategory && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 font-bold border border-primary-200">
              {selectedCategory}
              <button onClick={() => setSelectedCategory('')}>
                <X className="w-3 h-3 hover:text-red-500" />
              </button>
            </span>
          )}

          {selectedStatus && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
              Status: {selectedStatus.replace('_', ' ')}
              <button onClick={() => setSelectedStatus('')}>
                <X className="w-3 h-3 hover:text-red-500" />
              </button>
            </span>
          )}

          <button
            onClick={clearAllFilters}
            className="text-xs font-bold text-red-600 hover:text-red-700 underline ml-2"
          >
            Reset
          </button>
        </div>
      )}

      {/* Full-Width Issues Grid Layout */}
      <div className="mt-8">
        {loading && posts.length === 0 ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-500 font-medium">Loading civic issues...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3 shadow-2xs">
            <p className="text-gray-600 font-medium">No civic issues found matching your filters.</p>
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onVoteChange={handleVoteChange} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center pt-10">
                <button
                  onClick={() => {
                    setPage((p) => p + 1);
                    fetchPosts(false);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs active:scale-95"
                >
                  Load More Issues
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating 3-Option Navigation Dock (Feed, Map | Report with active state) */}
      <BottomDock />
    </div>
  );
}

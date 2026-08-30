'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PostCard } from '@/components/PostCard';
import { CategorySelect } from '@/components/CategorySelect';
import { CATEGORIES } from '@/lib/utils';
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
  LayoutGrid,
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

        {/* Action Buttons, Fullscreen Map Link & Sort Tabs */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Direct Full-Screen Map Link */}
          <Link
            href="/map"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-200 shadow-2xs hover:scale-102 active:scale-98"
          >
            <MapIcon className="w-3.5 h-3.5 text-primary-600" />
            <span>Full-Screen Map</span>
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

      {/* Grid Layout with Filters & Content */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between font-bold text-gray-900 pb-3 border-b border-gray-100 text-sm">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary-600" />
                <span>Filter Issues</span>
              </div>
              {(selectedCategory || selectedStatus || searchQuery) && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-semibold text-primary-600 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            {/* City / Keyword Search */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Search Issues / City
              </label>
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="e.g. Mumbai, potholes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
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

            {/* Category Custom Dropdown Select */}
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

            {/* Status Select */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Resolution Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-white"
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

        {/* Issues List Grid */}
        <div className="lg:col-span-3 space-y-6">
          {loading && posts.length === 0 ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-3" />
              <p className="text-xs text-gray-500 font-medium">Loading civic issues...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} onVoteChange={handleVoteChange} />
                ))}
              </div>

              {hasMore && (
                <div className="text-center pt-8">
                  <button
                    onClick={() => {
                      setPage((p) => p + 1);
                      fetchPosts(false);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
                  >
                    Load More Issues
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating Full-Screen Map Pill (Bottom Center) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <Link
          href="/map"
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white font-bold text-xs shadow-2xl backdrop-blur-md border border-white/20 transition-all hover:scale-105 active:scale-95"
        >
          <MapIcon className="w-4 h-4 text-primary-400" />
          <span>View on Full-Screen Map ({totalCount})</span>
        </Link>
      </div>
    </div>
  );
}

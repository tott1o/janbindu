'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PostCard } from '@/components/PostCard';
import { CATEGORIES } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  Flame,
  Clock,
  MapPin,
  Filter,
  Search,
  Loader2,
  AlertTriangle,
  Sparkles,
  Navigation,
  X,
  SlidersHorizontal,
  PlusCircle,
  Layers,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function FeedPage() {
  const { user } = useAuth();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'trending' | 'nearby' | 'critical' | 'recent'>('trending');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCriticality, setSelectedCriticality] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // User location for distance & nearby filtering
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [locatingUser, setLocatingUser] = useState(false);

  // Mobile filter drawer state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  /**
   * Acquire user's location (from user profile or browser GPS)
   */
  const detectUserLocation = useCallback(() => {
    if (user?.locationLat && user?.locationLng) {
      setUserCoords({ lat: user.locationLat, lng: user.locationLng });
      setLocationName(user.city || 'Your Registered City');
      return;
    }

    if (navigator.geolocation) {
      setLocatingUser(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setLocationName('Current Location');
          setLocatingUser(false);
        },
        () => {
          setLocatingUser(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [user]);

  useEffect(() => {
    detectUserLocation();
  }, [detectUserLocation]);

  /**
   * Fetch posts with active sort, filters, and user proximity coordinates
   */
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
      if (selectedCriticality) params.append('criticality', selectedCriticality);
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
  }, [sort, selectedCategory, selectedStatus, selectedCriticality, userCoords]);

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
    (selectedCriticality ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedStatus('');
    setSelectedCriticality('');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Top Header Banner with Live Location Context */}
      <div className="bg-gradient-to-b from-slate-900 via-primary-950 to-slate-900 text-white pt-8 pb-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-accent-300 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Public Grievance Action Feed</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">Civic Issues Stream</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Issues prioritized in real-time by community interactions, severity, and proximity to your neighborhood.
            </p>
          </div>

          {/* Location Badge & Report Issue CTA */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Active user location chip */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium text-slate-200">
              <MapPin className="w-4 h-4 text-primary-400 shrink-0" />
              <span className="truncate max-w-[160px]">
                {locatingUser ? 'Locating GPS...' : locationName || 'All India'}
              </span>
              <button
                onClick={detectUserLocation}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors text-primary-300"
                title="Refresh GPS"
              >
                <Navigation className="w-3.5 h-3.5" />
              </button>
            </div>

            <Link
              href="/create"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-primary-600/30 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Report Issue
            </Link>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Navigation & Control Strip Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg p-3 sm:p-4 space-y-4">
          {/* Top Row: Main View Segmented Control & Search */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Primary Sorting Tabs */}
            <div className="grid grid-cols-2 sm:flex items-center p-1 rounded-2xl bg-slate-100 gap-1 overflow-x-auto">
              <button
                onClick={() => setSort('trending')}
                className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  sort === 'trending'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className="w-4 h-4 text-accent-500 fill-accent-500" />
                <span>Trending</span>
              </button>

              <button
                onClick={() => setSort('nearby')}
                className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  sort === 'nearby'
                    ? 'bg-white text-primary-700 shadow-xs ring-1 ring-primary-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapPin className="w-4 h-4 text-primary-600" />
                <span>Near Me</span>
              </button>

              <button
                onClick={() => setSort('critical')}
                className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  sort === 'critical'
                    ? 'bg-white text-red-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>Critical Alerts</span>
              </button>

              <button
                onClick={() => setSort('recent')}
                className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  sort === 'recent'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Recent</span>
              </button>
            </div>

            {/* Search Input & Mobile Filter Trigger */}
            <div className="flex items-center gap-2">
              <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-72">
                <input
                  type="text"
                  placeholder="Search issues, road, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setPage(1);
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* Mobile Filter Button */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs sm:text-sm font-bold transition-colors lg:hidden ${
                  activeFiltersCount > 0
                    ? 'bg-primary-50 border-primary-300 text-primary-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Horizontal Scrollable Category Carousel */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
                selectedCategory === ''
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat.value ? '' : cat.value)
                }
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.value
                    ? 'bg-primary-600 text-white shadow-xs ring-2 ring-primary-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Active Filter Chips & Clear */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400 font-semibold">Active:</span>

              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 font-bold border border-primary-200">
                  Category: {selectedCategory}
                  <button onClick={() => setSelectedCategory('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedStatus && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  Status: {selectedStatus.replace('_', ' ')}
                  <button onClick={() => setSelectedStatus('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedCriticality && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 font-bold border border-red-200">
                  Urgency: {selectedCriticality}
                  <button onClick={() => setSelectedCriticality('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                  &ldquo;{searchQuery}&rdquo;
                  <button onClick={() => setSearchQuery('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={clearAllFilters}
                className="text-xs font-bold text-red-600 hover:text-red-700 underline ml-auto"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Content Layout */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                  <Filter className="w-4 h-4 text-primary-600" />
                  <span>Refine Feed</span>
                </div>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs font-bold text-primary-600 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Resolution Status
                </label>
                <div className="space-y-1">
                  {[
                    { val: '', label: 'All Statuses' },
                    { val: 'reported', label: 'Reported' },
                    { val: 'under_review', label: 'Under Review' },
                    { val: 'in_progress', label: 'In Progress' },
                    { val: 'resolved', label: 'Resolved' },
                  ].map((st) => (
                    <button
                      key={st.val}
                      onClick={() => setSelectedStatus(st.val)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                        selectedStatus === st.val
                          ? 'bg-primary-50 text-primary-700 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{st.label}</span>
                      {selectedStatus === st.val && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgency / Criticality Filter */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Urgency Level
                </label>
                <div className="space-y-1">
                  {[
                    { val: '', label: 'All Urgencies' },
                    { val: 'critical', label: 'Critical Danger (8x)' },
                    { val: 'high', label: 'High Priority (4x)' },
                    { val: 'medium', label: 'Medium (2x)' },
                    { val: 'low', label: 'Low Urgency (1x)' },
                  ].map((cr) => (
                    <button
                      key={cr.val}
                      onClick={() => setSelectedCriticality(cr.val)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                        selectedCriticality === cr.val
                          ? 'bg-red-50 text-red-700 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{cr.label}</span>
                      {selectedCriticality === cr.val && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Feed Grid */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">
                Showing {posts.length} of {totalCount} public issues
              </span>
              {sort === 'nearby' && (
                <span className="text-primary-600 font-bold flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  Sorted by closest distance
                </span>
              )}
            </div>

            {/* Shimmer Skeleton Loading */}
            {loading && posts.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse"
                  >
                    <div className="aspect-video bg-slate-200 rounded-2xl w-full" />
                    <div className="h-5 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-200 rounded-md w-full" />
                    <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No issues found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No public reports match your current filters or location radius. Try resetting filters or report an issue.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800"
                  >
                    Reset Filters
                  </button>
                  <Link
                    href="/create"
                    className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold"
                  >
                    Report First Issue
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onVoteChange={handleVoteChange}
                      userCoords={userCoords}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="text-center pt-8">
                    <button
                      onClick={() => {
                        setPage((p) => p + 1);
                        fetchPosts(false);
                      }}
                      className="px-8 py-3 rounded-2xl bg-white border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs active:scale-95"
                    >
                      Load More Civic Issues
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto space-y-6 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary-600" />
                Filter Civic Issues
              </h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Resolution Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: '', label: 'All' },
                  { val: 'reported', label: 'Reported' },
                  { val: 'under_review', label: 'Under Review' },
                  { val: 'in_progress', label: 'In Progress' },
                  { val: 'resolved', label: 'Resolved' },
                ].map((st) => (
                  <button
                    key={st.val}
                    onClick={() => setSelectedStatus(st.val)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      selectedStatus === st.val
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Urgency Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: '', label: 'All Urgencies' },
                  { val: 'critical', label: 'Critical Danger' },
                  { val: 'high', label: 'High Priority' },
                  { val: 'medium', label: 'Medium' },
                  { val: 'low', label: 'Low' },
                ].map((cr) => (
                  <button
                    key={cr.val}
                    onClick={() => setSelectedCriticality(cr.val)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      selectedCriticality === cr.val
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {cr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 flex gap-3">
              <button
                onClick={clearAllFilters}
                className="flex-1 py-3 rounded-2xl border border-slate-300 font-bold text-xs text-slate-700"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-3 rounded-2xl bg-primary-600 text-white font-bold text-xs shadow-md"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

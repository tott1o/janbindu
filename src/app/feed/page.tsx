'use client';

import React, { useState, useEffect } from 'react';
import { PostCard } from '@/components/PostCard';
import { CATEGORIES } from '@/lib/utils';
import { Flame, Clock, MapPin, Filter, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'trending' | 'recent' | 'nearby'>('trending');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchCity, setSearchCity] = useState<string>('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchPosts = async (resetPage = false) => {
    try {
      setLoading(true);
      const currentPage = resetPage ? 1 : page;
      const params = new URLSearchParams({
        sort,
        page: currentPage.toString(),
        limit: '9',
      });

      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedStatus) params.append('status', selectedStatus);
      if (searchCity.trim()) params.append('city', searchCity.trim());

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
  }, [sort, selectedCategory, selectedStatus]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header & Sort Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Public Issues Feed</h1>
          <p className="text-sm text-gray-500 mt-1">
            Community-prioritized civic issues requiring administrative action.
          </p>
        </div>

        {/* Sort Filter Pills */}
        <div className="flex items-center p-1 rounded-xl bg-gray-200/80 max-w-fit">
          <button
            onClick={() => setSort('trending')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              sort === 'trending'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-accent-500 fill-accent-500" />
            Trending (Score)
          </button>
          <button
            onClick={() => setSort('recent')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              sort === 'recent'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            Most Recent
          </button>
        </div>
      </div>

      {/* Filters & Grid Layout */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2 font-bold text-gray-900 pb-3 border-b border-gray-100">
              <Filter className="w-4 h-4 text-primary-600" />
              <span>Filter Issues</span>
            </div>

            {/* City Search */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                City / Location
              </label>
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="e.g. Mumbai, Delhi..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </form>
            </div>

            {/* Category select */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status select */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Resolution Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="">All Statuses</option>
                <option value="reported">Reported</option>
                <option value="under_review">Under Review</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {(selectedCategory || selectedStatus || searchCity) && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedStatus('');
                  setSearchCity('');
                }}
                className="w-full py-2 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Issues List Grid */}
        <div className="lg:col-span-3 space-y-6">
          {loading && posts.length === 0 ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading civic issues...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500 font-medium">No civic issues found matching your filters.</p>
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
                    className="px-6 py-2.5 rounded-xl bg-white border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
                  >
                    Load More Issues
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

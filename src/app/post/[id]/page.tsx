'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/StatusBadge';
import { CategoryBadge } from '@/components/CategoryBadge';
import { timeAgo, getCriticalityBadge } from '@/lib/utils';
import { MapComponent } from '@/components/MapComponent';
import {
  Flame,
  ArrowBigUp,
  ArrowBigDown,
  Share2,
  MapPin,
  Clock,
  User as UserIcon,
  Send,
  Loader2,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchPost = async () => {
    try {
      const token = localStorage.getItem('janbindu_token');
      const res = await fetch(`/api/posts/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error('Post not found');
        return;
      }
      setPost(data);
    } catch {
      toast.error('Failed to load issue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchPost();
  }, [id]);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    const token = localStorage.getItem('janbindu_token');
    if (!token) {
      toast.error('Please sign in to vote');
      return;
    }

    try {
      const res = await fetch(`/api/posts/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ voteType }),
      });

      const data = await res.json();
      if (res.ok) {
        fetchPost();
      }
    } catch {
      toast.error('Vote failed');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const token = localStorage.getItem('janbindu_token');
    if (!token) {
      toast.error('Please sign in to comment');
      return;
    }

    try {
      setSubmittingComment(true);
      const res = await fetch(`/api/posts/${id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: commentText }),
      });

      if (res.ok) {
        setCommentText('');
        toast.success('Comment added');
        fetchPost();
      }
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this issue?')) return;

    const token = localStorage.getItem('janbindu_token');
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success('Issue deleted');
        router.push('/feed');
      }
    } catch {
      toast.error('Failed to delete issue');
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading issue details...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Issue Not Found</h2>
      </div>
    );
  }

  const criticality = getCriticalityBadge(post.criticality);
  const isOwner = user?.id === post.userId || user?.role === 'admin';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Discussion */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Card */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
            {/* Cover photo */}
            {post.images && post.images.length > 0 && (
              <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.images[0].imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-8">
              {/* Badges & Score header */}
              <div className="flex items-start justify-between gap-4 pb-6 border-b border-gray-100">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CategoryBadge category={post.category} />
                    <StatusBadge status={post.status} />
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${criticality.bg} ${criticality.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${criticality.dot}`} />
                      {criticality.label} Urgency
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                    {post.title}
                  </h1>
                </div>

                {/* Score badge */}
                <div className="flex flex-col items-center p-3 rounded-2xl bg-amber-50 border border-amber-200/80 shrink-0">
                  <Flame className="w-6 h-6 fill-accent-500 text-accent-500" />
                  <span className="text-xl font-black text-gray-900">
                    {Math.round(post.janbinduScore || 0)}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Priority</span>
                </div>
              </div>

              {/* Author & Timestamp */}
              <div className="flex items-center justify-between py-4 text-xs text-gray-500 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                    {post.user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <span>
                    Reported by <strong className="text-gray-800">{post.user?.fullName}</strong>
                  </span>
                </div>
                <span>{timeAgo(post.createdAt)}</span>
              </div>

              {/* Description Body */}
              <div className="py-6 prose prose-slate max-w-none text-gray-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {post.description}
              </div>

              {/* Action Bar */}
              <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVote('upvote')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                      post.userVote === 'upvote'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <ArrowBigUp className="w-5 h-5" />
                    <span>Upvote ({post.upvoteCount || 0})</span>
                  </button>

                  <button
                    onClick={() => handleVote('downvote')}
                    className={`p-2 rounded-xl border transition-colors ${
                      post.userVote === 'downvote'
                        ? 'bg-red-50 text-red-700 border-red-300'
                        : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <ArrowBigDown className="w-5 h-5" />
                  </button>
                </div>

                {isOwner && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Issue
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              Citizen Discussion ({post.comments?.length || 0})
            </h3>

            {/* Comment input */}
            {isAuthenticated ? (
              <form onSubmit={handleCommentSubmit} className="mb-8 space-y-3">
                <textarea
                  rows={3}
                  required
                  placeholder="Share updates, observations, or additional context..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="px-5 py-2 rounded-xl bg-primary-600 text-white font-bold text-xs shadow-md hover:bg-primary-500 flex items-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Post Comment
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-gray-200 text-center text-xs text-gray-600 mb-6">
                Please <a href="/login" className="text-primary-600 font-bold underline">sign in</a> to join the conversation.
              </div>
            )}

            {/* Comments list */}
            <div className="space-y-4">
              {post.comments?.map((comment: any) => (
                <div key={comment.id} className="p-4 rounded-2xl bg-slate-50/70 border border-gray-100 flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {comment.user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-900">{comment.user?.fullName}</span>
                      <span className="text-gray-400">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Location Map & Status Timeline */}
        <div className="space-y-6">
          {/* Location Map Card */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-600" />
              Location Details
            </h3>

            <p className="text-xs text-gray-600">
              {post.address || 'Address Tagged'}
              {post.city ? `, ${post.city}` : ''}
              {post.state ? `, ${post.state}` : ''}
            </p>

            {post.locationLat && post.locationLng && (
              <div className="h-52 w-full rounded-2xl overflow-hidden border border-gray-200">
                <MapComponent
                  issues={[post]}
                  center={[post.locationLat, post.locationLng]}
                  zoom={15}
                />
              </div>
            )}
          </div>

          {/* Status Timeline */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Administrative History
            </h3>

            <div className="relative pl-6 border-l-2 border-primary-200 space-y-6 py-2">
              <div className="relative">
                <div className="absolute -left-[31px] w-3.5 h-3.5 rounded-full bg-primary-600 border-2 border-white ring-2 ring-primary-100" />
                <p className="text-xs font-bold text-gray-900">Issue Reported</p>
                <p className="text-[10px] text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
              </div>

              {post.statusUpdates?.map((update: any) => (
                <div key={update.id} className="relative">
                  <div className="absolute -left-[31px] w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white ring-2 ring-emerald-100" />
                  <p className="text-xs font-bold text-gray-900 uppercase">
                    {update.newStatus.replace('_', ' ')}
                  </p>
                  <p className="text-[11px] text-gray-600">{update.note}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Updated by {update.authority?.fullName} &bull; {timeAgo(update.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

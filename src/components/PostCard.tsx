'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, MapPin, Flame, Images } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import { timeAgo, getCriticalityBadge } from '@/lib/utils';
import toast from 'react-hot-toast';

export interface PostCardProps {
  post: {
    id: string;
    title: string;
    description: string;
    category: string;
    criticality: string;
    status: string;
    janbinduScore: number;
    upvoteCount: number;
    downvoteCount: number;
    commentCount: number;
    shareCount: number;
    city?: string | null;
    state?: string | null;
    firstImage?: string | null;
    createdAt: string | Date;
    user?: {
      username: string;
      fullName: string;
    };
    userVote?: string | null;
  };
  onVoteChange?: (postId: string, newScore: number, userVote: string | null) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onVoteChange }) => {
  const criticality = getCriticalityBadge(post.criticality);
  const defaultImage =
    'https://images.unsplash.com/photo-1584467735815-f778f274e296?q=80&w=600&auto=format&fit=crop';

  const handleVote = async (e: React.MouseEvent, voteType: 'upvote' | 'downvote') => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('janbindu_token');
    if (!token) {
      toast.error('Please sign in to vote');
      return;
    }

    try {
      const res = await fetch(`/api/posts/${post.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ voteType }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Vote failed');
        return;
      }

      if (onVoteChange) {
        onVoteChange(post.id, data.score, data.userVote);
      }
    } catch {
      toast.error('Failed to vote');
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: `JanBindu Civic Issue: ${post.title}`,
          url,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }

    const token = localStorage.getItem('janbindu_token');
    if (token) {
      fetch(`/api/posts/${post.id}/share`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  };

  return (
    <article className="group bg-white rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1">
      <Link href={`/post/${post.id}`} className="block flex-1 flex flex-col">
        {/* Cover Image & Overlays */}
        <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.firstImage || defaultImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <CategoryBadge category={post.category} />
            {(post as any).imageCount > 1 && (
              <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs flex items-center gap-1">
                <Images className="w-3 h-3" />
                {(post as any).imageCount}
              </span>
            )}
          </div>

          {/* JanBindu Score Metric Tag */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-md text-xs font-black text-gray-900 border border-white/50">
            <Flame className="w-3.5 h-3.5 fill-accent-500 text-accent-500" />
            <span>{Math.round(post.janbinduScore || 0)}</span>
          </div>

          {/* Criticality indicator */}
          <div className="absolute bottom-3 left-3">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${criticality.bg} ${criticality.text} shadow-xs backdrop-blur-md`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${criticality.dot}`} />
              {criticality.label} Priority
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
              {post.title}
            </h3>

            <p className="mt-2 text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {post.description}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1 truncate max-w-[180px]">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">
                {post.city ? `${post.city}${post.state ? `, ${post.state}` : ''}` : 'Location Tagged'}
              </span>
            </div>

            <span>{timeAgo(post.createdAt)}</span>
          </div>
        </div>
      </Link>

      {/* Action Footer */}
      <div className="px-5 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
        {/* Voting mechanism */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 shadow-2xs">
          <button
            onClick={(e) => handleVote(e, 'upvote')}
            className={`p-1 rounded-md transition-colors flex items-center gap-1 text-xs font-semibold ${
              post.userVote === 'upvote'
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-gray-600 hover:bg-gray-100 hover:text-emerald-600'
            }`}
            title="Upvote issue"
          >
            <ArrowBigUp className="w-4 h-4" />
            <span>{post.upvoteCount || 0}</span>
          </button>

          <div className="w-[1px] h-3 bg-gray-200" />

          <button
            onClick={(e) => handleVote(e, 'downvote')}
            className={`p-1 rounded-md transition-colors ${
              post.userVote === 'downvote'
                ? 'text-red-700 bg-red-50'
                : 'text-gray-400 hover:bg-gray-100 hover:text-red-600'
            }`}
            title="Downvote"
          >
            <ArrowBigDown className="w-4 h-4" />
          </button>
        </div>

        {/* Comments & Status */}
        <div className="flex items-center gap-3">
          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary-600 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{post.commentCount || 0}</span>
          </Link>

          <button
            onClick={handleShare}
            className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
            title="Share issue"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <StatusBadge status={post.status} />
        </div>
      </div>
    </article>
  );
};

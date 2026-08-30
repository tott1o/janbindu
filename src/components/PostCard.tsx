'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  MapPin,
  Flame,
  Images,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import { timeAgo, getCriticalityBadge, formatDistance } from '@/lib/utils';
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
    address?: string | null;
    firstImage?: string | null;
    imagesList?: string[];
    imageCount?: number;
    createdAt: string | Date;
    user?: {
      username: string;
      fullName: string;
    };
    userVote?: string | null;
    distanceKm?: number | null;
    isNearby?: boolean;
  };
  onVoteChange?: (postId: string, newScore: number, userVote: string | null) => void;
  userCoords?: { lat: number; lng: number } | null;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onVoteChange }) => {
  const criticality = getCriticalityBadge(post.criticality);
  const defaultImage =
    'https://images.unsplash.com/photo-1584467735815-f778f274e296?q=80&w=600&auto=format&fit=crop';

  const images =
    post.imagesList && post.imagesList.length > 0
      ? post.imagesList
      : post.firstImage
      ? [post.firstImage]
      : [];
  const [activeImgIndex, setActiveImgIndex] = useState(0);

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

  const nextPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 1) {
      setActiveImgIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 1) {
      setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const distanceText = formatDistance(post.distanceKm || null);

  return (
    <article className="group bg-white rounded-2xl border border-slate-200/70 hover:border-slate-300 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Top Proximity Accent (Only if nearby) */}
      {post.isNearby && (
        <div className="bg-primary-50/80 border-b border-primary-100/60 px-3.5 py-1 flex items-center justify-between text-[11px] font-semibold text-primary-700">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary-600" />
            <span>Near you</span>
          </div>
          {distanceText && <span className="font-bold">{distanceText}</span>}
        </div>
      )}

      {/* Main Clickable Area */}
      <Link href={`/post/${post.id}`} className="block flex-1 flex flex-col">
        {/* Cover Photo */}
        <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[activeImgIndex] || defaultImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          />

          {/* Minimal Floating Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto">
              <CategoryBadge category={post.category} className="shadow-2xs text-[11px] py-0.5 px-2" />
            </div>

            {/* Score Pill */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[11px] font-bold text-slate-800 border border-white/40 shadow-2xs">
              <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{Math.round(post.janbinduScore || 0)}</span>
            </div>
          </div>

          {/* Multi-Photo Carousel Controls */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1">
                <Images className="w-3 h-3" />
                <span>
                  {activeImgIndex + 1}/{images.length}
                </span>
              </div>
            </>
          )}

          {/* Bottom Left Urgency Indicator */}
          <div className="absolute bottom-2.5 left-2.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${criticality.bg} backdrop-blur-sm shadow-2xs`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${criticality.dot}`} />
              {criticality.label}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900 line-clamp-1 group-hover:text-primary-600 transition-colors leading-snug">
              {post.title}
            </h3>

            <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {post.description}
            </p>
          </div>

          {/* Location & Time Subheader */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1 truncate max-w-[170px] text-slate-600 font-medium">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">
                {post.city ? `${post.city}${post.state ? `, ${post.state}` : ''}` : post.address || 'Location Tagged'}
              </span>
            </div>

            <span className="shrink-0">{timeAgo(post.createdAt)}</span>
          </div>
        </div>
      </Link>

      {/* Minimal Action Footer */}
      <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        {/* Voting Segment */}
        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
          <button
            onClick={(e) => handleVote(e, 'upvote')}
            className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 text-xs font-bold ${
              post.userVote === 'upvote'
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-slate-600 hover:bg-slate-100 hover:text-emerald-600'
            }`}
            title="Upvote"
          >
            <ArrowBigUp className="w-3.5 h-3.5" />
            <span>{post.upvoteCount || 0}</span>
          </button>

          <div className="w-[1px] h-3 bg-slate-200" />

          <button
            onClick={(e) => handleVote(e, 'downvote')}
            className={`p-1 rounded-md transition-colors ${
              post.userVote === 'downvote'
                ? 'text-red-700 bg-red-50'
                : 'text-slate-400 hover:bg-slate-100 hover:text-red-600'
            }`}
            title="Downvote"
          >
            <ArrowBigDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Interaction stats & status */}
        <div className="flex items-center gap-2">
          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-primary-600 hover:bg-white transition-colors"
          >
            <MessageSquare className="w-3 h-3" />
            <span>{post.commentCount || 0}</span>
          </Link>

          <button
            onClick={handleShare}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-white rounded-md transition-colors"
            title="Share"
          >
            <Share2 className="w-3 h-3" />
          </button>

          <StatusBadge status={post.status} className="text-[10px] py-0 px-2" />
        </div>
      </div>
    </article>
  );
};

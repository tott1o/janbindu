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
    <article className="group bg-white rounded-2xl border border-gray-200/90 hover:border-gray-300 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Main Clickable Card Body */}
      <Link href={`/post/${post.id}`} className="block flex-1 flex flex-col">
        {/* Cover Photo */}
        <div className="relative aspect-[16/10] w-full bg-gray-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[activeImgIndex] || defaultImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />

          {/* Floating Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto">
              <CategoryBadge category={post.category} className="shadow-2xs text-[11px] py-0.5 px-2" />
            </div>

            {/* Score Pill */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[11px] font-bold text-gray-800 shadow-2xs">
              <Flame className="w-3 h-3 text-accent-500 fill-accent-500" />
              <span>{Math.round(post.janbinduScore || 0)}</span>
            </div>
          </div>

          {/* Multi-Photo Switcher (Desktop hover / Mobile friendly) */}
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

              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1">
                <Images className="w-2.5 h-2.5" />
                <span>
                  {activeImgIndex + 1}/{images.length}
                </span>
              </div>
            </>
          )}

          {/* Urgency tag & Proximity Badge */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${criticality.bg} backdrop-blur-xs shadow-2xs`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${criticality.dot}`} />
              {criticality.label}
            </span>

            {post.isNearby && distanceText && (
              <span className="px-2 py-0.5 rounded-full bg-primary-600/90 text-white text-[10px] font-bold backdrop-blur-xs shadow-2xs">
                {distanceText}
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
          <div>
            <h3 className="text-base font-bold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
              {post.title}
            </h3>

            <p className="mt-1 text-xs text-gray-600 line-clamp-2 leading-relaxed">
              {post.description}
            </p>
          </div>

          {/* Location & Time Footer */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <div className="flex items-center gap-1 truncate max-w-[170px]">
              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate">
                {post.city ? `${post.city}${post.state ? `, ${post.state}` : ''}` : post.address || 'Location Tagged'}
              </span>
            </div>

            <span className="shrink-0">{timeAgo(post.createdAt)}</span>
          </div>
        </div>
      </Link>

      {/* Action Footer */}
      <div className="px-4 py-2 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
        {/* Voting Segment */}
        <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-2xs">
          <button
            onClick={(e) => handleVote(e, 'upvote')}
            className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 text-xs font-semibold ${
              post.userVote === 'upvote'
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-gray-600 hover:bg-gray-100 hover:text-emerald-600'
            }`}
            title="Upvote issue"
          >
            <ArrowBigUp className="w-3.5 h-3.5" />
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
            <ArrowBigDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Comments & Status */}
        <div className="flex items-center gap-2.5">
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

          <StatusBadge status={post.status} className="text-[10px] py-0 px-2" />
        </div>
      </div>
    </article>
  );
};

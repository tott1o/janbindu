'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PostCard } from '@/components/PostCard';
import { User, Mail, MapPin, Calendar, Layers, Edit3, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [city, setCity] = useState(user?.city || '');
  const [state, setState] = useState(user?.state || '');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setCity(user.city || '');
      setState(user.state || '');
    }
  }, [user]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      const token = localStorage.getItem('janbindu_token');
      if (!token) return;

      try {
        const res = await fetch('/api/posts?limit=50', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && user) {
          setMyPosts((data.posts || []).filter((p: any) => p.userId === user.id));
        }
      } catch {
        toast.error('Failed to load your posts');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [user]);

  const handleSaveProfile = async () => {
    const token = localStorage.getItem('janbindu_token');
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName, city, state }),
      });

      const data = await res.json();
      if (res.ok) {
        updateUser(data);
        setIsEditing(false);
        toast.success('Profile updated');
      }
    } catch {
      toast.error('Failed to update profile');
    }
  };

  if (!user) {
    return (
      <div className="py-24 text-center">
        <p className="text-gray-500">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
              {user.fullName?.charAt(0).toUpperCase()}
            </div>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="px-3 py-1 rounded-lg border border-gray-300 font-bold text-xl text-gray-900"
                />
              ) : (
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">{user.fullName}</h1>
              )}
              <p className="text-xs text-gray-500 font-medium">@{user.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wider">
              {user.role}
            </span>

            {isEditing ? (
              <button
                onClick={handleSaveProfile}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <span>{user.email}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            {isEditing ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="px-2 py-1 rounded border border-gray-300 text-xs w-24"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="px-2 py-1 rounded border border-gray-300 text-xs w-24"
                />
              </div>
            ) : (
              <span>
                {user.city || 'City'}{user.state ? `, ${user.state}` : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>Member since {new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* User Reported Issues */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Your Reported Issues ({myPosts.length})</h2>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-500">Loading your issues...</p>
          </div>
        ) : myPosts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500 font-medium">You haven&apos;t reported any civic issues yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

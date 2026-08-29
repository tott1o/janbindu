'use client';

import React, { useState, useEffect } from 'react';
import { MapComponent } from '@/components/MapComponent';
import { Loader2, Flame } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CivicMapPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await fetch('/api/posts?limit=100');
        const data = await res.json();
        if (res.ok) {
          setIssues(data.posts || []);
        }
      } catch {
        toast.error('Failed to load map data');
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  return (
    <div className="h-[calc(100vh-64px)] w-full relative flex flex-col">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : (
        <MapComponent issues={issues} center={[20.5937, 78.9629]} zoom={5} />
      )}
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Map as MapIcon, Plus } from 'lucide-react';

export const BottomDock: React.FC = () => {
  const pathname = usePathname();

  const isFeed = pathname === '/feed' || pathname === '/';
  const isMap = pathname === '/map';
  const isReport = pathname === '/create';

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/15 shadow-2xl pointer-events-auto transition-all">
      {/* 1. Feed Option */}
      <Link
        href="/feed"
        className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
          isFeed
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-300 hover:text-white hover:bg-white/10'
        }`}
      >
        <LayoutGrid className={`w-3.5 h-3.5 ${isFeed ? 'text-primary-600' : 'text-slate-400'}`} />
        <span>Feed</span>
      </Link>

      {/* 2. Map Option */}
      <Link
        href="/map"
        className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
          isMap
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-300 hover:text-white hover:bg-white/10'
        }`}
      >
        <MapIcon className={`w-3.5 h-3.5 ${isMap ? 'text-primary-600' : 'text-slate-400'}`} />
        <span>Map</span>
      </Link>

      {/* Divider */}
      <div className="w-[1px] h-4 bg-white/20 mx-0.5" />

      {/* 3. Report Option */}
      <Link
        href="/create"
        className={`flex items-center gap-1 px-3.5 py-1.5 sm:px-4 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all active:scale-95 whitespace-nowrap shadow-xs ${
          isReport
            ? 'bg-primary-500 text-white ring-2 ring-white/40'
            : 'bg-primary-600 hover:bg-primary-500 text-white'
        }`}
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Report</span>
      </Link>
    </div>
  );
};

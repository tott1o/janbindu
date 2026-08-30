'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CATEGORIES } from '@/lib/utils';
import {
  ChevronDown,
  Check,
  Tag,
  Construction,
  Droplets,
  Zap,
  Trash2,
  ShieldAlert,
  HeartPulse,
  GraduationCap,
  Trees,
  Bus,
  HelpCircle,
} from 'lucide-react';

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  allowAll?: boolean;
  label?: string;
  className?: string;
  placeholder?: string;
}

// Icon mapping for each civic category
export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  roads: <Construction className="w-4 h-4 text-amber-600" />,
  water: <Droplets className="w-4 h-4 text-blue-600" />,
  electricity: <Zap className="w-4 h-4 text-yellow-500" />,
  waste: <Trash2 className="w-4 h-4 text-emerald-600" />,
  safety: <ShieldAlert className="w-4 h-4 text-red-600" />,
  healthcare: <HeartPulse className="w-4 h-4 text-pink-600" />,
  education: <GraduationCap className="w-4 h-4 text-purple-600" />,
  environment: <Trees className="w-4 h-4 text-teal-600" />,
  transport: <Bus className="w-4 h-4 text-orange-600" />,
  other: <HelpCircle className="w-4 h-4 text-slate-500" />,
};

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  allowAll = false,
  className = '',
  placeholder = 'Select Category',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find selected category object
  const selectedCat = CATEGORIES.find((c) => c.value === value);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 hover:border-gray-400 bg-white text-left text-xs sm:text-sm font-medium text-gray-800 flex items-center justify-between shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2.5 truncate">
          {value ? (
            <>
              <span className="p-1 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                {CATEGORY_ICONS[value] || <Tag className="w-4 h-4 text-gray-400" />}
              </span>
              <span className="truncate font-semibold text-gray-900">
                {selectedCat?.label || value}
              </span>
            </>
          ) : (
            <>
              <Tag className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-500 font-normal">{placeholder}</span>
            </>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-primary-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-200/90 py-1.5 z-50 max-h-72 overflow-y-auto animate-in fade-in-50 zoom-in-95">
          {allowAll && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm transition-colors flex items-center justify-between ${
                value === ''
                  ? 'bg-primary-50 text-primary-700 font-bold'
                  : 'text-gray-700 hover:bg-gray-50 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-600 font-bold">
                  ★
                </span>
                <span>All Categories</span>
              </div>
              {value === '' && <Check className="w-4 h-4 text-primary-600" />}
            </button>
          )}

          {CATEGORIES.map((cat) => {
            const isSelected = value === cat.value;
            const icon = CATEGORY_ICONS[cat.value] || <Tag className="w-4 h-4 text-gray-400" />;

            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => {
                  onChange(cat.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm transition-colors flex items-center justify-between ${
                  isSelected
                    ? 'bg-primary-50 text-primary-700 font-bold'
                    : 'text-gray-700 hover:bg-gray-50 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="p-1 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    {icon}
                  </span>
                  <span className="truncate">{cat.label}</span>
                </div>

                {isSelected && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

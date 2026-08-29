import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'just now';
  const now = new Date();
  const date = new Date(dateInput);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export const CATEGORIES = [
  { value: 'roads', label: 'Roads & Infrastructure', color: 'bg-gray-100 text-gray-800' },
  { value: 'water', label: 'Water & Sanitation', color: 'bg-blue-100 text-blue-800' },
  { value: 'electricity', label: 'Electricity & Streetlights', color: 'bg-amber-100 text-amber-800' },
  { value: 'waste', label: 'Waste Management', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'safety', label: 'Public Safety', color: 'bg-red-100 text-red-800' },
  { value: 'healthcare', label: 'Healthcare Facilities', color: 'bg-pink-100 text-pink-800' },
  { value: 'education', label: 'Education Infrastructure', color: 'bg-purple-100 text-purple-800' },
  { value: 'environment', label: 'Environment & Pollution', color: 'bg-teal-100 text-teal-800' },
  { value: 'transport', label: 'Public Transportation', color: 'bg-orange-100 text-orange-800' },
  { value: 'other', label: 'Other Civic Issues', color: 'bg-slate-100 text-slate-800' },
];

export function getCategoryInfo(categoryVal: string) {
  return (
    CATEGORIES.find((c) => c.value === categoryVal) || {
      value: categoryVal,
      label: categoryVal.charAt(0).toUpperCase() + categoryVal.slice(1),
      color: 'bg-gray-100 text-gray-800',
    }
  );
}

export function getCriticalityBadge(criticality: string) {
  switch (criticality) {
    case 'critical':
      return { label: 'Critical', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-600' };
    case 'high':
      return { label: 'High', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' };
    case 'medium':
      return { label: 'Medium', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' };
    default:
      return { label: 'Low', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' };
  }
}

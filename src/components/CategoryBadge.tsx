import React from 'react';
import { getCategoryInfo } from '@/lib/utils';

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className = '' }) => {
  const info = getCategoryInfo(category);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${info.color} ${className}`}
    >
      {info.label}
    </span>
  );
};

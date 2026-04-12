'use client';

import { ExternalLink, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { NewsItem } from '@/types';

interface NewsCardProps {
  item: NewsItem;
}

export function NewsCard({ item }: NewsCardProps) {
  const timeAgo = formatDistanceToNow(new Date(item.datetime * 1000), {
    addSuffix: true,
  });

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 p-4 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl transition-all duration-150"
    >
      {/* Thumbnail */}
      {item.image ? (
        <div className="shrink-0 w-20 h-16 rounded-lg overflow-hidden bg-gray-800">
          <img
            src={item.image}
            alt=""
            width={80}
            height={64}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="shrink-0 w-20 h-16 rounded-lg bg-gray-800 flex items-center justify-center">
          <ExternalLink size={18} className="text-gray-700" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium leading-snug line-clamp-2 group-hover:text-emerald-400 transition-colors mb-2">
          {item.headline}
        </p>
        {item.summary && (
          <p className="text-gray-600 text-xs leading-relaxed line-clamp-2 mb-2">
            {item.summary}
          </p>
        )}
        <div className="flex items-center gap-3 text-[11px] text-gray-700">
          <span className="font-medium text-gray-500">{item.source}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {timeAgo}
          </span>
          <ExternalLink
            size={10}
            className="ml-auto opacity-0 group-hover:opacity-100 text-gray-500 transition-opacity"
          />
        </div>
      </div>
    </a>
  );
}
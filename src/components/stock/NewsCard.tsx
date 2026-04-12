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
      className="group flex gap-3 sm:gap-4 p-3 sm:p-4 bg-card border border-border hover:border-primary/30 transition-all duration-150"
    >
      {/* Thumbnail */}
      {item.image ? (
        <div className="shrink-0 w-16 sm:w-20 h-14 sm:h-16 overflow-hidden bg-secondary">
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
        <div className="shrink-0 w-16 sm:w-20 h-14 sm:h-16 bg-secondary flex items-center justify-center">
          <ExternalLink size={18} className="text-muted-foreground/30" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1.5 sm:mb-2">
          {item.headline}
        </p>
        {item.summary && (
          <p className="text-muted-foreground/50 text-xs leading-relaxed line-clamp-2 mb-1.5 sm:mb-2 hidden sm:block">
            {item.summary}
          </p>
        )}
        <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-muted-foreground/50 min-w-0">
          <span className="font-medium text-muted-foreground/70 truncate max-w-[80px] sm:max-w-none">
            {item.source}
          </span>
          <span className="flex-shrink-0">•</span>
          <span className="flex items-center gap-1 flex-shrink-0">
            <Clock size={10} />
            <span className="hidden xs:inline sm:inline">{timeAgo}</span>
          </span>
          <ExternalLink
            size={10}
            className="ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground/60 transition-opacity"
          />
        </div>
      </div>
    </a>
  );
}

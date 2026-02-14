'use client';

import * as React from 'react';
import Image from 'next/image';
import { Globe, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  icon?: string;
  siteName?: string;
}

// Extract first URL from text content
function extractFirstUrl(text: string): string | null {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/i;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}

// Simple in-memory client cache
const previewCache = new Map<string, LinkPreviewData | null>();

export function AutoLinkPreview({ content, className }: { content: string; className?: string }) {
  const [preview, setPreview] = React.useState<LinkPreviewData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const url = React.useMemo(() => extractFirstUrl(content), [content]);

  React.useEffect(() => {
    if (!url) return;

    // Check client cache
    if (previewCache.has(url)) {
      setPreview(previewCache.get(url) || null);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();

    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data.title) {
          previewCache.set(url, data);
          setPreview(data);
        } else {
          previewCache.set(url, null);
        }
      })
      .catch(() => {
        previewCache.set(url, null);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [url]);

  if (!url || (!preview && !isLoading)) return null;

  if (isLoading) {
    return (
      <div className={cn("mt-3 rounded-xl border bg-muted/30 animate-pulse", className)}>
        <div className="h-40 bg-muted/50 rounded-t-xl" />
        <div className="p-3 space-y-2">
          <div className="h-3 w-24 bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
          <div className="h-3 w-full bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!preview) return null;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "block mt-3 rounded-xl border overflow-hidden bg-card hover:bg-muted/30 transition-colors group",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Preview image */}
      {preview.image && (
        <div className="relative aspect-[2/1] w-full overflow-hidden bg-muted">
          <Image
            src={preview.image}
            alt={preview.title || 'Link preview'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 600px"
            unoptimized
          />
        </div>
      )}

      {/* Preview content */}
      <div className="px-4 py-3 space-y-1.5">
        {/* Site info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {preview.icon ? (
            <Image src={preview.icon} alt="" width={16} height={16} className="rounded-sm" unoptimized />
          ) : (
            <Globe className="h-3.5 w-3.5" />
          )}
          <span className="truncate">{preview.siteName || new URL(preview.url).hostname}</span>
          <ExternalLink className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Title */}
        {preview.title && (
          <p className="font-semibold text-sm line-clamp-2 leading-tight">
            {preview.title}
          </p>
        )}

        {/* Description */}
        {preview.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {preview.description}
          </p>
        )}
      </div>
    </a>
  );
}

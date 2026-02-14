import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache for link previews (per server instance)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Check cache
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'KrishnaConnect/2.0 (Link Preview Bot)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 502 });
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return NextResponse.json({ url, title: parsedUrl.hostname });
    }

    // Read only first 50KB to avoid large payloads
    const reader = res.body?.getReader();
    if (!reader) {
      return NextResponse.json({ url, title: parsedUrl.hostname });
    }

    let html = '';
    const decoder = new TextDecoder();
    let totalBytes = 0;
    const MAX_BYTES = 50000;

    while (totalBytes < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      totalBytes += value.length;
    }
    reader.cancel();

    // Extract OG metadata using regex (no DOM parser needed)
    const getMetaContent = (property: string): string | undefined => {
      const patterns = [
        new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i'),
      ];
      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match?.[1]) return match[1];
      }
      return undefined;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

    const data = {
      url,
      title: getMetaContent('og:title') || getMetaContent('twitter:title') || titleMatch?.[1]?.trim() || parsedUrl.hostname,
      description: getMetaContent('og:description') || getMetaContent('twitter:description') || getMetaContent('description'),
      image: getMetaContent('og:image') || getMetaContent('twitter:image'),
      icon: getMetaContent('icon') || `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=32`,
      siteName: getMetaContent('og:site_name') || parsedUrl.hostname,
    };

    // Resolve relative image URLs
    if (data.image && !data.image.startsWith('http')) {
      data.image = new URL(data.image, url).href;
    }

    // Cache the result
    cache.set(url, { data, timestamp: Date.now() });

    return NextResponse.json(data);
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return NextResponse.json({ url, title: parsedUrl.hostname, error: 'Timeout' });
    }
    return NextResponse.json({ url, title: parsedUrl.hostname });
  }
}

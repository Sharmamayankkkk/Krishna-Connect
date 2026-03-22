/** @type {import('next').NextConfig} */

const nextConfig = {
  devIndicators: false,
  trailingSlash: false,
  async headers() {
    return [
      {
        // iOS Universal Links — Apple requires Content-Type: application/json
        source: '/.well-known/apple-app-site-association',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        // Android App Links
        source: '/.well-known/assetlinks.json',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        // robots.txt — cache aggressively so bots don't hammer it and get 429'd
        source: '/robots.txt',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' },
        ],
      },
      {
        // llms.txt — for AI crawler discoverability
        source: '/llms.txt',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' },
        ],
      },
      {
        // sitemap — cache for 24hrs, bots fetch this frequently
        source: '/sitemap.xml',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' },
        ],
      },
    ];
  },
  images: {
    unoptimized: true, // Next.js can't proxy Worker/CDN URLs server-side; compression handled via Supabase transform API
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'madhavstore.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.workers.dev' },
    ],
  },
}

module.exports = nextConfig
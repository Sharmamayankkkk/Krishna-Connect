/** @type {import('next').NextConfig} */

const nextConfig = {
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

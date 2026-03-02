/** @type {import('next').NextConfig} */

const nextConfig = {
  trailingSlash: false,
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

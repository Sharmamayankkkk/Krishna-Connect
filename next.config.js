/** @type {import('next').NextConfig} */

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : '';

const nextConfig = {
  trailingSlash: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'madhavstore.com',
      },
      ...(supabaseHostname ? [{
        protocol: 'https',
        hostname: supabaseHostname,
      }] : []),
    ],
  },
}

module.exports = nextConfig

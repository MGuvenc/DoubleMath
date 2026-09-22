/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "scontent*.cdninstagram.com" },
      { protocol: "https", hostname: "instagram.*.fbcdn.net" }
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb"
    }
  }
};

module.exports = nextConfig;

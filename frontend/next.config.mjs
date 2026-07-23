/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/:path*`
          : process.env.NODE_ENV === 'production'
            ? 'http://api:4000/api/v1/:path*'
            : 'http://localhost:4000/api/v1/:path*',
      },
    ];
  },
}

export default nextConfig

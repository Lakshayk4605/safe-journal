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
    const targetApi = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith('http'))
      ? process.env.NEXT_PUBLIC_API_URL
      : 'https://api-production-cb6e6.up.railway.app/api/v1';

    return [
      {
        source: '/api/v1/:path*',
        destination: `${targetApi}/:path*`,
      },
    ];
  },
}

export default nextConfig

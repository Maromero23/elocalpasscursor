/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost'],
  },
  // Disable static generation for problematic pages
  trailingSlash: false,
  generateBuildId: () => 'build',
}

module.exports = nextConfig

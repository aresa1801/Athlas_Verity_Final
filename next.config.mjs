/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Catch TypeScript errors during build to prevent deployment failures
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // Enable strict mode for better error detection
  reactStrictMode: true,
  // SWC minification for better performance
  swcMinify: true,
  // Optimize production builds
  productionBrowserSourceMaps: false,
  // Improve build output
  optimizeFonts: true,
}

export default nextConfig

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Configure for static export
  output: "export",
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  
  // Ensure proper 404 handling for static hosting
  async generateBuildId() {
    return 'build'
  },
};

export default nextConfig;


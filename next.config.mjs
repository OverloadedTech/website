/** @type {import("next").NextConfig} */
const nextConfig = {
  // Configure for static export
  output: "export",
  trailingSlash: false,
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;



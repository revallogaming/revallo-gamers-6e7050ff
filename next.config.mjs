/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // next 15+ options
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;

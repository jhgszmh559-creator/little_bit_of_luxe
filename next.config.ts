import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'ik.imgkit.net',
      },
      {
        protocol: 'https',
        hostname: 'www.aman.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.hyatt.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.prod.website-files.com',
      },
      {
        protocol: 'https',
        hostname: 'media.iceportal.com',
      },
    ],
  },
};

export default nextConfig;

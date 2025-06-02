/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['api.magicapi.dev', 'prod.api.market', 'dtu1vvf8tvi89.cloudfront.net'],
  },
  env: {
    IMAGE_API_URL: process.env.IMAGE_API_URL || 'https://api.magicapi.dev/api/v1/magicapi/image-upload',
    VIDEO_API_URL: process.env.VIDEO_API_URL || 'https://prod.api.market/api/v1/magicapi/wan-text-to-image',
  }
};

module.exports = nextConfig;

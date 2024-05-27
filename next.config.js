/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  images: {
    domains: ['mighty-sshs.s3.ap-northeast-2.amazonaws.com'],
  },
  async rewrites() {
    return [
      {
        source: '/signout',
        destination: '/api/signout',
      },
    ];
  },
};

module.exports = nextConfig;

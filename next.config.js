module.exports = {
  images: {
    domains: ['cdn.coxwave.com'],
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

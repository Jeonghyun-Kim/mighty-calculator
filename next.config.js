module.exports = {
  async rewrites() {
    return [
      {
        source: '/signout',
        destination: '/api/signout',
      },
    ];
  },
};

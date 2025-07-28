/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  compiler: {
    styledComponents: true
  },
  transpilePackages: ['@pageflow/types', '@pageflow/utils'],
  images: {
    domains: ['placeholder.com']
  }
};

module.exports = nextConfig;
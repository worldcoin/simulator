const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "world-id-public.s3.amazonaws.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "world-id-assets.com",
        port: "",
        pathname: "**",
      },
    ],
  },

  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      // NOTE: https://github.com/wagmi-dev/create-wagmi/blob/main/templates/next/connectkit/next.config.js
      fs: false,
      net: false, // NOTE: Fallback for legacy WalletConnect v1 (loaded through wagmi)
      tls: false, // NOTE: Fallback for legacy WalletConnect v1 (loaded through wagmi)
    };
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);

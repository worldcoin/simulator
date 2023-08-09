/** @type {import('next-safe').nextSafe} */
const nextSafe = require("next-safe");

const isDev = process.env.NODE_ENV !== "production";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: nextSafe({
          isDev,
          contentSecurityPolicy: {
            mergeDefaultDirectives: true,
            "img-src": [
              "'self'",
              "https://world-id-public.s3.amazonaws.com",
              "https://worldcoin.org",
            ],
            "style-src": ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
            "prefetch-src": false,
            "connect-src": [
              "'self'",
              "wss://relay.walletconnect.com",
              "https://app.posthog.com",
            ],
            "script-src": ["'self'", "https://app.posthog.com"],
          },
          permissionsPolicy: {
            "clipboard-write": `self`,
          },
        }),
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "world-id-public.s3.amazonaws.com",
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

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
              "wss://www.walletlink.org/rpc",
              "wss://*.bridge.walletconnect.org",
              "https://app.posthog.com",
              "https://status.worldcoin.org",
            ],
            "script-src": [
              "'self'",
              "'unsafe-eval'",
              "https://storage.googleapis.com",
              "'sha256-JPvpq7njEeX0V6q+ifkLzYVVK7l/7R+QtUoSdPw7Zdo='",
              "https://app.posthog.com",
            ],
            "frame-src": ["'self'", "https://verify.walletconnect.com/"],
          },
          permissionsPolicy: {
            camera: `self`,
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

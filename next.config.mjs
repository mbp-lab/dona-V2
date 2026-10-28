import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";
import createNextIntlPlugin from "next-intl/plugin";
import { validateEnv } from "./src/services/validateEnv.mjs";

const env = validateEnv();
const parseOriginList = value =>
  value
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
const devOrigins = process.env.DEV_ALLOWED_ORIGINS
  ? parseOriginList(process.env.DEV_ALLOWED_ORIGINS)
  : ["127.0.0.1", "127.0.0.1:3000", "127.0.0.1:9012", "localhost:3000"];
// Next.js compares these with the host of the request origin, so they are host[:port] without a scheme
const serverActionOrigins = parseOriginList(process.env.SERVER_ACTIONS_ALLOWED_ORIGINS ?? "");
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Inlines the validated settings at build time, for server and client code alike
  env,
  allowedDevOrigins: devOrigins,
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
      allowedOrigins: serverActionOrigins
    }
  },
  // Tell Next.js to skip bundling sql.js - it will be loaded dynamically at runtime
  transpilePackages: [],
  webpack: (config, { isServer }) => {
    // Ignores fs module so that sql.js can be used in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
      // Also add alias to ensure fs is not bundled
      config.resolve.alias = {
        ...config.resolve.alias,
        fs: false,
        path: false,
      };
      // Mark sql.js as external for client bundles - it will be loaded via CDN or dynamic import
      config.externals = config.externals || [];
      config.externals.push({
        'sql.js': 'sql.js',
        'sql.js/dist/sql-wasm.js': 'sql.js'
      });
    }
    // Allows loading svg from .svg file with SVGR
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            svgo: false,
            titleProp: true,
            ref: true,
          },
        },
      ],
    });
    return config;
  }
};

export default phase => {
  // The dev origins may also call server actions, but only on the dev server
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    nextConfig.experimental.serverActions.allowedOrigins = [...devOrigins, ...serverActionOrigins];
  }
  return withNextIntl(nextConfig);
};

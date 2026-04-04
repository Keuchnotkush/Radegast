import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@dynamic-labs/sdk-react-core",
    "@dynamic-labs/ethereum",
    "@dynamic-labs/ethers-v6",
  ],
  webpack: (config, { isServer }) => {
    // bb.js and noir WASM support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
      layers: true,
    };
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });
    return config;
  },
};

export default nextConfig;
